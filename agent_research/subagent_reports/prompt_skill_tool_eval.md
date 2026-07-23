# C2 子研究报告：Prompt / Skill / Tool / Memory / Eval / Guardrail / 生成器

日期：2026-06-30  
角色：替代子研究员 C2  
目标：为 UAgent 的 Skill Copilot / Skill Studio 形成可实现的细节层参考，覆盖 prompt、skill、tool、memory/state、eval/guardrail/HITL 与标准 Skill 生成器流程。

## 0. 结论摘要

UAgent 的 Skill Copilot 不应设计成“一键生成提示词文件”，而应设计成一条可审计的生产线：

`材料输入 -> 需求抽取 -> 能力边界确认 -> Prompt/Tool/Memory 建模 -> Skill 草稿 -> Mock/沙箱执行 -> Eval 对比 -> Guardrail/HITL 审核 -> 发布 -> 运行观测 -> 失败日志反哺迭代`

本次调研形成三个核心判断：

1. **Skill 的最小单元是可触发的能力包，不是长 prompt。** Anthropic / OpenAI / Codex 系 Skill 都把 `name + description + SKILL.md + scripts/references/assets` 作为基本形态；description 是触发入口，正文和资源应按渐进加载组织。
2. **Skill 生成器必须内置 eval 和 description 优化。** Anthropic `skill-creator` 明确包含 with-skill/baseline 运行、grader、benchmark、viewer、trigger eval、description improver；OMX `writing-skills` 将 Skill 写作视为“过程文档的 TDD”。
3. **企业 Skill Studio 的关键差异是 Tool/权限/状态/发布门禁。** 真实客服/业务 Skill 需要把 SOP、API、历史对话和失败日志转成：工具 schema、运行时变量映射、固定变量、权限等级、错误码、超时重试、mock、eval 数据集、人审门禁、可回滚版本。

## 1. 证据来源

### 1.1 本地读取

- `C:\Users\13609\.codex\workbase\chat_agent\references\skill-creators\INDEX.md`：本地 Skill Creator 索引，指出 draft -> eval/test -> iterate -> validate -> package 是主要闭环。
- `...\references\skill-creators\codex-system-skill-creator\SKILL.md`：Codex Skill Creator，本地证据包括渐进加载、`scripts/`、`references/`、`assets/`、`quick_validate.py`、`agents/openai.yaml`。
- `...\references\skill-creators\codex-plugin-creator\SKILL.md`：Codex Plugin Creator，本地证据包括 `.codex-plugin/plugin.json`、marketplace policy、安装/认证策略、validate 脚本。
- `...\references\skill-creators\omx-writing-skills\SKILL.md`：OMX 写 Skill 方法，把 Skill 创建映射为 RED/GREEN/REFACTOR，强调压力场景、基线失败、description 触发优化。
- `...\references\skill-creators\upstream\anthropics-skills\README.md`：Anthropic skills 上游仓库说明。
- `...\references\skill-creators\upstream\anthropics-skills\skills\skill-creator\SKILL.md`：Anthropic Skill Creator，包含 eval、benchmark、viewer、description optimization、packaging。
- `...\references\skill-creators\upstream\anthropics-skills\skills\skill-creator\references\schemas.md`：evals、grading、metrics、timing、benchmark、comparison、analysis 的 JSON schema。
- `...\references\skill-creators\upstream\anthropics-skills\skills\mcp-builder\SKILL.md`：MCP Builder 工作流，要求研究、实现、测试、创建 eval。
- `...\references\skill-creators\upstream\anthropics-skills\skills\mcp-builder\reference\mcp_best_practices.md`：MCP tool 命名、schema、分页、transport、安全、annotations、错误处理。
- `...\references\skill-creators\upstream\anthropics-skills\skills\mcp-builder\reference\evaluation.md`：MCP server eval 规范。
- `C:\Users\13609\.codex\workbase\chat_agent\_skills_inspect\skills\...`：用户现有 skills，含 `customer-info`、`order-service`、`product-recommend`、`response-format`，体现业务 Skill 的 API 依赖、会话变量 `wuid`、卡片格式等。
- `...\agent_research\sources\openai-agents-python\README.md`：OpenAI Agents SDK 源码 README，列出 agents、tools、guardrails、handoffs、HITL、sessions、tracing。
- `...\agent_research\sources\openai-agents-python\src\agents\agent.py`：Agent dataclass 字段，包含 instructions、prompt、handoffs、tools、mcp_servers、input/output guardrails、output_type、hooks、tool_use_behavior。
- `...\agent_research\sources\openai-agents-python\src\agents\tool.py`：FunctionTool schema、strict_json_schema、is_enabled、tool guardrails、needs_approval、timeout、error handling。
- `...\agent_research\sources\openai-agents-python\src\agents\guardrail.py`：InputGuardrail / OutputGuardrail 结构，`tripwire_triggered` 触发停止。
- `...\agent_research\sources\openai-agents-python\src\agents\memory\session.py`：Session protocol，`get_items`、`add_items`、`pop_item`、`clear_session` 和 compaction-aware session。
- `...\agent_research\sources\langgraph\README.md`：LangGraph 官方源码 README，强调 durable execution、HITL、short-term/long-term memory、tracing。
- `...\agent_research\sources\openhands\skills\README.md`：OpenHands skills/microagents，体现 shareable skills 与 repo-specific instructions 的加载顺序。

### 1.2 外部官方/上游链接

- OpenAI Agents SDK docs: https://openai.github.io/openai-agents-python/
- OpenAI Agents SDK GitHub: https://github.com/openai/openai-agents-python
- OpenAI Codex skills README 本地镜像指向：`https://developers.openai.com/codex/skills`、`https://developers.openai.com/codex/skills/create-skill`、`https://developers.openai.com/codex/plugins/build`
- Anthropic Skills API guide: https://docs.claude.com/en/api/skills-guide
- Anthropic skills GitHub: https://github.com/anthropics/skills
- Agent Skills standard: https://agentskills.io
- MCP tools specification: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk
- LangGraph docs: https://docs.langchain.com/oss/python/langgraph/overview
- LangGraph memory docs: https://docs.langchain.com/oss/python/langgraph/memory
- Dify docs: https://docs.dify.ai/
- Coze docs: https://www.coze.com/docs/
- Hermes / OpenClaw：公开材料需要按仓库继续核验。当前可用结论是：Hermes 类项目更强调 self-learning / task feedback / skill library loop，OpenClaw 公开可检索材料较少，不能把未核验实现当事实。

## 2. Prompt 设计

### 2.1 Prompt 分层

UAgent 应把 prompt 分成 7 类，避免把所有约束塞进一个系统提示词：

| 层级 | 作用 | UAgent 建议 |
|---|---|---|
| System prompt | 身份、总目标、不可违反安全边界 | 平台统一管理，不允许 Skill 任意覆盖 |
| Developer instruction | 产品/租户级工作协议、权限、语气、工具边界 | 租户/机器人版本绑定，可审计 |
| Task prompt | 当前用户请求和上下文摘要 | 每轮动态生成，保留原始用户语义 |
| Skill prompt | 被触发 Skill 的 SKILL.md 主体 | 仅在触发后加载，控制长度 |
| Few-shot | 关键输入输出样例 | 放在 `examples/` 或 eval 中，按需加载 |
| Routing prompt | 选择 Skill/Tool/Agent 的规则 | 独立维护，可独立评测召回/误触发 |
| Reflection prompt | 失败诊断、复核、输出前检查 | 只在高风险或失败重试时触发 |
| Tool prompt | tool description、参数说明、错误恢复 | 绑定 tool schema，不散落在普通 prompt |

### 2.2 System / Developer / Task Prompt 的边界

- System prompt：只放全局不变量，例如安全、合规、身份、禁止泄露内部链路、输出渠道限制。
- Developer instruction：放业务策略和工程规则，例如“支付/退款需人审”“不得伪造物流状态”“调用外部接口必须带 trace_id”。
- Task prompt：放用户当前意图、会话变量、检索摘要、候选技能、候选工具。

验收标准：

- 任意 Skill 不能覆盖系统级安全约束。
- 租户级 developer instruction 可版本化、可回滚、可 diff。
- Task prompt 中所有运行时变量必须有来源标记：`user_input`、`session`、`tool_result`、`memory`、`inferred`。

### 2.3 Routing Prompt

Routing prompt 应单独可测，输入是用户 query + 会话变量 + 已启用 Skill metadata，输出是：

```json
{
  "selected_skills": ["order-service"],
  "confidence": 0.86,
  "reason": "用户询问订单物流，且 session 中存在 wuid",
  "missing_variables": [],
  "blocked_by_policy": false
}
```

设计建议：

- 使用 Skill `description` 作为第一触发依据，不依赖正文。
- 对近似 Skill 做负例测试，例如“商品活动咨询”不应触发“售后订单查询”。
- 允许多 Skill 组合，但必须定义冲突优先级：格式 Skill 可作为后处理，业务 Skill 是主执行。

### 2.4 Reflection Prompt

Reflection 不是每轮都跑，而是用于：

- 工具调用失败或返回空。
- 用户意图与工具结果冲突。
- 输出前含高风险动作，例如退款、取消订单、修改地址。
- Eval / QA 阶段复核事实一致性。

Reflection 输出必须结构化：

```json
{
  "facts_checked": ["订单号", "物流状态", "退款状态"],
  "risks": ["tool_result_empty"],
  "needs_human_review": false,
  "final_answer_allowed": true,
  "repair_action": "ask_user_for_order_id"
}
```

## 3. Skill 设计

### 3.1 标准 Skill 包结构

参考 Codex / Anthropic / MCP Builder，UAgent 推荐结构：

```text
skill-id/
  skill.yaml                 # UAgent 扩展元数据，供平台索引/发布/权限使用
  SKILL.md                   # Agent 可读主说明，必须短且可执行
  prompts/
    routing.md               # 触发/冲突/退避规则
    task.md                  # 主任务执行模板
    reflection.md            # 复核/失败恢复模板
    tool_usage.md            # 工具使用策略
  tools/
    tools.yaml               # 工具清单、schema 引用、权限、超时、mock
    schemas/
      query_order.json
      list_coupons.json
    mocks/
      query_order.success.json
      query_order.not_found.json
      query_order.timeout.json
  references/
    sop.md                   # SOP/业务规则
    api.md                   # API 摘要，不放密钥
    glossary.md              # 业务术语
  scripts/
    validate_inputs.py       # 可选，确定性校验/转换
    render_card.py           # 可选，稳定格式化
  evals/
    evals.json               # 测试集
    files/                   # 测试输入文件
    grading.json             # 可选，最近一次评测结果
  guardrails/
    policy.yaml              # 风险策略、HITL、拒答/转人工
    output_checks.yaml       # 事实一致性、敏感信息、格式检查
  memory/
    schema.yaml              # 读写哪些短期/长期状态
  README.md                  # 可选，仅面向人类；Agent 不依赖
```

如果要兼容 Agent Skills 标准，最小必需仍是：

```text
skill-id/
  SKILL.md
```

其中 `SKILL.md` frontmatter 至少包含：

```yaml
---
name: order-service
description: Use when the user asks about orders, logistics, delivery status, after-sales, refund progress, or implicitly refers to a recent purchase. Requires wuid from session or explicit user identity before querying order APIs.
---
```

### 3.2 `skill.yaml` 建议 schema

```yaml
id: order-service
version: 0.1.0
status: draft            # draft | review | staging | production | deprecated
locale: zh-CN
owner: customer-service-platform
description: 查询订单、物流、售后进度，并生成客服可读回复。
triggers:
  include:
    - 订单在哪
    - 物流进度
    - 退款什么时候到账
  exclude:
    - 商品推荐
    - 活动优惠咨询
dependencies:
  variables:
    - name: wuid
      source: session
      required: true
      fallback: ask_user_or_handoff
  tools:
    - query_order
    - query_after_sale
permissions:
  data_scope: customer_order_read
  write_actions: []
release:
  min_eval_pass_rate: 0.9
  human_review_required: true
observability:
  log_tool_inputs: redacted
  log_tool_outputs: summary
```

### 3.3 Description Optimization

Anthropic `skill-creator` 的关键实践：description 是主触发机制，应有 should-trigger / should-not-trigger eval，并对候选 description 评测触发率。

UAgent 应提供：

- 20-50 条触发测试：覆盖正式问法、口语、错别字、多轮隐式、近邻误触发。
- 指标：召回率、误触发率、冲突率、需要澄清率。
- 版本比较：新 description 必须在 held-out set 上不劣化。

### 3.4 Skill 不应包含什么

- 不放密钥、token、生产账号。
- 不放无法验证的“经验故事”。
- 不把所有 API 文档复制进 `SKILL.md`。
- 不在 description 写复杂执行流程，避免模型只读 description 后跳过正文。
- 不把可由 schema/代码强制的规则只写成自然语言。

## 4. Tool 设计

### 4.1 Tool Schema

MCP 与 OpenAI Agents SDK 都指向同一原则：tool 必须有清晰 name、description、JSON schema、错误语义和权限提示。

推荐工具定义：

```yaml
tools:
  - name: order_query_order
    title: 查询订单
    description: 根据 wuid 和可选订单号查询用户订单摘要。只读，不修改订单状态。
    input_schema: ./schemas/query_order.json
    output_schema: ./schemas/query_order.output.json
    annotations:
      readOnlyHint: true
      destructiveHint: false
      idempotentHint: true
      openWorldHint: true
    variables:
      fixed:
        channel: uagent
      runtime:
        wuid: session.wuid
        order_id: slots.order_id
        trace_id: runtime.trace_id
    permission:
      scope: customer_order_read
      hitl_required: false
    timeout:
      seconds: 5
      retries: 1
      retry_on:
        - TIMEOUT
        - RATE_LIMIT
    errors:
      ORDER_NOT_FOUND: ask_for_order_id_or_show_recent_orders
      AUTH_MISSING: request_login_or_handoff
      TIMEOUT: apologize_and_retry_once
    mocks:
      success: ./mocks/query_order.success.json
      empty: ./mocks/query_order.not_found.json
      timeout: ./mocks/query_order.timeout.json
```

### 4.2 参数映射

每个参数必须标记来源：

| 参数类型 | 示例 | 处理规则 |
|---|---|---|
| 固定变量 | `channel=uagent` | 平台注入，不允许模型改 |
| 运行时变量 | `trace_id`、`tenant_id` | runtime 注入 |
| 会话变量 | `wuid`、`phone_hash` | 需定义读权限和过期策略 |
| 槽位变量 | `order_id`、`sku_id` | 从用户话术抽取，低置信度需澄清 |
| 工具级派生变量 | `date_range` | 必须记录推断依据 |
| 人审变量 | `refund_approval_id` | HITL 后写入 |

### 4.3 Tool 错误码和恢复

错误码必须能驱动下一步，而不是只返回“失败”。

推荐分类：

- `VALIDATION_ERROR`：参数缺失或格式错误，模型应澄清或修正。
- `AUTH_MISSING`：缺少身份/登录态，转登录或人工。
- `PERMISSION_DENIED`：Skill 权限不足，不应重试。
- `NOT_FOUND`：资源不存在，提供可选查询条件。
- `CONFLICT`：状态冲突，例如已退款不能再次申请。
- `RATE_LIMIT`：退避重试。
- `TIMEOUT`：一次重试后降级。
- `UPSTREAM_ERROR`：上游不可用，输出保守话术。
- `POLICY_BLOCKED`：策略阻断，必要时转人工。

### 4.4 Tool Guardrail

OpenAI Agents SDK 源码中 `FunctionTool` 支持：

- `strict_json_schema`
- `is_enabled`
- `tool_input_guardrails`
- `tool_output_guardrails`
- `needs_approval`
- `timeout_seconds`
- `timeout_behavior`

UAgent 应对每个工具生成：

- 输入 guardrail：必填、范围、枚举、PII、越权访问。
- 输出 guardrail：字段完整性、敏感信息脱敏、事实一致性。
- 动作 guardrail：写操作、扣费、退款、取消订单、修改地址等必须 HITL。
- 运行 guardrail：超时、重试、熔断、幂等键。

## 5. Memory / State

### 5.1 状态分层

LangGraph 的短期/长期 memory、checkpoint 思路与 OpenAI Agents SDK session protocol 可合并成 UAgent 的三层模型：

| 层级 | 用途 | 示例 | 生命周期 |
|---|---|---|---|
| Turn state | 当前轮临时变量 | extracted_intent、slot_confidence | 单轮 |
| Session memory | 多轮上下文 | wuid、最近订单、用户已确认信息 | 会话级，TTL |
| Long-term memory | 跨会话偏好/画像 | 用户偏好、禁忌、常用地址摘要 | 需授权，长期 |
| Checkpoint | agent workflow 恢复点 | 已调用工具、HITL pending、审批结果 | 工作流级 |
| Compressed context | 长对话摘要 | 关键事实、已拒绝方案、未解决问题 | token 压缩后 |

### 5.2 Memory Schema

```yaml
session:
  variables:
    - name: wuid
      type: string
      pii: true
      source: login_session
      ttl: 30m
      allowed_skills: [customer-info, order-service]
    - name: selected_order_id
      type: string
      pii: false
      source: user_or_tool
      ttl: conversation
long_term:
  variables:
    - name: product_preferences
      type: object
      consent_required: true
      write_policy: explicit_or_high_confidence
checkpoint:
  persist:
    - active_skill
    - tool_calls
    - pending_approval
    - user_confirmations
```

### 5.3 上下文压缩

压缩不应只做自然语言摘要，应输出结构化摘要：

```json
{
  "stable_facts": {
    "wuid_present": true,
    "selected_order_id": "masked"
  },
  "user_goal": "查询退款进度",
  "actions_taken": ["query_after_sale"],
  "tool_results_summary": ["售后单状态：审核中"],
  "open_questions": [],
  "do_not_repeat": ["不要再次询问手机号"]
}
```

验收标准：

- 压缩前后业务决策不变。
- PII 按策略脱敏。
- pending approval 和未解决问题不能丢失。

## 6. Eval / Guardrail / HITL

### 6.1 Eval 类型

UAgent Skill Studio 应至少支持 6 类评测：

| 类型 | 目的 | 例子 |
|---|---|---|
| Trigger eval | Skill 是否该触发 | 订单问法触发 order-service，商品推荐不触发 |
| Tool mapping eval | 参数映射是否正确 | wuid 来自 session，order_id 来自用户输入 |
| Task success eval | 任务结果是否正确 | 能返回订单状态并解释下一步 |
| Regression eval | 新版本不破坏旧场景 | 历史失败日志重放 |
| Safety eval | 风险操作是否阻断 | 未确认不得取消订单 |
| Format eval | 输出是否符合前端协议 | 卡片字段、按钮、空态 |

### 6.2 Eval 数据结构

```json
{
  "skill_name": "order-service",
  "evals": [
    {
      "id": "order-logistics-001",
      "prompt": "我的东西到哪了？",
      "context": {
        "session": {"wuid": "mock-wuid-1"},
        "history": []
      },
      "mock_tools": {
        "order_query_order": "success"
      },
      "expected": {
        "selected_skills": ["order-service", "response-format"],
        "tool_calls": [
          {"name": "order_query_order", "args_contains": {"wuid": "mock-wuid-1"}}
        ],
        "answer_contains": ["物流", "订单"],
        "forbidden": ["请提供 wuid"]
      },
      "risk": "low"
    }
  ]
}
```

### 6.3 Guardrail 策略

输入 guardrail：

- 未登录用户请求个人订单：不调用订单 API，先引导登录/转人工。
- 用户请求他人订单：拒绝或转人工。
- PII 过多：脱敏并减少上下文传递。

工具 guardrail：

- 读工具：默认可执行，但需要权限 scope。
- 写工具：默认需 HITL。
- 高金额退款、地址修改、取消订单：必须用户二次确认 + 人审策略。

输出 guardrail：

- 不编造订单/物流/优惠券状态。
- 不输出内部错误栈、接口字段、密钥。
- 工具为空时必须说明无法查询，不得臆测。
- 前端卡片必须满足 schema。

发布门禁：

- trigger eval 召回率 >= 90%，误触发率 <= 5%。
- 高风险 safety eval 100% 通过。
- 工具参数映射 eval 100% 通过。
- 回归集不低于上一版本。
- 人审通过后才能 production。

### 6.4 HITL

HITL 不应只是一句“请人工确认”，而应是状态机：

```yaml
hitl:
  states:
    - pending_user_confirmation
    - pending_human_review
    - approved
    - rejected
    - expired
  required_for:
    - refund_create
    - order_cancel
    - address_update
  approval_payload:
    fields:
      - action
      - user_id_masked
      - resource_id
      - before
      - after
      - risk_reason
```

## 7. Dify / Coze 可借鉴点

### 7.1 Dify

Dify 的工作流式设计可借鉴：

- 把 LLM 节点、变量、工具、条件分支、知识检索分开建模。
- 对 workflow 中每个节点设置输入变量和输出变量。
- Prompt 编排与工作流节点解耦，便于调试和复用。
- 数据集/标注/观测用于持续优化。

UAgent 不应完全复制低代码工作流，而应将 Skill 编译为可执行图：router -> skill prompt -> tools -> guardrails -> formatter -> eval。

### 7.2 Coze

Coze 类产品可借鉴：

- Bot persona / prompt / workflow / plugin / knowledge 分层。
- 插件工具和工作流节点面向非工程用户配置。
- 发布前可预览和测试。

UAgent 应补强的部分：

- 更严格的 tool schema、权限与发布门禁。
- 可从历史失败日志自动生成 regression eval。
- 业务 SOP 到 Skill 的抽取和冲突检测。

## 8. Hermes / OpenClaw 自学习与 Skill 生成

当前公开材料可确认的方向是：自学习 Agent 通常包含任务执行日志、失败归因、经验抽取、技能库更新、再评测闭环。由于 Hermes / OpenClaw 的具体源码可用性与版本需继续核验，本报告不把未读源码实现当事实。

可借鉴为 UAgent 的抽象流程：

1. 从失败日志识别可复用失败模式。
2. 聚类成候选 Skill 改进点：触发不足、工具参数错、SOP 缺失、输出格式错、guardrail 缺失。
3. 自动生成 patch 草稿，而不是直接发布。
4. 用历史失败样本 + held-out 样本评测。
5. 需要人审确认后进入 staging。

## 9. Skill Copilot 产品方案

### 9.1 输入材料

Skill Copilot 应支持 5 类输入：

- SOP：客服流程、业务规则、禁用话术、升级条件。
- API：OpenAPI、接口文档、示例请求/响应、错误码。
- 历史对话：成功案例、失败案例、人工接管记录。
- 失败日志：误触发、工具失败、用户差评、质检问题。
- 现有 Skill：如 `_skills_inspect` 中的订单/客户/推荐/格式 Skill。

### 9.2 生成流程

```text
1. 材料解析
   - 解析 SOP/API/对话/日志
   - 抽取实体、意图、槽位、工具、风险动作

2. 需求澄清
   - 生成缺失问题
   - 标记无法自动判断的业务边界

3. Skill 草稿
   - 生成 skill.yaml
   - 生成 SKILL.md
   - 生成 routing/task/reflection/tool prompts
   - 生成 tools.yaml 和 schema

4. Mock 与测试集
   - 从 API 示例生成 mock
   - 从历史对话生成 evals
   - 从失败日志生成 regression evals

5. 静态校验
   - frontmatter / schema / 权限 / 变量来源 / PII / tool 冲突

6. 沙箱执行
   - with-skill vs baseline
   - mock tool replay
   - 输出 benchmark

7. 人审
   - 展示 Skill diff、eval 结果、风险策略
   - 审核后进入 staging

8. 发布与观测
   - canary 发布
   - 收集触发率、成功率、转人工率、错误码、用户满意度

9. 迭代
   - 失败样本回流
   - 自动提出 Skill patch 和 eval patch
```

### 9.3 Copilot 交互形态

Skill Studio 应有四个主要视图：

- **素材视图**：上传 SOP/API/日志，显示抽取结果和置信度。
- **Skill 编辑视图**：左侧结构树，右侧 `SKILL.md` / prompts / tools / eval。
- **测试视图**：批量运行 eval，展示 pass/fail、证据、工具调用轨迹。
- **发布视图**：风险门禁、审批记录、版本 diff、回滚按钮。

## 10. Prompt 模板建议

### 10.1 Skill 生成器系统模板

```md
你是 UAgent Skill Copilot。你的任务是把 SOP、API 文档、历史对话和失败日志转成可测试、可审计、可发布的 Skill 包。

必须遵守：
1. 不直接发布生成内容，只输出 draft/review/staging 状态。
2. 每个工具参数必须标注来源：fixed/runtime/session/slot/tool_result/inferred/hitl。
3. 每个风险动作必须有 guardrail 和 HITL 策略。
4. 每个 Skill 必须包含 trigger eval、tool mapping eval、task success eval、safety eval。
5. 不确定的业务规则必须进入 open_questions，不能自行编造。
6. `SKILL.md` 面向 Agent 执行，保持短、明确、可操作；长文档放 references。
```

### 10.2 需求抽取模板

```md
从以下材料抽取 Skill 需求，输出 JSON：

字段：
- skill_candidates: 候选 Skill 列表
- intents: 用户意图和触发表达
- slots: 必填/可选槽位
- session_variables: 会话变量
- tools: 需要的 API/工具
- risk_actions: 写操作或高风险动作
- output_formats: 输出形态
- open_questions: 缺失问题
- eval_seed_cases: 可转成测试集的历史对话

材料：
{{materials}}
```

### 10.3 Tool Schema 生成模板

```md
根据 API 文档生成 UAgent tool schema。

要求：
- tool name 使用 `{domain}_{action}_{resource}`。
- 每个参数写 type、required、description、source、validation。
- 每个错误码写恢复策略。
- 标注 readOnly/destructive/idempotent/openWorld。
- 写 timeout/retry/mock 需求。
- 如果 API 文档缺少字段含义，加入 open_questions。

API 文档：
{{api_doc}}
```

### 10.4 Eval 生成模板

```md
为 Skill 生成 evals.json。

要求：
- 至少包含 should-trigger、should-not-trigger、参数缺失、工具成功、工具空结果、工具超时、高风险动作、格式校验。
- 每条 eval 必须有 prompt、context、mock_tools、expected、forbidden。
- 答案必须可自动判定；主观项放 human_review_notes。
- 历史失败日志必须转成 regression eval。

Skill 草稿：
{{skill_draft}}

历史对话/失败日志：
{{logs}}
```

### 10.5 Guardrail 生成模板

```md
为以下 Skill 生成 guardrails/policy.yaml。

必须覆盖：
- 输入风险：身份缺失、越权、敏感信息、恶意请求。
- 工具风险：写操作、不可逆操作、金额/权益变更、外部系统失败。
- 输出风险：编造事实、泄露内部字段、格式不合规、未脱敏。
- HITL：触发条件、审批 payload、过期策略、拒绝策略。

Skill：
{{skill}}
Tools：
{{tools}}
```

## 11. UAgent 生成器验收标准

Skill Copilot 的产物只有满足以下条件才算可进入规划/实现：

1. `skill.yaml`、`SKILL.md`、`tools.yaml`、`evals/evals.json`、`guardrails/policy.yaml` 全部存在。
2. 所有工具参数都有来源映射和校验规则。
3. 所有必需 session variables 有缺失处理。
4. 所有写操作或高风险动作有 HITL。
5. 至少 20 条 trigger eval，且含近邻负例。
6. 至少 10 条任务 eval，覆盖成功、空结果、错误、超时、权限不足。
7. 历史失败日志至少转成 5 条 regression eval，除非没有失败日志。
8. 输出格式可由 schema 或断言验证。
9. Skill description 不超过平台限制，并通过触发评测。
10. 发布门禁记录 eval 结果、人审人、版本号、回滚目标。

## 12. 对现有用户 Skills 的观察

本地 `_skills_inspect` 有 4 个 Skill：

- `customer-info`：查询用户基本信息和优惠券，依赖 `wuid`。
- `order-service`：订单、售后、退款进度，依赖 `wuid`，是典型业务查询 Skill。
- `product-recommend`：售前导购、推荐、比价、活动咨询。
- `response-format`：格式化输出卡片和按钮，适合作为后处理 Skill。

主要缺口：

- 缺少独立 `tools.yaml`，工具 schema、权限、错误码和 mock 未结构化。
- 缺少 evals，无法量化触发、参数映射、输出格式和回归表现。
- 缺少 guardrail/HITL 文件，风险动作和人工审核策略未显式化。
- `description` 是中文业务说明，建议补充 should-trigger / should-not-trigger eval 后优化。
- `response-format` 应被定义为 formatter/post-processing skill，避免与业务 Skill 抢主触发。

## 13. 建议下一步

1. 先选 `order-service` 作为 UAgent Skill Studio 样板，因为它同时覆盖意图触发、会话变量、读工具、错误处理、输出格式和售后风险。
2. 为 `order-service` 补 `skill.yaml`、`tools.yaml`、mock、evals、guardrails，形成第一套标准包。
3. 用历史对话和失败日志生成至少 30 条 eval，其中 10 条近邻负例测试与 `product-recommend`、`customer-info`、`response-format` 的冲突。
4. 实现 Skill Copilot 的第一阶段只做 draft + lint + mock eval，不直接发布生产。
5. 第二阶段再接入真实工具沙箱、HITL 审批和灰度发布。

## 14. 未确认与需上层路由

- Hermes / OpenClaw 的具体源码实现尚未在本地参考目录中发现稳定证据；建议由 researcher 继续做定向源码核验，不应在产品设计中声称已复刻其具体机制。
- Dify / Coze 当前官方文档可作为产品形态参考，但 UAgent 的强项应放在企业级 Skill 包、eval、guardrail、tool schema、发布门禁，而不是简单复刻低代码 workflow。
- 若进入实现规划，建议交给 planner 制定 `order-service` 样板 Skill 包落地计划，并交给 architect 核验与现有 UAgent 架构的映射。
