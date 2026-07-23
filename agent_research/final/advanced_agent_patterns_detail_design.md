# UAgent 重点模块先进项目细节借鉴设计库

> 文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\advanced_agent_patterns_detail_design.md`  
> 目标：不是泛泛借鉴“大功能”，而是吸收主流 Agent / Harness 项目的巧思机制、提示词设计、hooks、eval、trace、guardrail、skill 触发与工具治理细节。  
> 来源：Anthropic Skills / Claude Code 思路、OpenAI Agents SDK、LangGraph、AgentScope、OpenHands、AutoGen、Dify/Coze 等产品形态，以及本地源码/官方文档调研。

---

## 0. 结论

前面的功能清单是“平台应该有什么”；这一份回答“每个重点模块怎么做得高级”。

顶级 Agent 项目的差异不在于都有 Agent、Tools、Knowledge、Workflow，而在于这些小机制：

1. Skill 不是写完就算，要有 **with-skill vs baseline 对照评测**。
2. Skill 触发不是靠关键词，要有 **description trigger eval + held-out 防过拟合**。
3. Tool 不是函数列表，要有 **strict schema + 参数来源 + tool guardrail + approval**。
4. Handoff 不是一句“转人工”，要有 **handoff description、input filter、上下文裁剪**。
5. Workflow 不是流程图，要有 **checkpoint / interrupt / resume / replay**。
6. Trace 不是日志列表，要有 **生命周期 hooks + span + event timeline**。
7. Memory 不是聊天记录，要有 **session protocol + compaction-aware state + TTL + PII policy**。
8. Eval 不是人工试聊，要有 **定量断言 + 人类 review viewer + regression 回流**。
9. Prompt 不是一段系统词，要有 **分层、动态注入、反射条件触发、输出 schema**。
10. 平台不是只给配置项，要把这些机制包装成 PM/运营能理解的产品交互。

---

# 1. Skill Studio：借鉴 Anthropic Skills / Codex Skills 的细节

## 1.1 Progressive Disclosure 渐进加载

### 来源项目
- Anthropic Skills / Codex Skills。

### 机制
Skill 不是把所有内容一次性塞进上下文，而是三层加载：

```text
metadata: name + description        始终可见，用于触发
SKILL.md body                       触发后加载，放核心流程
resources/scripts/references/assets 按需加载或执行
```

### 为什么高级
- 节省上下文。
- 减少无关知识干扰。
- 让 Skill 可维护。
- 让模型先通过 description 判断是否需要 Skill。

### UAgent 产品化设计
在 Skill Studio 中把 Skill 拆成：

```text
触发层：name / description / trigger examples
执行层：SKILL.md / task prompt / tool usage prompt
资源层：SOP / API docs / glossary / scripts / templates
```

页面上显示“加载层级”：

| 层级 | 是否进入模型上下文 | 编辑位置 | 设计提示 |
|---|---|---|---|
| Metadata | 始终进入路由上下文 | Skill 基础信息 | 写清何时触发/不触发 |
| Body | 触发后进入 | SKILL.md | 控制在 500 行以内 |
| References | 按需读取 | references | 长 SOP、API 文档、案例 |
| Scripts | 不必读全文，可执行 | scripts | 确定性格式化/计算/校验 |

### 功能需求
- Skill 编辑器显示 token/长度风险。
- 超过阈值时提示拆到 references。
- references 必须有“何时读取”的说明。
- scripts 必须声明输入输出 schema。

### 验收标准
- 路由阶段只读取 description。
- 执行阶段才读取 SKILL.md。
- 大文档不会默认注入主上下文。

---

## 1.2 Pushy Description 触发描述优化

### 来源项目
Anthropic Skill Creator 强调 description 是主要触发机制，并建议描述要适度“pushy”，即明确“哪些场景必须用这个 skill”。

### 机制
description 不只写“这个 Skill 是干嘛的”，还要写：

- 什么时候用。
- 用户不显式说 Skill 名也要用的情况。
- 相邻场景什么时候不用。
- 复杂任务优先触发，简单任务不必触发。

### UAgent 产品化设计
Skill description 编辑区提供模板：

```md
Use this skill when...
Also use it when the user implies...
Do not use it when...
Prefer this skill over [X] when...
Ask clarification when...
```

中文运营版：

```md
当用户出现以下意图时使用：
即使用户没有明确说“订单/物流”，但表达了这些含义也使用：
以下情况不要使用：
和其他 Skill 冲突时的优先级：
不确定时先问用户的问题：
```

### 巧思设计
提供“description 触发体检”：

- 是否只写能力，没有写触发场景。
- 是否过宽，容易误触发。
- 是否缺少近邻负例。
- 是否缺少隐式表达。
- 是否没写冲突优先级。

### 验收标准
- 每个 production Skill 必须有 should-trigger 和 should-not-trigger 样例。
- description 修改后必须跑 trigger eval。

---

## 1.3 Trigger Eval + Held-out 防过拟合

### 来源项目
Anthropic Skill Creator 的 description optimization：生成 should-trigger / should-not-trigger 查询，分 train/test，多轮优化，按 test score 选 best_description。

### UAgent 产品化设计
做一个“触发优化器”：

```text
生成触发测试集
  -> 用户审核测试集
  -> 当前 description baseline 测试
  -> 自动生成候选 description
  -> train 集优化
  -> held-out test 集验证
  -> 给出 best description
  -> 人审应用
```

### 页面设计
Tab：`触发评测`

表格字段：
- 用户问题。
- 应触发？
- 实际触发？
- 置信度。
- 误判原因。
- 属于正例/负例/边界例。

报告：
- Recall。
- Precision。
- False positive。
- False negative。
- 冲突 Skill。

### 巧思
负例不能是明显不相关问题，而应该是 near-miss：

- 订单查询 Skill 的负例：优惠活动、商品推荐、门店库存，而不是“写一首诗”。
- 退款 Skill 的负例：退款规则咨询 vs 实际退款申请。

### 验收标准
- 至少 20 条触发 eval。
- 至少 40% 是 should-not-trigger。
- 负例中至少一半是 near-miss。
- 新 description 不能只提升训练集，held-out 也要提升。

---

## 1.4 With-skill vs Baseline 对照实验

### 来源项目
Anthropic Skill Creator：同一测试任务同时跑 with-skill 和 baseline，比较输出质量、耗时、tokens。

### UAgent 产品化设计
Skill Testbench 增加“对照实验”模式：

```text
同一批测试问题
  -> 当前 Agent 不启用该 Skill
  -> 当前 Agent 启用该 Skill
  -> 对比任务成功率、工具调用正确率、格式正确率、成本、转人工率
```

### 产品价值
客户/内部评审能回答：

> “这个 Skill 加进去真的变好了，还是只是多了一堆复杂度？”

### 页面设计
对比表：

| 用例 | baseline 结果 | with-skill 结果 | 胜出 | 原因 |
|---|---|---|---|---|
| 查物流 | 未调用工具 | 正确查订单 | with-skill | 工具调用正确 |
| 活动咨询 | 正常回答 | 误触发订单 | baseline | Skill 误触发 |

### 验收标准
- 每次新增核心 Skill 必须跑 baseline 对照。
- 如果 with-skill 成本上升但成功率无提升，给出警告。

---

## 1.5 Human Review Viewer 人类评审器

### 来源项目
Anthropic Skill Creator 的 eval viewer：让用户查看每个测试 case 的输出、基准结果、评分、反馈。

### UAgent 产品化设计
做“评审工作台”：

- 左侧测试用例。
- 中间展示 baseline / candidate 输出。
- 右侧展示工具调用、trace、断言结果。
- 评审人可标记：通过、失败、部分通过、不确定。
- 可写反馈。
- 反馈自动转成 Skill patch 建议或 eval patch。

### 巧思
不要让模型自己闭环判断全部质量。对于话术、品牌语气、客服体验，必须让人类 review。

### 验收标准
- 每次发布可生成 review 链接。
- 人类反馈进入版本记录。
- 未处理的 P0/P1 反馈不能发布。

---

## 1.6 反复出现的代码固化成 scripts

### 来源项目
Anthropic Skill Creator 建议阅读测试 transcript，如果模型每次都写类似脚本，就把脚本沉淀进 Skill 的 `scripts/`。

### UAgent 产品化设计
在 Trace 分析里识别“重复执行步骤”：

- 每次都格式化订单卡片。
- 每次都校验手机号。
- 每次都转换日期。
- 每次都解析 API 错误码。

系统建议：

> “检测到 23 次类似格式化逻辑，建议沉淀为 render_order_card.py 或 Formatter Action。”

### 验收标准
- 重复逻辑识别可生成脚本/模板建议。
- scripts 有输入输出 schema 和单元测试。

---

# 2. Agent Runtime：借鉴 OpenAI Agents SDK 的细节

## 2.1 Agent Hooks 生命周期回调

### 来源项目
OpenAI Agents SDK 有 AgentHooks / RunHooks，生命周期事件可被回调。

### 机制
Agent 运行不是黑盒，关键节点都可插 hook：

- on_agent_start。
- on_model_start / end。
- on_tool_start / end。
- on_handoff。
- on_guardrail_triggered。
- on_final_output。
- on_error。

### UAgent 产品化设计
做“Hooks Center”：

```yaml
hooks:
  before_model_call:
    - inject_business_context
    - redact_pii
  after_model_call:
    - parse_tool_calls
    - detect_refusal
  before_tool_call:
    - validate_args
    - check_permission
  after_tool_call:
    - summarize_result
    - redact_output
  before_final_answer:
    - output_guardrail
    - format_check
  on_error:
    - retry_or_handoff
```

### 产品交互
普通用户不看到“hook”这个工程词，而看到：

- 模型前处理。
- 工具前校验。
- 工具后处理。
- 回复前检查。
- 异常处理。

高级用户可进入 Hook 编排。

### 验收标准
- 每个 hook 执行有 trace。
- hook 失败有降级策略。
- hook 可按 Agent / Skill / Action 作用域配置。

---

## 2.2 Input / Output / Tool Guardrail 三层护栏

### 来源项目
OpenAI Agents SDK 将 input_guardrails、output_guardrails、tool_input_guardrails、tool_output_guardrails 显式建模。

### UAgent 产品化设计
Guardrail 不应该只是一个“安全提示词”，而应拆成四层：

| Guardrail | 检查时间 | 示例 |
|---|---|---|
| Input Guardrail | 用户输入后 | 越权、辱骂、敏感信息、prompt injection |
| Tool Input Guardrail | 工具调用前 | 参数缺失、跨用户、风险动作未确认 |
| Tool Output Guardrail | 工具返回后 | PII 脱敏、异常字段、上游错误 |
| Output Guardrail | 回复前 | 编造事实、违规承诺、格式错误 |

### 页面设计
Guardrail Policy 页面：

```yaml
policy: no_fake_order_status
stage: output
condition: answer mentions order/logistics/refund status without tool evidence
action: block_and_repair
repair: ask_tool_or_handoff
severity: high
```

### 巧思
输出护栏要能做“修复”，不是只能拦截：

- 删除内部字段。
- 替换为保守话术。
- 要求补工具调用。
- 触发人工。

### 验收标准
- 每条 guardrail 有 stage、condition、action、severity。
- Guardrail 命中进入 trace。
- 高风险 guardrail 有 eval。

---

## 2.3 Tool Approval 作为系统能力

### 来源项目
OpenAI Agents SDK 工具支持 needs_approval / ToolApprovalItem。

### UAgent 产品化设计
Action 配置中新增“Approval Policy”：

```yaml
action: refund_create
needs_approval:
  mode: always | conditional | never
  condition:
    amount_greater_than: 50
    user_level: VIP
approval_payload:
  - action
  - user_id_masked
  - order_id
  - amount
  - reason
  - before
  - after
  - risk_reason
expire_after: 30m
```

### 交互
当 Agent 想执行高风险动作：

1. Agent 生成审批请求。
2. 用户/人工/主管看到审批卡片。
3. 审批通过后 workflow resume。
4. 拒绝后执行拒绝策略。

### 验收标准
- 审批前工具不得执行。
- 审批结果写入 checkpoint。
- 审批超时有处理策略。

---

## 2.4 Handoff Description 与输入过滤

### 来源项目
OpenAI Agents SDK 中 handoff_description 用于告诉模型何时交给子 Agent；handoff input filter 用于控制交接上下文。

### UAgent 产品化设计
人工接管 / 专家 Agent 转交都需要两个配置：

1. handoff description：什么时候转。
2. handoff context filter：转过去带什么，不带什么。

### 示例
```yaml
handoff:
  target: human_refund_specialist
  description: 用户要求赔偿、退款争议、情绪强烈或订单数据与用户陈述冲突时转交。
  input_filter:
    include:
      - user_goal
      - confirmed_identity
      - selected_order_id
      - tool_results_summary
      - failed_actions
      - user_emotion
    exclude:
      - raw_api_response
      - internal_error_stack
      - secret_headers
```

### 巧思
转人工不是把完整对话扔给人工，而是过滤、摘要、脱敏、结构化交接。

### 验收标准
- 每次 handoff 有 reason code。
- handoff payload 可预览。
- PII 和内部字段按策略过滤。

---

## 2.5 Strict JSON Schema 输出约束

### 来源项目
OpenAI Agents SDK 强推荐 strict_json_schema，以提升结构化输出稳定性。

### UAgent 产品化设计
所有关键决策输出都要求 schema：

- 路由结果。
- 槽位抽取。
- 工具参数。
- Handoff 判断。
- Guardrail 判断。
- 最终卡片输出。

### 示例：路由输出
```json
{
  "selected_topic": "order_logistics",
  "selected_skills": ["order-service"],
  "confidence": 0.87,
  "missing_variables": [],
  "handoff_required": false,
  "reason_code": "logistics_query_with_wuid"
}
```

### 验收标准
- schema 校验失败时自动重试一次。
- 二次失败走 fallback/handoff。
- schema 失败进入评测和 trace。

---

# 3. Workflow：借鉴 LangGraph 的 checkpoint / interrupt / replay

## 3.1 Checkpoint 不是保存聊天记录，而是保存流程状态

### 来源项目
LangGraph checkpoint/thread_id/checkpoint_ns/checkpoint_id。

### UAgent 产品化设计
每个长流程节点后保存 checkpoint：

```json
{
  "thread_id": "abc",
  "checkpoint_id": "ckpt_123",
  "node": "query_order_detail",
  "state": {
    "topic": "order_logistics",
    "wuid": "masked",
    "selected_order_id": "O123",
    "tool_calls": [],
    "pending_approval": null
  }
}
```

### 为什么高级
- 工具失败后可续跑。
- 人审回来后可 resume。
- 用户隔天回来可继续。
- 线上问题可 replay。

### 验收标准
- 每个 workflow run 有 thread_id。
- HITL pending 必须有 checkpoint。
- 工具调用后必须保存状态。

---

## 3.2 Interrupt / Resume 人审与澄清

### 来源项目
LangGraph interrupt/resume 机制。

### UAgent 产品化设计
当流程需要人输入时，不是“结束”，而是 interrupt：

场景：
- 缺订单号。
- 多订单需用户选择。
- 退款需人工审批。
- 高风险动作需用户确认。

```yaml
interrupt:
  type: user_clarification
  question: 你想查询哪一个订单？
  options:
    - order_id: O1
    - order_id: O2
resume_on: user_selection
```

### 验收标准
- interrupt 状态可在会话列表看到。
- 用户回复后从原节点恢复，不重新开始。
- interrupt 超时可转人工/关闭。

---

## 3.3 Replay / Time Travel 调试

### 来源项目
LangGraph replay state / checkpoint replay。

### UAgent 产品化设计
Trace Console 增加“从此处重放”：

- 选择历史 checkpoint。
- 替换模型版本 / Skill 版本 / Prompt 版本。
- 使用同样输入和 mock 工具结果重跑。
- 比较输出差异。

### 产品场景
线上出现错误回答：

> PM 不再问“模型为什么这样说”，而是从错误前一个 checkpoint 用新版 Skill replay，看是否修复。

### 验收标准
- replay 不影响真实用户会话。
- replay 结果可保存为 regression eval。

---

# 4. Trace & Observability：借鉴 OpenAI tracing / OpenHands event store / AutoGen events

## 4.1 Event Timeline 而不是普通日志

### 来源项目
OpenAI tracing spans、OpenHands event store、AutoGen event messages。

### UAgent 产品化设计
每轮会话生成事件流：

```text
user_message_received
input_guardrail_checked
topic_routed
skill_loaded
knowledge_retrieved
tool_call_started
tool_call_finished
tool_output_guardrail_checked
model_response_generated
output_guardrail_checked
handoff_triggered / final_answer_sent
```

### 页面设计
Trace 面板用时间线，而不是 raw log：

- 节点名称。
- 耗时。
- 成本。
- 输入摘要。
- 输出摘要。
- 成功/失败。
- 可展开详情。

### 验收标准
- 每个事件有 event_id、parent_id、trace_id。
- 支持按失败类型筛选。
- 事件可导出给研发。

---

## 4.2 Span 层级结构

### 来源项目
OpenAI tracing：guardrail_span、handoff_span、response_span、function_span 等。

### UAgent 产品化设计
Trace 按 span 分层：

```text
Trace: session
  Span: route_topic
  Span: skill_execution
    Span: knowledge_retrieval
    Span: tool_call query_orders
    Span: formatter
  Span: output_guardrail
  Span: final_answer
```

### 巧思
这样可以统计每一层耗时和失败率：

- routing 花了多少。
- RAG 花了多少。
- 工具花了多少。
- 模型花了多少。
- guardrail 花了多少。

### 验收标准
- 每个 span 记录 duration、tokens、cost、status。
- Dashboard 可按 span 类型聚合。

---

# 5. Tool / Action：借鉴 MCP / OpenAI FunctionTool / AgentScope Permission

## 5.1 Tool Manifest 不只是 schema，还要有行为注解

### 来源项目
MCP tools annotations、OpenAI FunctionTool、AgentScope permission engine。

### UAgent 产品化设计
Action manifest：

```yaml
name: order_query_orders
title: 查询订单列表
description: 根据 wuid 查询当前用户订单列表，只读，不改变订单状态。
input_schema: ./schemas/query_orders.input.json
output_schema: ./schemas/query_orders.output.json
annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: true
  openWorldHint: true
risk_level: L1
permission_scope: customer_order_read
timeout_seconds: 5
retry: 1
```

### 巧思
LLM 看到的是“这个工具的行为属性”，平台看到的是“权限和风险”。

### 验收标准
- 每个 action 必须声明 readOnly/destructive/idempotent。
- destructive action 默认需要审批。

---

## 5.2 Tool is_enabled 动态启用

### 来源项目
OpenAI Agents SDK tool/handoff 可动态 is_enabled。

### UAgent 产品化设计
工具是否可用不是静态开关，而由上下文决定：

```yaml
enabled_when:
  - session.wuid exists
  - channel in [web, app, wechat]
  - user_authenticated == true
  - business_hours == true
```

### 场景
- 未登录时不暴露订单查询工具。
- 语音渠道不暴露复杂卡片工具。
- 测试环境不暴露生产写工具。

### 验收标准
- 不满足条件的工具不进入模型可选工具列表。
- 工具不可用原因进入 trace。

---

## 5.3 Tool Error Contract 错误恢复契约

### 来源项目
成熟 Agent 框架都重视工具错误处理；OpenAI Agents SDK 有 tool error handling，MCP 也强调错误语义。

### UAgent 产品化设计
每个 Action 必须定义错误恢复：

```yaml
errors:
  VALIDATION_ERROR:
    model_action: repair_args_or_clarify
  AUTH_MISSING:
    model_action: request_login_or_handoff
  NOT_FOUND:
    model_action: ask_more_info
  TIMEOUT:
    model_action: retry_once_then_fallback
  PERMISSION_DENIED:
    model_action: do_not_retry_handoff
  UPSTREAM_ERROR:
    model_action: conservative_reply
```

### 验收标准
- 工具错误不能直接暴露给用户。
- 每类错误必须有用户话术和系统动作。

---

# 6. Prompt 设计：借鉴 Claude Code / OpenAI Agents 的分层与动态注入

## 6.1 Prompt 分层，而不是一段大系统词

### UAgent 设计
```text
System Prompt：平台安全和全局身份
Developer Prompt：租户/业务线策略
Agent Profile Prompt：Agent 目标和语气
Scenario Prompt：当前场景规则
Skill Prompt：被触发能力说明
Tool Prompt：工具描述和参数规则
Reflection Prompt：失败/高风险复核
Output Prompt：格式要求
```

### 巧思
每层有不同 owner 和版本：

| 层 | Owner | 变更频率 | 是否客户可改 |
|---|---|---|---|
| System | 平台 | 低 | 否 |
| Developer | 企业管理员/PM | 中 | 部分 |
| Agent Profile | PM | 中 | 是 |
| Skill | 解决方案/工程 | 高 | 是 |
| Tool | 工程 | 中 | 部分 |
| Reflection | 平台/QA | 中 | 否/高级 |
| Output | 渠道/前端 | 中 | 部分 |

### 验收标准
- Prompt 可 diff。
- 每次调用可查看最终拼装结果。
- 任何 Skill 不得覆盖系统安全层。

---

## 6.2 动态 Prompt 注入

### 设计
不要把所有信息都塞进去，按条件注入：

```yaml
inject:
  refund_policy:
    when: topic == refund_progress or topic == refund_rule
  angry_user_policy:
    when: sentiment == angry
  vip_policy:
    when: user_level == VIP
  card_format:
    when: channel_supports_card == true
```

### 验收标准
- Trace 显示本轮注入了哪些 prompt fragment。
- 未注入的规则不占上下文。

---

## 6.3 Reflection 条件触发

### 设计
Reflection 不应每轮运行，成本高且拖慢。只在这些情况触发：

- 工具返回空。
- 工具结果和用户陈述冲突。
- 高风险动作前。
- 输出包含承诺/赔偿/时间。
- Eval/灰度阶段。
- 用户情绪强烈。

### Reflection 输出 schema
```json
{
  "facts_checked": [],
  "risks": [],
  "needs_handoff": false,
  "needs_user_confirmation": false,
  "final_answer_allowed": true,
  "repair_action": "none"
}
```

### 验收标准
- Reflection 触发原因进入 trace。
- Reflection 不允许直接调用高风险工具，只能建议。

---

# 7. Memory / Session：借鉴 OpenAI Session / LangGraph Store

## 7.1 Session Protocol

### 设计
会话记忆要有标准接口：

```text
get_items(thread_id, limit)
add_items(thread_id, items)
pop_item(thread_id)
clear_session(thread_id)
compact(thread_id)
```

### UAgent 产品化
Memory Center 显示：

- 本轮变量。
- 会话变量。
- 长期记忆。
- checkpoint。
- 压缩摘要。

### 验收标准
- 用户可删除长期记忆。
- PII 有 TTL。
- 不同 Skill 访问记忆受权限控制。

---

## 7.2 Compaction-aware Memory

### 设计
长对话压缩不能只做自然语言摘要，要保留决策状态：

```json
{
  "user_goal": "查询退款进度",
  "confirmed_facts": {
    "wuid_present": true,
    "selected_order_id": "masked"
  },
  "actions_taken": ["query_refunds"],
  "open_questions": [],
  "do_not_repeat": ["不要再次询问手机号"],
  "pending_approval": null
}
```

### 验收标准
- 压缩后 replay 业务决策不变。
- pending approval 不能丢。

---

# 8. Eval：借鉴 Anthropic benchmark / OpenAI eval mindset / AgentScope event observability

## 8.1 定量断言 + 定性 review 双轨

### 设计
不是所有质量都能自动判定。

自动断言适合：
- 是否调用工具。
- 参数是否包含 wuid。
- 是否输出订单卡片。
- 是否没有泄露内部字段。

人工 review 适合：
- 语气是否自然。
- 安抚是否合适。
- 是否符合品牌。
- 答案是否让用户安心。

### 验收标准
- Eval 支持 assertion 和 human_review_notes。
- 发布报告区分自动分和人工分。

---

## 8.2 Flaky Eval 检测

### 来源项目
Anthropic benchmark 中关注 variance / stddev / flaky。

### UAgent 设计
同一 eval 可重复运行 3 次：

- 3 次结果一致：稳定。
- 2 成 1 败：可能 flaky。
- 分歧大：提示检查 prompt 或模型温度。

### 验收标准
- 发布门禁可配置是否允许 flaky。
- flaky 用例进入优化建议。

---

## 8.3 从 Trace 一键生成 Regression Eval

### 设计
线上失败后，点击“生成回归用例”：

自动捕获：
- 用户问题。
- 会话变量。
- 工具 mock。
- 失败输出。
- 期望修复结果。
- 禁止再次出现的内容。

### 验收标准
- 每个 P0 线上事故必须绑定 regression eval。
- 修复版本必须跑这些 regression eval。

---

# 9. Hooks 产品化：不要暴露工程复杂度，但要保留扩展点

## 9.1 Hook 模板库

### 设计
平台预置 Hook 模板：

| Hook | 作用 |
|---|---|
| PII Redaction Hook | 模型调用前脱敏 |
| Business Context Hook | 注入业务线/渠道/用户等级 |
| Tool Args Validator | 工具前参数校验 |
| Tool Result Summarizer | 工具后结果压缩 |
| Output Format Checker | 回复前格式校验 |
| Escalation Detector | 判断是否转人工 |
| Cost Guard Hook | 成本超限降级 |
| Audit Hook | 高风险动作审计 |

### 验收标准
- Hook 可启停。
- Hook 有作用域。
- Hook 有 trace。
- Hook 失败策略可配置。

---

## 9.2 Hook 运行顺序可视化

### 页面
```text
User Input
  -> Input hooks
  -> Router
  -> Skill hooks
  -> Model call
  -> Tool pre-hooks
  -> Tool call
  -> Tool post-hooks
  -> Reflection hooks
  -> Output hooks
  -> Final answer
```

### 验收标准
- 用户可看到 hook 顺序。
- 冲突 hook 给出提醒。

---

# 10. 面向 UAgent 的重点模块改造建议

## 10.1 现在已有模块如何升级

| 当前模块 | 不足 | 先进细节升级 |
|---|---|---|
| Prompt 编辑器 | 容易变成大杂烩 | 分层 prompt、动态注入、final prompt preview |
| Skills | 可能只是业务文档 | progressive disclosure、trigger eval、baseline 对照、scripts 固化 |
| Tools | 只有工具列表 | manifest、strict schema、参数来源、approval、动态启用 |
| 知识库 | 上传/绑定为主 | 知识缺口、冲突检测、引用 trace、失败回流 |
| 变量 | 字段抽取 | 变量来源、TTL、PII、访问权限、压缩摘要 |
| 反思 | 开关式 | 条件触发 reflection + schema 输出 |
| 人审 | 审批页 | interrupt/resume + approval payload + checkpoint |
| 日志 | 会话列表 | event timeline + span + replay |
| 发布 | 保存/发布 | eval gate、impact analysis、灰度、rollback |

---

## 10.2 P0 必须补的巧思功能

1. **Skill Trigger Eval**：解决 Skill 误触发/不触发。
2. **Tool 参数来源面板**：解决工具调用错参。
3. **Tool Approval/HITL**：解决高风险动作。
4. **Trace Timeline**：解决线上不可解释。
5. **Replay to Eval**：解决失败不能回归。
6. **Prompt Layer Preview**：解决最终 Prompt 不透明。
7. **Guardrail 四层化**：解决只靠提示词安全。
8. **Skill Baseline 对照**：证明 Skill 真有价值。
9. **Hook 模板库**：把工程能力产品化。
10. **Checkpoint/Resume**：支持多轮、审批、恢复。

---

# 11. 来源索引

## 本地源码/资料

- `C:\Users\13609\.codex\workbase\chat_agent\references\skill-creators\upstream\anthropics-skills\skills\skill-creator\SKILL.md`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\openai-agents-python\src\agents\agent.py`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\openai-agents-python\src\agents\tool.py`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\openai-agents-python\src\agents\guardrail.py`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\openai-agents-python\src\agents\lifecycle.py`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\langgraph\libs\langgraph\langgraph\_internal\_constants.py`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\langgraph\libs\langgraph\langgraph\_internal\_replay.py`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\agentscope\src\agentscope\permission\_engine.py`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\agentscope\src\agentscope\event\_event.py`

## 官方/上游链接

- [Anthropic Skills](https://github.com/anthropics/skills)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [LangGraph](https://github.com/langchain-ai/langgraph)
- [AgentScope](https://github.com/agentscope-ai/agentscope)
- [OpenHands](https://github.com/OpenHands/OpenHands)
- [AutoGen](https://github.com/microsoft/autogen)
- [Model Context Protocol](https://modelcontextprotocol.io/)
