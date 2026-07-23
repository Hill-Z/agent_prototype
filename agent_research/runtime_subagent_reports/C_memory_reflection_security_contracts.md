# 子任务 C：记忆、反思、安全、权限与数据契约详细设计

> 输出文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\runtime_subagent_reports\C_memory_reflection_security_contracts.md`  
> 覆盖维度：11 Memory 抽取与写入时机、12 Reflection 触发策略、13 Guardrail 执行顺序、14 Permission/Identity 策略、15 用户确认策略、29 Safety/Compliance Runtime 策略、36 Data Contract 策略。

## 0. 总推荐结论

| 主题 | 推荐方案 | 核心理由 |
|---|---|---|
| 11 Memory 抽取与写入时机 | 分层记忆 + 候选抽取 + 策略写入 | 保留短期上下文，避免长期记忆污染 |
| 12 Reflection 触发策略 | 默认不每轮触发，仅对高风险、冲突、灰度、强情绪触发 | 降低延迟和成本，保留必要复核 |
| 13 Guardrail 执行顺序 | Input -> Permission/Confirm -> Tool Input -> Tool Output -> Reflection -> Output | 先挡风险，再修复，再兜底 |
| 14 Permission / Identity | 身份置信度 + RBAC + 能力门控 + 租户/渠道绑定 | 最小权限且可动态收缩 |
| 15 用户确认策略 | 风险分级确认 + checkpoint + 超时回落 | 兼顾体验与高风险可控性 |
| 29 Safety / Compliance Runtime | PII 红线前置 + 轨迹脱敏 + 保留策略 + 审计门禁 | 把合规做成运行时能力 |
| 36 Data Contract 策略 | 统一 schema + versioning + replay-compatible envelope | 跨 Tool / Memory / Trace / Eval 一致可演进 |

---

# 11. Memory 抽取与写入时机

## 设计目标

把“聊天记录”拆成不同生命周期的记忆：本轮变量、会话变量、checkpoint、长期记忆。目标不是记得越多越好，而是记得对当前任务有用、对长期任务稳定、对隐私安全可控。

## 运行时流程

```text
user / tool / human event
  -> candidate extraction
  -> classify: turn_state / session_memory / checkpoint / long_term_candidate
  -> policy filter: consent / confidence / pii / ttl / scope
  -> dedupe + conflict check
  -> write memory or queue review
  -> retrieval by scope in later turns
  -> compaction when context grows
```

## 关键策略

- 当前轮临时变量写 `turn_state`，例如本轮抽到的订单号候选、用户情绪、当前意图。
- 会话内短期状态写 `session_memory`，例如 wuid、当前订单、已确认手机号、工具返回摘要。
- 流程恢复所需内容写 `checkpoint`，例如 pending approval、已调用工具、当前 workflow node。
- 长期偏好写 `long_term_memory`，但必须满足明确表达、稳定偏好、高置信、合规允许。
- PII 默认不进长期记忆，除非有明确业务必要、脱敏、TTL、权限限制。
- 压缩不只做自然语言摘要，必须保留结构化决策状态。

## 方案对比

| 方案 | 优点 | 缺点 | 适用 |
|---|---|---|---|
| 只存聊天摘要 | 实现简单、成本低 | 容易丢状态，不能稳定恢复 | Demo/轻量 FAQ |
| 全量长期记忆 | 模型信息多 | 污染高、隐私风险大、难删除 | 不推荐 |
| 分层记忆 + 策略写入 | 可控、可审计、可恢复 | 设计和实现复杂 | 企业生产推荐 |

## 推荐方案

采用 **分层记忆 + 候选抽取 + 写入策略 + compaction-aware state**。长期记忆默认不自动写，先作为候选，由规则或人审决定。

## 配置项

```yaml
memory:
  turn_state:
    enabled: true
  session:
    ttl: conversation
    pii_mode: masked
  checkpoint:
    persist_nodes: [tool_call, approval_pending, handoff_pending]
  long_term:
    enabled: true
    default_write_policy: explicit_or_review
    min_confidence: 0.9
    require_consent_for: [preference_sensitive, pii, health, finance]
  conflict_strategy: source_priority_then_review
  compaction:
    trigger_token_ratio: 0.75
    keep_keys: [user_goal, confirmed_facts, pending_approval, actions_taken, do_not_repeat]
```

## 数据结构 / schema

```json
{
  "schema_version": "1.0",
  "entity_type": "MemoryItem",
  "memory_scope": "turn|session|checkpoint|long_term",
  "key": "user.preference.skincare_avoid_ingredient",
  "value": "alcohol",
  "source": "user_explicit|tool|human|inferred",
  "confidence": 0.98,
  "ttl_seconds": 2592000,
  "pii_class": "none|masked|sensitive",
  "allowed_skills": ["product-recommend"],
  "write_policy": "auto|explicit|review|required_consent",
  "conflict_strategy": "human_review",
  "created_at": "RFC3339",
  "expires_at": "RFC3339"
}
```

## 用户体验表现

- 普通会话中记忆写入不打断用户。
- 写长期偏好时可轻提示：“我会记住你不想推荐含酒精护肤品，后续推荐会避开。”
- 用户可在隐私/记忆页面查看、编辑、删除长期记忆。
- 撤回后立即失效，不再进入 Prompt。

## 异常分支

- 记忆候选冲突：不自动覆盖，进入冲突队列。
- PII 命中：默认 masked 或拒写。
- compaction 丢失 pending approval：阻断恢复并报警。
- 用户撤回授权：删除或 tombstone，避免回放重新写入。

## 评测 / 验收标准

- 压缩前后业务决策一致率 ≥ 99%。
- 长期记忆误写率低于阈值。
- PII 长期落库违规为 0。
- 记忆读取权限测试 100% 通过。
- 用户删除记忆后，后续 Prompt 不再包含该记忆。

## 借鉴项目具体机制

- OpenAI Agents SDK Session Protocol 的 get/add/pop/clear 思路。
- LangGraph checkpoint/store 的可恢复状态思想。
- Anthropic/Codex 的上下文压缩与“不要丢关键状态”的实践。

---

# 12. Reflection 触发策略

## 设计目标

Reflection 不是“开关”，而是风险复核器。目标是在成本和延迟可控的情况下，降低幻觉、错误承诺、工具结果误用和高风险动作事故。

## 运行时流程

```text
model draft / tool result / risk event
  -> reflection trigger detector
  -> if triggered: reflection model/checker
  -> structured reflection result
  -> decision: allow / repair / ask / retry / handoff / block
  -> final guardrail
```

## 触发条件

- 工具返回空或异常。
- 工具结果与用户陈述冲突。
- 回复涉及退款、赔偿、取消、修改地址、隐私查询。
- 输出包含承诺类表达：一定、保证、马上到账、一定赔偿。
- 用户情绪强烈或投诉升级。
- 路由置信度低。
- 灰度/canary/线上抽样评测。

## 方案对比

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 每轮 Reflection | 最保守 | 慢、贵、用户等待长 | 不推荐默认 |
| 风险条件触发 | 性能好，关键点复核 | 依赖触发规则质量 | 推荐 P0 |
| 风险触发 + 线上采样 | 可发现未知问题 | 复杂度增加 | 推荐 P1 |

## 推荐方案

线上默认 **风险硬触发 + 灰度采样触发**。反思模型可用较强模型，但要有 max latency；失败时走保守 fallback。

## 配置项

```yaml
reflection:
  enabled: true
  mode: conditional
  trigger_rules:
    tool_empty: true
    tool_user_conflict: true
    high_risk_action: true
    commitment_terms: true
    angry_user: true
    low_router_confidence_below: 0.55
  sample_rate:
    production_low_risk: 0.02
    canary: 0.2
  model_policy: strong_for_high_risk_small_for_low_risk
  max_latency_ms: 1500
  allow_tool_calls: false
```

## 数据结构 / schema

```json
{
  "schema_version": "1.0",
  "reflection_id": "rf_123",
  "trigger_reason": ["tool_empty", "high_risk_claim"],
  "facts_checked": ["refund_status", "order_id"],
  "risks": ["unsupported_compensation_claim"],
  "needs_handoff": true,
  "needs_user_confirmation": false,
  "final_answer_allowed": false,
  "repair_action": "handoff_to_human",
  "confidence": 0.91
}
```

## 用户体验表现

用户不应看到“我在反思”。若 reflection 触发修复，表现为更稳妥的回答：

- “我这边还不能确认具体到账时间，避免给你错误承诺，我帮你转售后同事确认。”

## 异常分支

- Reflection 超时：使用保守输出或转人工。
- Reflection 输出 schema 失败：重试一次，仍失败则视为不放行。
- Reflection 与主模型冲突：高风险场景取更保守结论。

## 验收标准

- 高风险样本 reflection 召回率达标。
- 低风险误触发率可控。
- 平均额外延迟在预算内。
- Reflection 结果进入 trace，可回放。

---

# 13. Guardrail 执行顺序

## 设计目标

把 Guardrail 从“输出前敏感词检查”升级为运行时分层安全链，覆盖输入、权限、工具输入、工具输出、反思、最终输出。

## 推荐执行顺序

```text
Input Guardrail
  -> Identity / Permission Check
  -> User Confirmation / Approval Check
  -> Tool Input Guardrail
  -> Tool Execution
  -> Tool Output Guardrail
  -> Reflection if needed
  -> Output Guardrail
  -> Channel Policy Guardrail
  -> Send
```

## 方案对比

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 只做输出检查 | 简单 | 工具风险已发生，太晚 | 不推荐 |
| 输入 + 输出检查 | 可挡一部分风险 | 工具参数和工具结果仍失控 | 不足 |
| 四层 Guardrail + 修复 | 风险闭环完整 | 实现复杂 | 推荐 |

## 推荐方案

采用四层护栏加权限/确认门控：

- Input：注入、辱骂、越权意图、敏感主题。
- Tool Input：参数完整性、身份一致性、权限、写操作确认。
- Tool Output：PII 脱敏、异常字段、错误码归一化。
- Output：事实依据、承诺风险、格式、渠道政策。

## 配置项

```yaml
guardrails:
  - id: no_cross_user_order_query
    stage: tool_input
    severity: critical
    condition: tool.name == 'query_order' and args.wuid != session.wuid
    action: block_and_handoff
  - id: no_fake_logistics_status
    stage: output
    severity: high
    condition: answer_mentions_logistics_without_tool_evidence
    action: block_and_repair
    repair: call_tool_or_handoff
```

## 数据结构 / schema

```json
{
  "guardrail_result": {
    "policy_id": "no_fake_logistics_status",
    "stage": "output",
    "triggered": true,
    "severity": "high",
    "action": "block_and_repair",
    "repair_action": "handoff_to_human",
    "evidence_refs": ["draft_answer", "missing_tool_evidence"],
    "trace_id": "tr_123"
  }
}
```

## 异常分支

- Guardrail 系统不可用：高风险场景默认阻断，低风险保守回复。
- 策略冲突：更高 severity 优先。
- 修复失败：转人工或拒答。

## 验收标准

- 每条 guardrail 有 stage、condition、action、severity。
- 高风险 safety eval 100% 通过。
- Guardrail 命中可在 trace 中查看。
- 修复动作成功率可统计。

---

# 14. Permission / Identity 策略

## 设计目标

确认“谁在请求、能看什么、能做什么、在哪个渠道/租户/环境下做”。权限不是静态开关，而是运行时动态能力门控。

## 运行时流程

```text
channel identity
  -> identity resolution
  -> confidence scoring
  -> tenant isolation check
  -> RBAC role loading
  -> capability policy evaluation
  -> available tools/actions/handoffs filtered
  -> per-action permission check before execution
```

## 身份来源

- 登录态。
- 手机号 OTP。
- openid / unionid。
- 会员 ID。
- 企业账号 SSO。
- 人工确认。
- 匿名用户。

## 方案对比

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 只看是否登录 | 简单 | 无法处理跨渠道、代理人、低置信身份 | 不足 |
| RBAC + 登录态 | 企业后台够用 | 用户侧个人数据仍风险高 | 基础 |
| 身份置信度 + RBAC + capability policy | 安全且灵活 | 配置复杂 | 推荐 |

## 推荐方案

采用三层模型：

1. Identity confidence：身份可信度。
2. RBAC：后台用户和人工客服权限。
3. Capability policy：当前 Agent 是否可执行某动作。

## 配置项

```yaml
identity:
  min_confidence:
    read_public: 0.0
    read_personal: 0.75
    write_low_risk: 0.85
    write_high_risk: 0.95
  sources_priority: [sso, app_login, wechat_unionid, otp_phone, manual_confirm]
capabilities:
  order.query:
    requires_identity_confidence: 0.75
    allowed_channels: [web, app, wechat]
  refund.create:
    requires_identity_confidence: 0.95
    requires_confirmation: true
    requires_approval: true
```

## 数据结构 / schema

```json
{
  "identity_context": {
    "tenant_id": "t_123",
    "channel": "wechat",
    "uagent_user_id": "user_123",
    "external_user_id": "openid_xxx",
    "auth_method": "wechat_unionid",
    "identity_confidence": 0.86,
    "roles": ["customer"],
    "capabilities": ["order.query", "refund.check"],
    "verified_at": "RFC3339"
  }
}
```

## 用户体验表现

- 低置信身份时：提示登录或验证，不暴露个人数据。
- 权限不足时：解释原因并给下一步，如“为了保护账户安全，请先登录后查询订单”。

## 验收标准

- 跨用户查询 100% 阻断。
- 无身份用户不可调用个人数据工具。
- 权限变化后可立即生效。
- 所有权限拒绝进入 trace。

---

# 15. 用户确认策略

## 设计目标

把高风险动作前确认做成标准状态，而不是一句自然语言。确认要可展示、可审计、可恢复、可超时取消。

## 运行时流程

```text
action intent detected
  -> risk classify
  -> if confirmation required: build confirmation payload
  -> send confirm card/text
  -> interrupt workflow
  -> user confirms/rejects/times out
  -> revalidate state
  -> execute or cancel
  -> write checkpoint and trace
```

## 风险分级

| 等级 | 示例 | 策略 |
|---|---|---|
| L0 | FAQ | 无确认 |
| L1 | 查询订单 | 身份校验即可 |
| L2 | 创建普通工单 | 软确认 |
| L3 | 修改地址、取消订单 | 显式确认 + checkpoint |
| L4 | 退款、补偿、权益变更 | 用户确认 + 人审 |

## 方案对比

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 所有动作都确认 | 安全 | 摩擦极大 | 不推荐 |
| 仅高风险确认 | 体验好 | 依赖风险分级 | 推荐 |
| 高风险确认 + 审批 + revalidate | 生产可控 | 复杂 | 企业推荐 |

## 配置项

```yaml
confirmation:
  default_timeout: 10m
  revalidate_before_execute: true
  modes:
    soft_confirm:
      actions: [ticket.create]
    explicit_confirm:
      actions: [address.update, order.cancel]
    approval:
      actions: [refund.create, compensation.issue]
```

## 确认 payload schema

```json
{
  "confirmation_request": {
    "id": "cf_123",
    "action": "address.update",
    "risk_level": "L3",
    "user_visible_title": "确认修改收货地址",
    "before": {"address": "旧地址，已脱敏"},
    "after": {"address": "新地址，已脱敏"},
    "risk_reason": "修改后可能影响配送",
    "expires_at": "RFC3339",
    "checkpoint_id": "ckpt_123"
  }
}
```

## 用户体验表现

- 明确告诉用户“将要执行什么、影响什么、确认后是否可撤回”。
- 用户拒绝后回复：“好的，我不会修改地址。”
- 超时后回复：“由于你暂未确认，我没有执行该操作。”

## 验收标准

- L3/L4 动作无确认不得执行。
- 用户拒绝/超时不得误执行。
- 确认后执行前必须 revalidate。
- 确认状态可 resume。

---

# 29. Safety / Compliance Runtime 策略

## 设计目标

将 PII、敏感承诺、数据保留、数据出境、审计采样、行业合规变成运行时能力。

## 运行时流程

```text
input/tool_output/draft_answer
  -> pii detection
  -> redaction before model/trace/storage
  -> compliance classifier
  -> policy action: allow / repair / block / handoff / audit
  -> retention tagging
  -> audit event
```

## 方案对比

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 敏感词过滤 | 快 | 漏洞大 | 不推荐 |
| PII 脱敏 + 合规分类 | 可覆盖主要风险 | 需要维护策略 | P0 推荐 |
| 合规策略 + 审计门禁 + 行业规则库 | 企业级 | 建设成本高 | P1/P2 推荐 |

## 推荐方案

采用“前置识别、全链路脱敏、策略化动作、审计留痕”。模型调用前、工具结果后、trace 存储前都必须过安全层。

## 配置项

```yaml
safety:
  pii_detection: true
  redact_before_model: true
  redact_trace: true
  regulated_topics: [refund, compensation, legal, finance, health]
  retention:
    default: 30d
    pii: 7d
    audit_high_risk: 180d
  audit_sample_rate:
    low_risk: 0.01
    high_risk: 1.0
```

## 数据结构 / schema

```json
{
  "safety_result": {
    "pii_hits": [{"field": "phone", "class": "contact", "action": "mask"}],
    "policy_hits": ["compensation_claim"],
    "action": "repair_and_handoff",
    "redaction_state": "pre_model",
    "retention_class": "audit_high_risk",
    "audit_required": true
  }
}
```

## 用户体验表现

- 不展示内部错误、接口字段、完整 PII。
- 对受限事项给清楚边界：“这个补偿需要人工同事确认，我帮你转接。”

## 验收标准

- PII 泄漏为 0。
- 高风险会话审计覆盖率 100%。
- 模型 prompt 中不得包含未授权敏感字段。
- 合规策略命中可追踪。

---

# 36. Data Contract 策略

## 设计目标

统一 Tool、Knowledge、Memory、Trace、Eval、Handoff、UI Component 等跨模块数据结构，保证可校验、可回放、可版本演进。

## 运行时流程

```text
object created
  -> attach envelope
  -> schema validate
  -> redact/policy tag
  -> persist or pass downstream
  -> replay/eval consumes same contract
```

## 方案对比

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| Loose JSON | 快 | 不可控、难回放 | 不推荐 |
| 边界 typed schema | 稳定、易联调 | 需版本管理 | 推荐 P0 |
| Contract registry + migration | 企业级 | 成本高 | P1/P2 推荐 |

## 统一 envelope

```json
{
  "schema_version": "1.0",
  "entity_type": "ToolResult|MemoryItem|TraceEvent|EvalCase|HandoffPacket|UIComponent",
  "id": "obj_123",
  "trace_id": "tr_123",
  "tenant_id": "t_123",
  "source": "tool|model|user|system|human",
  "confidence": 0.87,
  "redaction_state": "none|partial|full",
  "policy_tags": ["pii", "audit"],
  "created_at": "RFC3339"
}
```

## 必备合同

- ToolInput / ToolResult / ToolError。
- MemoryItem / MemoryCandidate / CompactionSummary。
- TraceEvent / Span。
- EvalCase / EvalRun / EvalAssertion。
- HandoffPacket / ApprovalRequest。
- OutputEnvelope / UIComponent。

## 异常分支

- schema 校验失败：不进入正式链路。
- 版本不兼容：走 migration 或拒绝 replay。
- 缺 trace_id：阻断生产写入。
- 缺 PII 标记：按高风险处理。

## 验收标准

- 所有跨模块对象都有 schema_version。
- replay 与线上执行使用同一对象合同。
- Tool error contract 覆盖率 100%。
- 版本升级不破坏旧会话回放。

---

## 结论

C 组设计的核心是：**记忆要分层，反思要条件触发，护栏要前置且分层，权限要动态门控，高风险要确认/审批，合规要贯穿运行时，所有对象要有统一数据契约。**
