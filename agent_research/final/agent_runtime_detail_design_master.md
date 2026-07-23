# Agent Runtime 细节设计规范 Master

> 文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\agent_runtime_detail_design_master.md`  
> 生成方式：先落总目录，再由 5 个子 agent 分别做深设计，最后整合。  
> 目标：沉淀 UAgent 作为 Agent 平台时，真正运行时级别的产品/架构细节，而不是泛泛模块清单。

---

## 0. Master 结论

一个好的 Agent 平台，运行时必须回答这些问题：

1. 用户消息进入后，每个阶段如何流转？
2. 哪些内容可以立即流式输出，哪些必须等工具/护栏/反思完成？
3. 工具慢、失败、空结果、并发冲突时，用户看到什么？
4. 多模态输入如何解析成可靠槽位和证据？
5. Prompt 如何动态拼装，而不是一段大系统词？
6. 记忆什么时候抽取、什么时候写、什么时候不能写？
7. 反思是否默认开启？哪些高风险才触发？
8. Guardrail 在输入、工具前、工具后、输出前如何分层执行？
9. Handoff 是不是中断/恢复状态，而不是一句“转人工”？
10. Trace、Eval、Release、AgentOps 如何形成线上闭环？

本规范把这些问题拆成 40 个维度，并由 5 个子设计报告覆盖。

---

## 1. 5 组报告索引

| 组 | 文件 | 覆盖主题 |
|---|---|---|
| A | `runtime_subagent_reports/A_input_routing_context_prompt.md` | 输入、路由、Planner、多模态、Prompt、上下文、RAG、澄清、业务对象、语气 |
| B | `runtime_subagent_reports/B_execution_tools_latency_cost.md` | 流式、工具等待、多工具、长任务、错误、fallback、cache、取消、模型路由、成本 |
| C | `runtime_subagent_reports/C_memory_reflection_security_contracts.md` | Memory、Reflection、Guardrail、身份权限、用户确认、安全合规、数据契约 |
| D | `runtime_subagent_reports/D_output_channels_handoff_multiagent.md` | Handoff、人机协作、输出组件、渠道适配、多 Agent |
| E | `runtime_subagent_reports/E_observability_eval_release_agentops.md` | Feedback、Trace、Metrics、线上评测、Simulator、版本、发布、AgentOps |

---

## 2. 40 个设计维度总览

```text
01 Agent Loop 状态机
02 LLM 流式输出策略
03 Tool 调用等待与进度反馈
04 多工具串并行策略
05 Intent / Skill / Tool 路由策略
06 Planner / Executor 策略
07 多模态输入处理策略
08 Prompt 拼装策略
09 上下文窗口管理策略
10 Knowledge / RAG 召回策略
11 Memory 抽取与写入时机
12 Reflection 触发策略
13 Guardrail 执行顺序
14 Permission / Identity 策略
15 用户确认策略
16 Clarification 澄清策略
17 Handoff 中断/恢复体验
18 Human-Agent 协作策略
19 Long-running Task 体验
20 错误重试与降级
21 Fallback 分层策略
22 Cache 策略
23 并发与取消策略
24 Model Routing / Fallback 策略
25 Output Rendering / UI Component 策略
26 Channel Adapter 策略
27 Business Object / State Machine 策略
28 Feedback Learning 策略
29 Safety / Compliance Runtime 策略
30 Trace 事件定义
31 Observability Metrics 体系
32 Evaluation-in-Production 策略
33 Simulator / Sandbox 策略
34 Token / 延迟 / 成本控制
35 Agent Version Compatibility 策略
36 Data Contract 策略
37 Agent Tone / Personality Runtime 策略
38 Multi-agent 协作策略
39 Release / Canary / Rollback Runtime 策略
40 AgentOps 闭环策略
```

---

## 3. 运行时统一状态机建议

```text
inbound_event
  -> normalize_input
  -> modality_parse
  -> input_guardrail
  -> identity_permission_check
  -> intent_skill_tool_route
  -> clarify_or_plan_or_direct
  -> context_prompt_compile
  -> model_stream_start_or_status_ack
  -> tool_schedule_if_needed
  -> tool_progress_partial_updates
  -> tool_output_guardrail
  -> memory_candidate_extract
  -> reflection_if_triggered
  -> output_guardrail
  -> output_envelope_build
  -> channel_render_or_degrade
  -> send / handoff / interrupt / background_task
  -> trace_persist
  -> eval_sample / feedback_capture / ops_signal
```

---

## 4. 统一核心对象

### 4.1 RunState

```json
{
  "run_id": "run_123",
  "trace_id": "tr_123",
  "thread_id": "th_123",
  "turn_id": "turn_7",
  "checkpoint_id": "ckpt_0",
  "state": "routing|streaming|tool_wait|joining|reflecting|rendering|handoff|completed|failed|cancelled",
  "agent_version": "1.4.2",
  "artifact_set": {},
  "budget_state": {},
  "cancel_token": "ct_123"
}
```

### 4.2 OutputEnvelope

```json
{
  "output_id": "out_123",
  "trace_id": "tr_123",
  "semantic_type": "answer|status|clarification|handoff|confirmation|error",
  "text": "string",
  "components": [],
  "evidence_refs": [],
  "risk_tags": [],
  "channel_render_hints": {}
}
```

### 4.3 TraceEvent

```json
{
  "event_id": "evt_1",
  "trace_id": "tr_1",
  "span_id": "sp_1",
  "parent_span_id": "sp_root",
  "kind": "tool_call_started|guardrail_triggered|chunk_sent|handoff_created",
  "phase": "routing|prompt|model|tool|guardrail|render|handoff",
  "status": "ok|error|cancelled|blocked",
  "timestamp_ms": 1719999999999,
  "duration_ms": 120,
  "token_usage": {},
  "cost_usd": 0.0123,
  "redaction_state": "partial"
}
```

---

## 5. 落地优先级建议

### P0：先做运行时底座

1. RunState / trace_id / run_id / checkpoint_id。
2. 流式 chunk 协议。
3. Tool event 协议和等待状态。
4. 错误码矩阵和 fallback 层级。
5. Prompt 编译预览和上下文组装策略。
6. Guardrail 四层执行链。
7. Handoff checkpoint + payload。
8. OutputEnvelope + Channel Adapter 降级。
9. Trace event/span schema。
10. 发布门禁基础。

### P1：做线上闭环

1. Memory 分层写入。
2. Reflection 条件触发。
3. 多工具 DAG 调度。
4. Evaluation-in-production。
5. Feedback -> Ops task -> Regression。
6. Simulator / Sandbox。
7. Canary / Rollback 自动化。

### P2：做平台壁垒

1. 多 Agent Orchestrator + Arbiter。
2. 模型路由学习化。
3. AgentOps 自动建议 patch。
4. 行业模板级 runtime policy。
5. 全渠道组件设计系统。

---



---

# 附录 A：A_input_routing_context_prompt.md

# A 子任务：输入、路由、上下文与 Prompt Runtime 详细设计

> 交付文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\runtime_subagent_reports\A_input_routing_context_prompt.md`
> 适用范围：UAgent Agent Runtime 子任务 A
> 覆盖维度：01 Agent Loop 状态机、05 Intent/Skill/Tool 路由策略、06 Planner/Executor 策略、07 多模态输入处理策略、08 Prompt 拼装策略、09 上下文窗口管理策略、10 Knowledge/RAG 召回策略、16 Clarification 澄清策略、27 Business Object/State Machine 策略、37 Agent Tone/Personality Runtime 策略

---

## 0. 执行摘要

UAgent 在“输入 -> 路由 -> 规划 -> 召回 -> 执行 -> 回复”这一段的关键，不是把 Prompt、Skill、Tool、Knowledge 塞进一个大模型调用里，而是把一次用户请求拆成可观测、可恢复、可评测的 runtime 阶段，并在每个阶段显式记录状态、来源、置信度和失败原因。

本设计建议 UAgent 采用“**状态机驱动 + 结构化路由 + 条件化 Planner + 分层 Prompt + 业务对象约束 + 选择性澄清**”的 runtime 组合：
- 先识别输入类型和安全边界，再决定走问答、查数、执行、澄清、规划或转人工。
- 路由层不只选 Skill，还要同时选 Intent、Tool 候选、Knowledge 集合和是否启用 Planner。
- Prompt 不应是一段系统词，而应是由多个 fragment 在运行时编译出来的执行上下文。
- 上下文窗口不应简单截断，而应按“当前任务相关性、业务对象状态、证据优先级、风险等级”分层管理。
- Knowledge/RAG 不是默认每轮都查，而是在“事实缺口、低置信、需要证据、知识驱动场景”下按策略召回。
- 澄清不是失败分支，而是正常 runtime 节点，带有次数上限、回退策略和 UX 模板。

---

## 1. 设计总览

### 1.1 目标

- 让 UAgent 在输入阶段可判定“这轮应该做什么”，而不是盲目让模型自由生成。
- 让每次路由结果都可解释、可回放、可评估，能回答“为什么选了这个 Skill / Tool / Prompt”。
- 让复杂任务在需要时进入 Planner/Executor 模式，简单任务保持低延迟直答。
- 让多模态输入、知识召回、业务对象状态、澄清和语气控制都进入统一 runtime，不散落在 UI 或 prompt 里。

### 1.2 运行时总流程

```text
User Input
  -> Input Normalize / Safety Gate
  -> Modality Parse
  -> Intent Routing
  -> Skill / Tool / Knowledge / Planner Decision
  -> Context Assembly
  -> Optional Clarification / Planner
  -> Knowledge Retrieval
  -> Business Object Resolution
  -> Model Call / Tool Call
  -> Output Guard / Tone Adaptation
  -> Final Response / Handoff / Interrupt
```

### 1.3 核心原则

- **结构优先于自由文本**：路由、槽位、状态、权限、知识证据都应是结构化对象。
- **低风险快速直答，高风险显式分流**：默认低延迟，只有在不确定、需证据、需执行、需确认时进入更深层 runtime。
- **路由与执行解耦**：路由阶段只决定“怎么走”，执行阶段才拼 prompt 和调用工具。
- **业务对象约束生成**：订单、退款、工单等对象状态决定回答边界，而不是仅靠语言模型自己记忆。
- **语气是运行时策略，不是固定人设**：Tone 需要根据场景、风险、用户情绪和渠道动态调整。

---

## 2. 01 Agent Loop 状态机

### 2.1 设计目标

把单轮 Agent 行为定义成可恢复状态机，保证：
- 流程中断后可继续。
- 工具慢/错时可重试或降级。
- 澄清、审批、人工接管都能挂在状态机上。
- trace 中每一步都能定位。

### 2.2 运行时流程

建议状态流：

```text
received
  -> normalized
  -> classified
  -> routed
  -> context_built
  -> (clarify_pending | plan_pending | retrieve_pending | execute_pending)
  -> tool_running
  -> result_postprocessed
  -> response_composed
  -> response_streaming
  -> completed
  -> (interrupted | handed_off | failed | cancelled)
```

关键转移：
- `received -> normalized`：统一处理附件、文本、转写、表单回调。
- `normalized -> classified`：检测渠道、模态、风险、语言、情绪、是否疑似注入。
- `classified -> routed`：输出 intent、skills、tools、retrieval need、planner need。
- `routed -> context_built`：装配 prompt fragments、业务对象、上下文摘要和候选证据。
- `context_built -> clarify_pending`：缺关键槽位或存在强歧义时进入澄清。
- `context_built -> plan_pending`：复杂多步任务才进入 planner。
- `context_built -> retrieve_pending`：需要知识证据时进入 RAG。
- `execute_pending -> tool_running`：进入工具或 workflow 节点执行。
- `tool_running -> result_postprocessed`：处理工具结果、脱敏、摘要、业务对象更新。
- `response_composed -> response_streaming`：按渠道能力流式或非流式输出。
- 任意状态可转 `interrupted / handed_off / failed / cancelled`。

### 2.3 关键策略

- 使用显式 `run_state`，不要只保留聊天记录。
- 每个状态转移写入 `state_transition_reason` 和 `reason_code`。
- 对长任务保留 `checkpoint_id`，支持恢复到 `plan_pending`、`tool_running`、`clarify_pending`。
- `failed` 不应是终局，失败需区分可重试、可降级、需人工、需用户补充。

### 2.4 方案对比

#### 方案 A：线性消息循环
- 优点：实现简单。
- 缺点：无法可靠恢复，澄清/审批/多工具都变得脆弱。

#### 方案 B：状态机 + 局部状态保存
- 优点：易实现、足以覆盖大部分客服场景。
- 缺点：复杂分支多时，状态定义可能膨胀。

#### 方案 C：图式 runtime + checkpoint/interrupt/resume
- 优点：最适合多步任务、审批、人工接管、回放。
- 缺点：概念和实现复杂度更高。

### 2.5 推荐方案

推荐 `B + C` 混合：
- P0 场景使用轻量状态机。
- 复杂工作流升级为图式 runtime。
- 对外统一暴露同一套 `run_state`、`checkpoint` 和 `trace` 结构。

### 2.6 配置项

```yaml
agent_loop:
  max_turn_steps: 8
  max_retries_per_step: 1
  enable_checkpoint: true
  checkpoint_on:
    - clarify_pending
    - tool_running
    - pending_approval
    - handoff
  terminal_states:
    - completed
    - handed_off
    - failed
    - cancelled
```

### 2.7 数据结构 / schema

```json
{
  "trace_id": "tr_123",
  "thread_id": "th_456",
  "state": "tool_running",
  "intent": "order_logistics_query",
  "selected_skills": ["order-service"],
  "selected_tools": ["query_order_status"],
  "missing_slots": [],
  "confidence": 0.91,
  "business_object": {
    "type": "Order",
    "id": "ord_789",
    "status": "shipped"
  },
  "checkpoint_id": "ckpt_001",
  "reason_code": "tool_call_needed"
}
```

### 2.8 用户体验表现

- 用户能看到当前状态，例如“正在查询物流”“需要你补充订单号”“已转人工处理”。
- 工具慢时不会卡死，而是进入进度态。
- 失败不是直接报错，而是展示可理解的下一步。

### 2.9 异常分支

- 输入包含注入指令：进入安全分支，降低信任上下文。
- 工具长时间无响应：转重试、降级或提示稍后。
- 状态恢复失败：回到上一个 checkpoint 或转人工。
- 用户中途改意图：取消旧状态并重新路由。

### 2.10 评测 / 验收标准

- 90%+ 的会话能在 trace 中重建完整状态链路。
- 中断后恢复成功率可测，且不丢业务变量。
- 复杂流程错误不应表现为“模型胡说”，而应表现为明确状态。

### 2.11 借鉴项目具体机制

- OpenAI Agents SDK：`run_state`、`handoffs`、`guardrails`、`sessions`、`tracing`。
- LangGraph：`checkpoint`、`interrupt_before/after`、`resume`。
- OpenHands：事件驱动执行流和可恢复会话。
- AgentScope：事件与权限检查结合。

---

## 3. 05 Intent / Skill / Tool 路由策略

### 3.1 设计目标

- 把用户意图、Skill、Tool、Knowledge 和 Planner 的选择拆开，而不是让一个模型一把梭。
- 支持多路由结果并存：主 intent、辅助 skill、后处理 skill、候选 tool、候选 retrieval。
- 低误触发、高召回、可解释、可评测。

### 3.2 运行时流程

```text
input -> intent classify -> skill candidates -> tool candidates -> policy filter -> confidence score -> routing decision
```

路由结果至少包含：
- 主意图。
- 次级意图。
- 候选 Skill 列表及顺序。
- 候选 Tool 列表及可用性。
- 是否需要检索知识。
- 是否需要 Planner。
- 是否需要澄清。
- 是否需要转人工。

### 3.3 关键策略

- `Skill.description` 是第一路由信号，`SKILL.md` 正文仅在触发后加载。
- 路由要同时参考用户文本、session 变量、业务对象状态、渠道、权限和历史误触发统计。
- 近似 Skill 不能只靠关键词，必须有负例集和冲突优先级。
- Tool 不直接暴露给模型全部列表，而是先通过 policy 过滤启用集。
- 允许“Skill + Tool + Knowledge”组合，但要有主从关系，避免全局混乱。

### 3.4 方案对比

#### 方案 A：规则关键词路由
- 优点：便宜、稳定、可解释。
- 缺点：覆盖差、维护成本高、易漏长尾。

#### 方案 B：模型分类器路由
- 优点：语义泛化强，适合自然语言多样表达。
- 缺点：容易误触发，需评测和置信度管理。

#### 方案 C：两阶段路由
- 优点：规则做硬约束，模型做语义判断，兼顾准确率和可控性。
- 缺点：配置与调试更复杂。

### 3.5 推荐方案

推荐 `C`：
- 规则层先剪枝：业务线、权限、渠道、黑名单、显式 topic。
- 模型层再排序：意图、Skill、Tool、Knowledge 召回。
- 结果层再校验：置信度、冲突分、澄清阈值。

### 3.6 配置项

```yaml
routing:
  intent_threshold: 0.72
  skill_threshold: 0.68
  tool_threshold: 0.75
  enable_multi_skill: true
  max_skills_per_turn: 3
  max_tools_per_turn: 5
  low_confidence_action: clarify
  conflict_action: disambiguate
```

### 3.7 数据结构 / schema

```json
{
  "intent": "refund_progress_query",
  "intent_confidence": 0.84,
  "skill_candidates": [
    {"name": "refund-service", "score": 0.91},
    {"name": "order-service", "score": 0.76}
  ],
  "tool_candidates": [
    {"name": "query_refund_status", "score": 0.88, "enabled": true}
  ],
  "knowledge_targets": ["refund_policy_faq"],
  "needs_planner": false,
  "needs_clarification": false,
  "reason_codes": ["mentions_refund", "has_order_context"]
}
```

### 3.8 用户体验表现

- 用户不需要知道内部有哪些 Skill，但系统要稳定选对。
- 路由不确定时会问一个高信息量问题，而不是连问多轮。
- 对于已知业务对象，系统会优先给出可执行路径。

### 3.9 异常分支

- 多个 Skill 分数接近：进入澄清或冲突消解。
- Tool disabled 但 intent 正确：降级为知识回答或转人工。
- 路由输出 schema 校验失败：重试一次，否则 fallback。

### 3.10 评测 / 验收标准

- 每个 production skill 有正例、负例、近邻负例。
- 路由 precision/recall 可独立评测。
- 误触发原因可回溯到 description、threshold 或冲突规则。

### 3.11 借鉴项目具体机制

- Anthropic Skills：description 驱动触发、progressive disclosure、trigger eval。
- OpenAI Agents SDK：工具和 handoff 作为显式对象。
- AgentScope：skill/workspace/permission 组合路由。
- Dify / Coze：工作流、插件和知识源的组合式编排。

---

## 4. 06 Planner / Executor 策略

### 4.1 设计目标

- 简单任务直接答，复杂任务先计划后执行。
- Planner 输出结构化计划，而不是一段自由文本。
- Executor 专注执行、工具调用和结果整理。
- 计划可重规划、可中断、可恢复。

### 4.2 运行时流程

```text
route -> decide planning depth -> planner output -> plan validation -> executor steps -> verify -> final
```

Planner 需要回答：
- 是否需要多步。
- 每步目标是什么。
- 哪些步骤需要工具。
- 哪些步骤需要澄清/确认。
- 哪些步骤可并行。
- 哪些步骤有风险。

Executor 需要负责：
- 按步骤调用工具。
- 保存 step-level checkpoint。
- 工具失败时请求局部重试或重规划。
- 将中间结果压缩成适合下游的结构化摘要。

### 4.3 关键策略

- 以任务复杂度、工具数量、槽位缺失数、风险等级作为 planner 触发条件。
- 对短问答、简单检索、单工具调用，直接单轮执行，不额外 planner。
- 对多步任务，planner 产出 `steps[]`、`dependencies[]`、`fallbacks[]`。
- 计划必须可验证，不能只是一段自然语言。

### 4.4 方案对比

#### 方案 A：永远单模型直出
- 优点：快。
- 缺点：复杂任务不稳定，不可控。

#### 方案 B：永远先规划
- 优点：一致性高，适合长任务。
- 缺点：简单问题延迟高、成本高。

#### 方案 C：条件化 Planner / Executor 分离
- 优点：兼顾延迟和复杂任务质量。
- 缺点：路由门槛和状态定义更复杂。

### 4.5 推荐方案

推荐 `C`，并设置明确触发条件：
- 多工具。
- 多步骤。
- 需要确认。
- 需要跨业务对象状态判断。
- 需要长上下文推理。

### 4.6 配置项

```yaml
planner:
  enabled: true
  trigger_on:
    min_expected_steps: 2
    min_tool_count: 2
    has_risk_action: true
    missing_slots_count_gte: 2
  max_plan_steps: 6
  replan_on_tool_failure: true
  replan_on_new_user_intent: true
executor:
  max_step_retries: 1
  parallel_step_limit: 3
```

### 4.7 数据结构 / schema

```json
{
  "plan_id": "plan_001",
  "goal": "查询退款进度并告知用户",
  "steps": [
    {"id": "s1", "type": "retrieve", "tool": "query_refund_status", "depends_on": []},
    {"id": "s2", "type": "summarize", "depends_on": ["s1"]},
    {"id": "s3", "type": "respond", "depends_on": ["s2"]}
  ],
  "risks": ["do_not_commit_to_arrival_time"],
  "replan_triggers": ["tool_timeout", "status_conflict"]
}
```

### 4.8 用户体验表现

- 用户看到的是清晰的进度，而不是内部计划文本。
- 长任务可展示“正在查询/正在核实/正在生成回复”。
- 若需要确认，用户会看到关键动作前的明确确认卡片。

### 4.9 异常分支

- Planner 输出不合法：重试并降级。
- Executor 局部失败：局部重试，不重做全部任务。
- 用户中断：保存计划 checkpoint，等待恢复。

### 4.10 评测 / 验收标准

- 简单任务不能因为 planner 变慢。
- 长任务可恢复率、局部重试成功率、重规划准确率可衡量。
- 计划与执行结果一致性可通过 trace 验证。

### 4.11 借鉴项目具体机制

- LangGraph：状态图天然支持分步执行和恢复。
- OpenAI Agents SDK：hand offs + tool use behavior。
- OpenHands：分层执行与事件流。

---

## 5. 07 多模态输入处理策略

### 5.1 设计目标

- 统一处理文本、图片、语音、文件、截图、表单回调。
- 把多模态解析结果转成标准化 slots，而不是散乱的外部文本。
- 在路由前就知道哪些模态需要 OCR、ASR、视觉理解或文件解析。

### 5.2 运行时流程

```text
input -> modality detect -> parse -> extract slots -> confidence score -> route
```

典型输入处理：
- 文本：直接归一化、语言识别、注入检测。
- 图片：OCR + 视觉理解 + 版式提取 + 关键字段定位。
- 语音：ASR + 标点恢复 + 说话人标签 + 情绪特征。
- 文件：类型识别、分段、元数据提取、摘要。
- 截图：UI 元素提取、错误信息读取、订单/票据识别。

### 5.3 关键策略

- 模态解析先于意图路由，因为图片/文件本身可能决定 intent。
- OCR/ASR 结果要保留 `raw_text`、`normalized_text`、`confidence`、`source_span`。
- 图片和文件中的关键字段应转成槽位，而不是只进入上下文。
- 低置信 OCR/ASR 结果不应直接作为事实，需二次确认或结合业务对象验证。

### 5.4 方案对比

#### 方案 A：统一转文本后再路由
- 优点：实现最简单。
- 缺点：丢失结构信息，错漏高。

#### 方案 B：模态专用解析器 + 统一 slot 输出
- 优点：保留结构和置信度，适合生产。
- 缺点：解析器数量多，维护复杂。

#### 方案 C：模态解析器 + 任务感知解码
- 优点：对截图、票据、表单最强。
- 缺点：依赖更复杂的模型组合。

### 5.5 推荐方案

推荐 `B`，并对截图/票据类高价值场景局部引入 `C`。

### 5.6 配置项

```yaml
multimodal:
  enabled_modalities:
    - text
    - image
    - audio
    - file
    - screenshot
  ocr_confidence_threshold: 0.82
  asr_confidence_threshold: 0.85
  image_max_side: 2048
  parse_timeout_ms: 4000
  require_user_confirmation_on_low_confidence: true
```

### 5.7 数据结构 / schema

```json
{
  "modalities": ["image", "text"],
  "parsed_items": [
    {
      "type": "image_ocr",
      "raw_text": "订单号: 12345",
      "normalized_text": "order_id=12345",
      "confidence": 0.93,
      "source_span": {"x": 42, "y": 118, "w": 180, "h": 28}
    }
  ],
  "slots": {
    "order_id": "12345"
  }
}
```

### 5.8 用户体验表现

- 用户上传截图后，系统能直接识别订单号或错误码，并告诉用户“我识别到的是 X，请确认”。
- 语音输入会先转文字，再根据说话风格适当补全标点和口语结构。
- 文件输入会给出摘要和关键信息，而不是要求用户重复粘贴。

### 5.9 异常分支

- OCR 识别模糊：请求用户圈选或补充。
- 音频过短/过噪：提示重说或改文本。
- 文件解析超时：先返回已提取内容，并提示稍后补全。

### 5.10 评测 / 验收标准

- 多模态场景的 slot 提取准确率可单独评测。
- 截图类错误码识别应有专门集。
- 低置信模态不能直接触发高风险动作。

### 5.11 借鉴项目具体机制

- OpenAI Agents SDK：多种 tool / sandbox 能力可承接复杂输入。
- OpenHands：截图、终端、文件等多输入协同。
- AgentScope：事件与 workspace 结合，适合多源输入。

---

## 6. 08 Prompt 拼装策略

### 6.1 设计目标

- 将系统、开发者、场景、Skill、Tool、知识、业务对象、语气和输出格式组合成最终 prompt。
- 保证不同层次的 prompt 可 diff、可版本化、可 trace。
- 避免 prompt 大杂烩和重复注入。

### 6.2 运行时流程

```text
base system -> tenant policy -> agent profile -> scenario prompt -> skill prompt -> tool prompt -> retrieved evidence -> business object snapshot -> tone policy -> output schema
```

### 6.3 关键策略

- 分层拼装，先高优先级再低优先级。
- 每层有唯一 owner 和版本号。
- 注入条件明确，不满足条件不进上下文。
- Prompt 片段只携带必要信息，不重复原文全文。
- 最终 prompt 需记录 `fragments[]`，方便调试。

### 6.4 方案对比

#### 方案 A：单一 system prompt
- 优点：简单。
- 缺点：不可维护、不可审计、难以协作。

#### 方案 B：多层 prompt 静态拼接
- 优点：可管理。
- 缺点：上下文浪费，仍可能冗长。

#### 方案 C：多层 prompt 条件化编译
- 优点：最适合生产，能按任务注入。
- 缺点：需要编译器和可视化工具。

### 6.5 推荐方案

推荐 `C`。

### 6.6 配置项

```yaml
prompt_compile:
  layers:
    - system
    - developer
    - agent_profile
    - scenario
    - skill
    - tool
    - knowledge
    - business_object
    - tone
    - output_schema
  max_fragment_tokens: 1200
  dedupe_fragments: true
  preserve_source_tags: true
```

### 6.7 数据结构 / schema

```json
{
  "compiled_prompt_id": "cp_001",
  "fragments": [
    {"layer": "system", "source_id": "platform_v3", "tokens": 120},
    {"layer": "skill", "source_id": "order-service:v2", "tokens": 260},
    {"layer": "knowledge", "source_id": "refund_policy_faq", "tokens": 180}
  ],
  "final_token_count": 1560,
  "warnings": ["duplicate_policy_fragment_removed"]
}
```

### 6.8 用户体验表现

- 高级用户可以查看最终 prompt preview。
- 修改 skill/policy 后，能够看到最终注入效果变化。
- 用户不会看到重复话术或互相冲突的指令。

### 6.9 异常分支

- 某 fragment 超长：裁剪或摘要。
- 层级冲突：系统层覆盖场景层。
- 编译失败：回退到保守 prompt。

### 6.10 评测 / 验收标准

- 最终 prompt 可完整追踪来源。
- 不能出现系统/租户/Skill 互相覆盖的安全违规。
- 注入 fragment 的重复率可统计。

### 6.11 借鉴项目具体机制

- Claude Code / Anthropic Skills：渐进加载。
- OpenAI Agents SDK：instructions / tool / guardrail / handoff 组合。
- OpenHands：repo-specific instructions 加载顺序。

---

## 7. 09 上下文窗口管理策略

### 7.1 设计目标

- 在有限窗口内保留最关键的任务证据、业务状态和最近交互。
- 控制 token 成本，避免把整段历史塞给模型。
- 确保压缩后仍能恢复决策。

### 7.2 运行时流程

```text
history -> relevance scoring -> compaction -> evidence selection -> prompt assembly
```

### 7.3 关键策略

- 历史消息按“当前 intent 相关性 + 最近性 + 风险等级 + 业务对象绑定”排序。
- 区分四类上下文：原始对话、任务摘要、业务对象状态、证据片段。
- 工具返回不直接全文注入，优先摘要和关键字段。
- 长会话定期压缩成“状态摘要”，而不是自然语言小结。
- 重要事实需保留来源标记，避免压缩后失去可审计性。

### 7.4 方案对比

#### 方案 A：滑动窗口截断
- 优点：简单。
- 缺点：容易丢业务状态和证据。

#### 方案 B：摘要 + 最近消息混合
- 优点：实用，适合多数场景。
- 缺点：摘要质量决定上限。

#### 方案 C：状态化上下文管理
- 优点：最稳，适合业务客服和长流程。
- 缺点：实现复杂。

### 7.5 推荐方案

推荐 `B + C`：
- 近场消息保留。
- 任务摘要和业务对象状态持久化。
- 关键证据片段按需召回。

### 7.6 配置项

```yaml
context_window:
  max_input_tokens: 24000
  recent_turns_keep: 8
  summary_refresh_every_turns: 4
  evidence_budget_tokens: 4000
  business_state_budget_tokens: 1200
  preserve_tool_results_count: 3
```

### 7.7 数据结构 / schema

```json
{
  "context_pack": {
    "recent_messages": [],
    "task_summary": {
      "goal": "查询退款进度",
      "open_questions": ["是否确认订单号"],
      "actions_taken": ["query_refund_status"]
    },
    "business_state": {
      "type": "Refund",
      "status": "reviewing"
    },
    "evidence": [
      {"source_id": "refund_policy_faq", "quote_id": "q12", "confidence": 0.94}
    ]
  }
}
```

### 7.8 用户体验表现

- 用户不会因为对话太长而被反复问同一个问题。
- 系统会记住已经确认过的事实。
- 长任务恢复后不会像“失忆”一样重新开始。

### 7.9 异常分支

- 摘要丢失关键状态：回退到最近 checkpoint。
- 证据预算不足：只保留最相关来源。
- 上下文冲突：以业务对象状态为准，并标记冲突来源。

### 7.10 评测 / 验收标准

- 长对话压缩后，关键业务变量不应丢失。
- 重复提问率可下降。
- token 成本可控且有上限。

### 7.11 借鉴项目具体机制

- LangGraph memory / checkpoint。
- OpenAI Agents session。
- OpenHands event store + conversation state。

---

## 8. 10 Knowledge / RAG 召回策略

### 8.1 设计目标

- 不是“每轮都检索”，而是按需召回。
- 检索结果必须可引用、可追踪、可冲突处理。
- 知识召回要服务于路由、澄清、执行和输出。

### 8.2 运行时流程

```text
need_knowledge? -> query rewrite -> source selection -> retrieve -> rerank -> conflict check -> evidence inject
```

### 8.3 关键策略

- 检索触发条件：知识驱动问题、事实不确定、业务规则敏感、需要引用、工具结果与用户陈述冲突。
- 召回对象：按 Agent、Topic、业务对象类型、权限范围、渠道和时间版本过滤。
- 召回后要 rerank，并处理不同知识源的冲突。
- 输出应区分“事实证据”和“模型推断”。
- 对低置信知识回答，优先回到澄清或保守回答，而不是强答。

### 8.4 方案对比

#### 方案 A：固定 top-k 检索
- 优点：简单。
- 缺点：噪音大、冲突多。

#### 方案 B：意图驱动检索 + rerank
- 优点：召回更准。
- 缺点：需要较好的 query rewrite 和元数据。

#### 方案 C：业务对象感知检索
- 优点：最适合客服业务和政策问答。
- 缺点：依赖知识治理和结构化元数据。

### 8.5 推荐方案

推荐 `C`，并在实现初期先落 `B`。

### 8.6 配置项

```yaml
rag:
  enabled: true
  top_k: 6
  rerank_top_k: 3
  confidence_threshold: 0.78
  require_citation_for_policy_answers: true
  source_whitelist:
    - faq
    - policy
    - product_manual
    - ticket_history
```

### 8.7 数据结构 / schema

```json
{
  "retrieval_query": "退款多久到账",
  "sources": ["faq", "policy"],
  "results": [
    {
      "doc_id": "faq_101",
      "chunk_id": "c3",
      "score": 0.92,
      "evidence_type": "policy",
      "text": "退款到账时间取决于支付渠道",
      "citation": "faq_101#c3"
    }
  ],
  "conflicts": [],
  "inject_as": "evidence"
}
```

### 8.8 用户体验表现

- 用户看到的是基于知识的答案，不是编造的说法。
- 引用来源清晰时，用户更容易信任。
- 知识缺失时，系统会明确说“我需要再确认”或转人工。

### 8.9 异常分支

- 无命中：进入澄清、保守回答或人工。
- 冲突知识：优先更高版本、更高权限或更近业务对象来源。
- 检索超时：降级为 cached evidence 或提示稍后。

### 8.10 评测 / 验收标准

- 检索命中率、答案引用率、冲突识别率、误导率可量化。
- 每个 policy answer 应有 citation。
- 知识缺口能回流到内容运营。

### 8.11 借鉴项目具体机制

- LangGraph memory / store 模式。
- OpenAI / Anthropic 技术栈的 evidence-aware 输出习惯。
- Dify / Coze 的知识源绑定和工作流式召回。

---

## 9. 16 Clarification 澄清策略

### 9.1 设计目标

- 缺槽位、歧义、多选、低置信时，系统会提出最小澄清，而不是猜。
- 澄清要尽量一次问到位。
- 澄清本身是一个状态节点，可恢复、可超时、可转人工。

### 9.2 运行时流程

```text
low_confidence or missing_slot or ambiguity -> generate clarifying question -> wait -> resume with slot update
```

### 9.3 关键策略

- 澄清优先问“信息量最大、用户成本最低”的问题。
- 如果能从 session、业务对象或知识里补足，就不要问。
- 澄清次数有限，连续失败或用户情绪高时应转人工。
- 多选澄清优先用选项卡、按钮或编号列表。
- 澄清必须保留当前任务上下文，避免用户回答后系统忘记前文。

### 9.4 方案对比

#### 方案 A：固定模板提问
- 优点：容易实现。
- 缺点：不够智能，容易打断体验。

#### 方案 B：模型生成澄清问题
- 优点：自然，适应性强。
- 缺点：可能问偏、问多、问不清。

#### 方案 C：槽位驱动 + 模板/模型混合
- 优点：平衡一致性和自然度。
- 缺点：需要完善 slot/intent 设计。

### 9.5 推荐方案

推荐 `C`。

### 9.6 配置项

```yaml
clarification:
  max_rounds: 2
  min_confidence_for_auto_answer: 0.76
  ask_only_high_value_missing_slots: true
  prefer_single_question: true
  fallback_to_handoff_after_failed_rounds: true
```

### 9.7 数据结构 / schema

```json
{
  "clarify_needed": true,
  "reason_code": "missing_order_id",
  "question": "你要查询的是哪一个订单？",
  "options": [
    {"label": "最近一次订单", "value": "latest_order"},
    {"label": "手动输入订单号", "value": "enter_order_id"}
  ],
  "resume_state": "route_pending"
}
```

### 9.8 用户体验表现

- 问题短、明确、可选项清晰。
- 用户回答后会无缝回到原流程。
- 如果已经问过，不会重复追问。

### 9.9 异常分支

- 用户拒绝回答：转人工或保守回答。
- 多轮澄清仍不清：终止自动化。
- 澄清后用户改意图：重新路由。

### 9.10 评测 / 验收标准

- 澄清准确率和一次问中率可评测。
- 重复澄清率要低。
- 低置信场景中不应强行直答。

### 9.11 借鉴项目具体机制

- LangGraph interrupt/resume。
- OpenAI Agents 的 handoff / user input flow。
- OpenHands 的交互式人类介入模式。

---

## 10. 27 Business Object / State Machine 策略

### 10.1 设计目标

- 把订单、退款、工单、优惠券、商品、物流等对象纳入 runtime 语义。
- 让回答和动作受业务状态机约束。
- 让系统知道“什么状态能说什么、能做什么、不能承诺什么”。

### 10.2 运行时流程

```text
object resolve -> state check -> allowed action check -> response policy selection -> tool/action execution
```

### 10.3 关键策略

- 对每个业务对象定义状态、可见字段、允许动作、禁止承诺、推荐话术。
- 路由和知识召回要读取当前对象状态。
- 若 tool 输出与对象状态冲突，应优先对象状态机和更可信证据。
- 高风险对象状态变化要记录 checkpoint，方便回放。

### 10.4 方案对比

#### 方案 A：只用自然语言 prompt 约束
- 优点：实现快。
- 缺点：无法稳定约束业务边界。

#### 方案 B：对象 schema + 简单状态表
- 优点：落地快、解释性好。
- 缺点：复杂流程仍会不足。

#### 方案 C：业务对象中心 + 状态机 + 规则/话术/动作映射
- 优点：最适合客服和交易业务。
- 缺点：建模成本高。

### 10.5 推荐方案

推荐 `C`。

### 10.6 配置项

```yaml
business_objects:
  Order:
    states: [created, paid, packed, shipped, delivered, completed, cancelled]
    state_source_priority: [tool_result, session, knowledge]
  Refund:
    states: [requested, reviewing, approved, processing, refunded, rejected]
    forbid_claims:
      - exact_arrival_time
      - guaranteed_success
```

### 10.7 数据结构 / schema

```json
{
  "type": "Refund",
  "id": "rf_123",
  "status": "reviewing",
  "visible_fields": {
    "amount": 128.0,
    "currency": "CNY"
  },
  "allowed_actions": ["query_refund_detail"],
  "forbidden_claims": ["commit_exact_arrival_time"],
  "user_message_template": "您的退款申请正在审核中。"
}
```

### 10.8 用户体验表现

- 用户不会看到与状态不一致的回答。
- 当状态不支持自动处理时，系统会明确告知并转交。
- 卡片、表格、状态文案更稳定。

### 10.9 异常分支

- tool 与对象状态冲突：标记冲突并请求复核。
- 对象缺失：尝试从 session/知识补全，否则澄清。
- 状态未知：走保守回复或人工。

### 10.10 评测 / 验收标准

- 状态机覆盖率可测。
- 状态不一致回答率应显著下降。
- 业务对象状态驱动的卡片渲染应稳定。

### 10.11 借鉴项目具体机制

- 这部分主要借鉴 UAgent 本地设计文档中“业务对象中心”的思路。
- 结合 OpenAI Agents 的结构化 tool output、LangGraph state、AgentScope permission state。

---

## 11. 37 Agent Tone / Personality Runtime 策略

### 11.1 设计目标

- 语气不是固定人格，而是可按场景调节的 runtime 参数。
- 在同一个 Agent 内，咨询、道歉、催办、安抚、拒绝、转人工的语气应不同。
- Tone 不能破坏事实准确性和合规边界。

### 11.2 运行时流程

```text
user emotion + channel + risk level + business object state -> tone policy -> response style
```

### 11.3 关键策略

- Tone 分为基础人格和场景修饰两层。
- 基础人格保证统一品牌感；场景修饰根据情绪、风险和渠道变化。
- 高风险场景优先清晰、克制、准确，不追求过度拟人。
- 愤怒用户使用更短句、更明确的步骤、更高同理心。
- 正常查询使用简洁、直接、专业语气。

### 11.4 方案对比

#### 方案 A：固定人设 prompt
- 优点：简单。
- 缺点：不适应场景切换。

#### 方案 B：场景化 tone rules
- 优点：适合客服，容易控制。
- 缺点：需要情绪和风险识别。

#### 方案 C：基础人格 + 动态 tone policy
- 优点：兼顾品牌一致性和场景适配。
- 缺点：需要更好的 runtime 编排。

### 11.5 推荐方案

推荐 `C`。

### 11.6 配置项

```yaml
tone:
  base_personality: "professional_warm"
  channel_overrides:
    voice: "short_clear"
    web: "concise_helpful"
  emotion_overrides:
    angry: "calm_empathic"
    anxious: "reassuring_direct"
  risk_overrides:
    high_risk: "strict_factual"
```

### 11.7 数据结构 / schema

```json
{
  "tone_policy": {
    "base": "professional_warm",
    "applied_overrides": ["angry", "high_risk"],
    "response_constraints": [
      "avoid_over_promise",
      "use_short_sentences",
      "show_next_step"
    ]
  }
}
```

### 11.8 用户体验表现

- 用户感受到一致但不生硬的服务语气。
- 情绪场景下更安抚，风险场景下更克制。
- 不会为了“像人”而牺牲事实和合规。

### 11.9 异常分支

- 情绪识别误判：默认使用中性专业语气。
- Tone 配置冲突：高风险覆盖情感修饰。
- 渠道限制不支持长文：自动降为简洁风格。

### 11.10 评测 / 验收标准

- 语气一致性、场景适配和风险边界可分别评测。
- 高风险场景中不应出现过度承诺语气。
- 负面情绪场景中的用户满意度应提升。

### 11.11 借鉴项目具体机制

- OpenAI / Anthropic 的 system / developer / scenario 分层思路。
- 商业客服平台对“品牌语气 + 风险边界”的运行时控制。

---

## 12. UAgent 落地优先级

### P0 优先落地

1. Agent Loop 状态机。
2. Intent / Skill / Tool 路由。
3. Prompt 分层编译。
4. 上下文窗口管理。
5. 澄清状态节点。
6. Business Object 最小状态模型。
7. Knowledge/RAG 按需召回。

### P1 继续增强

1. Planner / Executor 分离。
2. 多模态解析统一 slot 层。
3. Tone runtime 政策。
4. 路由 / prompt / RAG 的评测面板。

### P2 高级化

1. 图式 runtime 统一所有复杂流。
2. 业务对象中心与动作权限更深度整合。
3. 语气、情绪和品牌策略联动优化。

---

## 13. 参考与借鉴项目机制

### OpenAI Agents SDK
- Agent / Tool / Handoff / Guardrail / Session / Tracing。
- 适合借鉴结构化对象与可观测 runtime。

### LangGraph
- checkpoint / interrupt / resume / state graph。
- 适合借鉴长流程和可恢复执行。

### Anthropic Skills
- description 驱动触发、progressive disclosure、trigger eval。
- 适合借鉴 Skill 触发和文档加载层次。

### OpenHands
- 事件流、技能加载、可恢复 workspace。
- 适合借鉴事件驱动执行和交互式调试。

### AgentScope
- permission engine、event model、workspace 语义。
- 适合借鉴权限/事件/工作区耦合。

### Dify / Coze
- workflow、知识库、发布渠道、低代码配置。
- 适合借鉴产品化配置和多渠道发布。

---

## 14. UAgent 结论

UAgent 这一层不应做成“模型先想、再试着调用工具”的松散链路，而应做成“**路由可解释、执行可恢复、上下文可压缩、知识可引用、澄清可恢复、语气可控、业务对象可约束**”的 runtime 系统。这样才能支撑后续的发布、评测、灰度、人工接管和企业级治理。


---

# 附录 B：B_execution_tools_latency_cost.md

# 子任务 B：执行、工具、流式、延迟、错误、缓存与成本详细设计

> 输出文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\runtime_subagent_reports\B_execution_tools_latency_cost.md`  
> 覆盖维度：02 LLM 流式输出策略、03 Tool 调用等待与进度反馈、04 多工具串并行策略、19 Long-running Task 体验、20 错误重试与降级、21 Fallback 分层策略、22 Cache 策略、23 并发与取消策略、24 Model Routing/Fallback 策略、34 Token/延迟/成本控制。

## 0. 核心结论

本组主题的主轴不是“模型怎么回答”，而是：**任何一次 Agent 回答都必须是一个可观测、可中断、可重试、可降级、可取消、可计费的运行单元**。

统一运行对象建议：

```json
{
  "run_id": "run_123",
  "trace_id": "tr_123",
  "thread_id": "th_123",
  "turn_id": "turn_7",
  "checkpoint_id": "ckpt_0",
  "state": "routing|streaming|tool_wait|joining|reflecting|rendering|completed|failed|cancelled",
  "budget_state": {},
  "cancel_token": "ct_123"
}
```

---

# 02. LLM 流式输出策略

## 设计目标

- 把“首响快”和“答案完整”拆开：先给用户可感知反馈，再逐步填充结果。
- 让用户区分：已收到、正在查询、拿到部分结果、最终回答。
- 支持工具等待、guardrail 中断、渠道不支持流式时降级。

## 运行时流程

```text
receive message
  -> quick route: direct / tool / clarify / long_task
  -> if direct: stream answer
  -> if tool-needed: send ack/status first
  -> call tools
  -> stream partial result or final answer
  -> final guardrail
  -> final close chunk
```

## 关键策略

- **首响策略**：目标 300-800ms 内发送 ack 或首 token。
- **状态 chunk**：将输出分成 `ack / tool_wait / partial_result / final_answer / final_close`。
- **禁止暴露思考**：不要把模型内部推理作为流式内容展示。
- **高风险输出延迟展示**：涉及赔付/法律/退款承诺时先状态占位，最终经 guardrail 后输出。
- **渠道降级**：不支持流式时用 typing/等待文案 + 最终整段。

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| Token 级流式 | 首响最快 | 工具等待体验差，容易泄漏半成品 |
| 段落级流式 | 稳定，易 guardrail | 首响慢 |
| 混合式流式 | 首响快、状态清晰、可控 | 需要状态机和事件协议 |

## 推荐方案

采用 **混合式流式**：低风险直答 token 流；工具场景状态流；最终结果段落流；高风险先不输出实质结论。

## 配置项

```yaml
streaming:
  enabled: true
  first_response_deadline_ms: 800
  ack_templates:
    tool_needed: "我帮你查一下，请稍等。"
    clarify_needed: "我需要再确认一个信息。"
  chunk_types: [ack, tool_wait, partial_result, final_answer, final_close]
  suppress_internal_reasoning: true
  guardrail_interrupt_mode: stop_and_repair
```

## schema

```json
{
  "chunk_id": "chk_1",
  "trace_id": "tr_1",
  "run_id": "run_1",
  "chunk_type": "ack|tool_wait|partial_result|final_answer|error|done",
  "text_delta": "string",
  "component_delta": null,
  "visibility": "user|internal",
  "seq": 1
}
```

## 异常分支

- 首 token 超时：发送系统 ack，再切换模型或进入降级。
- guardrail 命中：停止当前流，发送修复后的保守回答。
- 连接断开：保留 run，支持用户回来后继续获取 final answer。

## 验收标准

- TTFT p95 可达成配置阈值。
- 工具等待不出现静默超过阈值。
- 被 guardrail 拦截的内容不泄露给用户。

---

# 03. Tool 调用等待与进度反馈

## 设计目标

工具调用不应是黑盒。用户要知道系统在查什么、查到哪一步、慢在哪里、失败后下一步是什么。

## 运行时流程

```text
before_tool_call: validate args / permission / confirmation
  -> emit tool_started
  -> if slow: emit tool_wait
  -> if partial: emit partial_result
  -> if success: summarize and continue
  -> if fail: retry/degrade/handoff
```

## 策略

- 工具启动立即发 trace event。
- 超过 `announce_after_ms` 向用户发等待提示。
- 多工具时展示 `正在查询订单 1/2`。
- 工具结果先进入 summarizer，不把 raw payload 直接给模型和用户。
- 写操作不展示“已执行”直到确认成功。

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 静默等待 | 实现简单 | 用户体验差 |
| 转圈/typing | 低成本 | 信息不足 |
| 状态文案 + 阶段进度 + partial update | 体验最好 | 需要工具事件协议 |

## 推荐方案

P0 用状态文案 + 工具事件；P1 支持 partial result；P2 支持工具内部进度上报。

## 配置项/schema

```yaml
tool_progress:
  announce_after_ms: 1000
  heartbeat_interval_ms: 2500
  max_silent_wait_ms: 4000
  partial_update_enabled: true
```

```json
{
  "tool_run_id": "toolrun_1",
  "tool_name": "query_orders",
  "phase": "started|waiting|partial|retrying|completed|failed",
  "stage_label": "查询订单列表",
  "progress_ratio": 0.5,
  "user_visible_text": "正在查询你的订单…"
}
```

## 异常分支

- 工具无心跳：标记 suspect，触发超时。
- 工具返回空：进入澄清或保守回复。
- 工具需要授权：切换身份/确认流程。

## 验收标准

- 100% 工具调用有 started/completed/failed 事件。
- 慢工具有用户可见进度反馈。
- raw API 错误不直接展示。

---

# 04. 多工具串并行策略

## 设计目标

在保证依赖和副作用安全的前提下降低总时延。

## 流程

```text
build tool DAG
  -> classify read/write/risk/dependencies
  -> execute independent read tools in parallel
  -> join results
  -> conflict resolution
  -> final synthesis
```

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 全串行 | 简单安全 | 慢 |
| 全并行 | 快 | 容易冲突/副作用危险 |
| DAG 调度 | 兼顾速度和安全 | 需要建依赖图 |

## 推荐方案

采用 DAG：只读、不同资源、无依赖可并行；写操作、高风险、同一资源默认串行。

## 配置/schema

```yaml
tool_scheduler:
  max_parallel_tools: 3
  serialize_write_actions: true
  serialize_same_resource: true
  join_policy: all_required
```

```json
{
  "tool_graph": {
    "nodes": [{"id":"query_orders","risk":"L1","mode":"parallel"}],
    "edges": [{"from":"query_orders","to":"query_logistics","type":"depends_on"}],
    "join_policy":"all_required|first_success|priority_merge"
  }
}
```

## 异常分支

- 一个分支失败：按 join policy 决定继续/降级。
- 结果冲突：工具证据优先级 + 时间戳 + source priority。
- 后到结果推翻先到 partial：发送更正说明。

## 验收标准

- 并行后 p95 降低。
- 写操作无错误并发。
- 冲突结果不直接暴露给用户。

---

# 19. Long-running Task 体验

## 设计目标

把长任务从前台阻塞变成可后台执行、可通知、可恢复、可取消。

## 流程

```text
estimate runtime
  -> if > threshold: create background job
  -> ack user
  -> checkpoint per step
  -> notify on completion/failure
  -> resume/view result
```

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 前台等待 | 简单 | 易超时，体验差 |
| 全后台 | 稳 | 交互弱 |
| 前台确认 + 后台任务 | 平衡 | 需要 job 状态机 |

## 推荐方案

超过阈值转后台任务，给用户任务卡/工单号/通知入口。

## 配置/schema

```yaml
long_task:
  threshold_ms: 8000
  checkpoint_interval_steps: 1
  notify_channels: [current_channel, app_notification, webhook]
  resume_ttl: 7d
```

```json
{
  "task_id":"task_1",
  "state":"queued|running|paused|completed|failed|cancelled|expired",
  "progress":{"current":2,"total":5,"label":"正在生成售后处理方案"},
  "checkpoint_id":"ckpt_1"
}
```

## 异常分支

- 用户离开：任务继续，完成后通知。
- 通知失败：消息中心保留。
- 长任务失败：基于 checkpoint 恢复或转人工。

## 验收标准

- 刷新/离开后可恢复。
- 不重复执行副作用。
- 任务状态和进度可追踪。

---

# 20. 错误重试与降级

## 设计目标

错误要分类处理，避免无脑重试。

## 错误分类

- `VALIDATION_ERROR`：修参数/澄清。
- `AUTH_MISSING`：登录/身份确认。
- `PERMISSION_DENIED`：不重试，转人工或拒绝。
- `TIMEOUT`：退避重试一次。
- `RATE_LIMIT`：排队/降级/稍后。
- `UPSTREAM_ERROR`：保守回复/工单。
- `FORMAT_ERROR`：schema 修复重试。

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 统一 retry | 简单 | 浪费时间，可能扩大风险 |
| 错误码矩阵 | 精准 | 需维护 |
| 错误码矩阵 + fallback | 生产可控 | 复杂 |

## 推荐方案

错误码矩阵 + 每类错误的 retry/repair/degrade/handoff 动作。

## schema

```json
{
  "error_code":"TIMEOUT",
  "retryable":true,
  "repairable":false,
  "attempt":1,
  "max_attempts":2,
  "fallback_action":"retry_once_then_conservative_reply"
}
```

## 验收标准

- 无无限重试。
- 权限错误不重试。
- schema 修复失败后转 fallback。

---

# 21. Fallback 分层策略

## 设计目标

失败恢复要有层次：修复、重试、换 prompt、换模型、缓存、保守回答、工单、人工。

## 推荐层级

```text
repair args/schema
 -> retry same path
 -> re-prompt
 -> switch model
 -> use cache/stale-safe data
 -> conservative answer
 -> create ticket
 -> human handoff
```

## 配置/schema

```yaml
fallback:
  layers: [repair, retry, reprompt, remodel, cache, conservative, ticket, handoff]
  max_depth: 4
  safety_errors_skip_to: handoff
```

```json
{
  "fallback_stage":"retry|reprompt|remodel|cache|conservative|handoff",
  "trigger_reason":"tool_timeout",
  "preserve_context":true,
  "selected_action":"retry_once"
}
```

## 验收标准

- 每次 fallback 有 reason code。
- fallback 不绕过 guardrail。
- 关键失败可生成 regression eval。

---

# 22. Cache 策略

## 设计目标

降低延迟和成本，但避免过期/跨租户/跨用户污染。

## 缓存层

| 层 | 内容 | TTL |
|---|---|---|
| run cache | 本轮工具中间结果 | run |
| session cache | 会话内订单摘要/检索结果 | session |
| tenant cache | 稳定知识 rerank / prompt compile | version-bound |
| persistent cache | 静态配置/模板 | long |

## 策略

- cache key 必须包含 tenant、user/scope、版本、权限、tool args hash。
- 个人数据短 TTL，写操作不缓存结果用于执行。
- prompt 编译和知识检索可版本化缓存。

## schema

```json
{
  "cache_key":"hash",
  "resource_type":"tool_result|retrieval|prompt_compile|summary",
  "scope":"run|session|tenant|global",
  "source_version":"v1",
  "expires_at":"RFC3339",
  "pii_class":"none|masked|sensitive"
}
```

## 验收标准

- 跨租户缓存命中为 0。
- 缓存命中率和错误命中率可统计。
- 配置/知识/工具版本变化后缓存失效。

---

# 23. 并发与取消策略

## 设计目标

处理用户中途改意图、旧工具还在跑、多端同时操作、人工接管等并发现实。

## 流程

```text
new turn -> create run_id/cancel_token
if previous run active:
  decide cancel / background / continue
inflight tool returns:
  stale check by run_id/checkpoint
```

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 硬杀任务 | 快 | 可能留下半副作用 |
| 标记失效 | 安全 | 浪费资源 |
| 协作式取消 + stale check | 稳定 | 需全链路支持 |

## 推荐方案

协作式取消。新消息默认取消旧的未完成低风险 run；写操作和审批流程进入 pending，不随意取消。

## schema

```json
{
  "run_id":"run_1",
  "cancel_token":"ct_1",
  "cancel_reason":"new_message|handoff|timeout|manual",
  "state":"active|cancelling|cancelled|stale"
}
```

## 验收标准

- 旧结果不会污染新对话。
- 人工接管后 Agent 不再抢答。
- 被取消 run 不触发新的副作用工具。

---

# 24. Model Routing / Fallback 策略

## 设计目标

不同任务用不同模型，平衡质量、风险、延迟和成本。

## 路由维度

- 任务类型：FAQ/工具/推理/总结/安全检查。
- 风险等级。
- 上下文长度。
- 工具复杂度。
- 渠道 SLA。
- 客户预算。

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 单模型 | 简单 | 成本/质量不灵活 |
| 规则路由 | 可解释 | 需调参 |
| 学习型路由 | 自适应 | 冷启动和可解释弱 |

## 推荐方案

P0 规则路由；P1 增加基于历史效果的推荐；高风险只能升级不能为了省钱降级。

## schema

```json
{
  "model_route": {
    "selected_model":"strong_model",
    "fallback_models":["standard_model"],
    "reason_codes":["high_risk","long_context"],
    "latency_budget_ms":3000,
    "cost_budget_usd":0.05
  }
}
```

## 验收标准

- 路由决策进入 trace。
- 高风险任务不误降级。
- 成本下降不显著损害解决率。

---

# 34. Token / 延迟 / 成本控制

## 设计目标

把 token、延迟、工具调用、模型成本都纳入预算系统，控制每次解决成本。

## 预算层级

- turn budget。
- session budget。
- workflow budget。
- tenant daily/monthly budget。
- per-agent budget。

## 策略

- 先裁剪无关上下文，再减少工具 fanout，再降级模型，最后保守回答/人工。
- 成本控制不能只看 token，要看 cost per resolved case。
- trace span 记录 tokens、duration、cost，作为预算事实源。

## 配置/schema

```yaml
budget:
  max_input_tokens: 12000
  max_output_tokens: 1200
  latency_budget_ms: 5000
  max_tool_calls: 5
  cost_budget_usd: 0.05
  exhaustion_policy: compress_then_degrade_then_handoff
```

```json
{
  "budget_state": {
    "prompt_tokens": 1000,
    "completion_tokens": 200,
    "tool_calls": 2,
    "duration_ms": 1800,
    "model_cost_usd": 0.012,
    "remaining_cost_usd": 0.038
  }
}
```

## 异常分支

- token 超限：压缩上下文。
- latency 超限：停止额外工具/反思。
- cost 超限：低风险降级，高风险转人工/强模型保守处理。

## 验收标准

- 每个 run 有完整成本归因。
- 每解决成本可统计。
- 超预算行为一致，不随机失败。

---

## B 组落地顺序

1. 先实现 run state、stream event、tool event、budget state、cancel token 五个底座。
2. 再做工具等待体验、多工具调度、错误矩阵。
3. 然后做 long-running task、cache、model routing。
4. 最后做成本优化和自动策略推荐。


---

# 附录 C：C_memory_reflection_security_contracts.md

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


---

# 附录 D：D_output_channels_handoff_multiagent.md

# 子任务 D：输出体验、渠道、Handoff、人机协作和多 Agent 详细设计

> 输出文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\runtime_subagent_reports\D_output_channels_handoff_multiagent.md`  
> 覆盖维度：17 Handoff 中断/恢复体验、18 Human-Agent 协作策略、25 Output Rendering/UI Component 策略、26 Channel Adapter 策略、38 Multi-agent 协作策略。  
> 设计目标：让 UAgent 在不同渠道、不同接管状态、不同 Agent 协作模式下，始终给用户和人工客服一个可理解、可恢复、可审计、可降级的体验。

---

## 0. 覆盖范围与总体原则

### 覆盖范围

- 用户端：消息输出、流式/非流式展示、卡片/按钮/表单/表格/引用/进度条展示、转人工前中后体验、恢复会话体验。
- 人工端：Inbox 接管、接管摘要、Agent 建议、可采纳草稿、纠错回流、旁路观察。
- 渠道端：Web、App、微信/企微、飞书/钉钉、电商 IM、邮件、语音/API 等渠道能力差异和降级。
- 多 Agent 端：主 Agent/专家 Agent/评审 Agent/工具 Agent 的路由、仲裁、权限隔离、共享状态和 trace 展示。

### 总体设计原则

1. **转交不是失败结束，而是 checkpoint 后的 interrupt/resume。** Handoff 必须保存业务状态、已确认事实、工具结果和 pending 动作，人工或专家 Agent 返回后从原节点恢复。
2. **输出先生成语义组件，再由渠道适配器渲染。** Runtime 不直接拼某个渠道的 HTML/Markdown，而是输出 `OutputEnvelope + UIComponent[]`，由 Channel Adapter 决定展示或降级。
3. **人工接手要少读、快判断、可行动。** Inbox 默认展示结构化摘要、风险原因、用户情绪、已尝试动作、建议下一步，不要求人工翻完整聊天。
4. **Agent 给人工建议，但不越权替人工决定。** 高风险、投诉、赔偿、法律、身份冲突场景下，Agent 只能建议话术/下一步/证据，不自动发送或执行。
5. **多 Agent 对用户只呈现一个稳定人格。** 内部可以多 Agent 协作，外部默认由 Orchestrator 汇总成单一回复；必要时展示“已转专家处理”，避免多个 Agent 抢话。
6. **每次降级都可观测。** 组件降级、渠道能力缺失、人工接管、专家转交、仲裁失败都要进入 trace 和 analytics。

### 总体运行时流程

```text

user_message
  -> channel_adapter.normalize_input
  -> agent_runtime.route / plan / tool / guardrail
  -> output_planner.build_semantic_output
  -> handoff_detector.check
      -> no handoff: render_by_channel -> send
      -> human handoff: create checkpoint -> create handoff payload -> notify user -> enqueue inbox
      -> agent handoff: filter context -> expert agent run -> arbiter merge -> render/send
  -> channel_adapter.delivery_ack
  -> trace / metrics / eval hooks

human_reply_or_approval
  -> resume checkpoint
  -> update session state
  -> notify user or continue agent workflow

```

---

# 17. Handoff 中断/恢复体验

## 17.1 设计目标

- 用户明确知道“为什么转交、当前谁在处理、预计怎么继续”，而不是只看到一句“已转人工”。
- 人工接手时看到可执行摘要：用户目标、已确认身份、关键变量、已调用工具、失败原因、风险点、推荐下一步。
- Runtime 将 handoff 建模为 `interrupt`，保存 checkpoint，支持人工回复、人工审批、专家 Agent 返回后 `resume`。
- 转人工前、中、后都有体验状态：预告、排队、接手、处理、恢复、结束。

## 17.2 运行时流程

```text

1. Handoff 判断
   - 用户显式要求人工
   - 低置信度 / 连续失败 / 工具异常
   - 高风险动作 / 投诉赔偿 / 法律承诺 / 身份冲突
   - 渠道或组件能力不足导致无法完成关键流程

2. 生成 Handoff 决策
   - reason_code
   - target_type: human | expert_agent | reviewer | supervisor
   - priority
   - required_context
   - resume_policy

3. 创建 checkpoint
   - thread_id
   - checkpoint_id
   - current_node
   - session_state
   - pending_action / pending_approval

4. 生成 handoff payload
   - input_filter include/exclude
   - 摘要、事实、证据、风险、建议
   - PII 脱敏和权限过滤

5. 用户端反馈
   - 转交原因
   - 等待状态
   - 可选操作：补充信息、取消、查看进度

6. 人工/专家处理
   - 人工接手或专家 Agent 执行
   - 人工可发送、采纳建议、请求 Agent 草稿、退回 Agent

7. Resume
   - 人工完成 / 审批通过 / 专家 Agent 返回
   - 从 checkpoint 恢复或结束会话

```

## 17.3 关键策略

- **Handoff description**：每个接管目标都必须声明“什么时候转给它”，例如退款争议转售后专家、物流异常转订单专家、辱骂投诉转人工主管。
- **Input filter**：交接只带必要上下文，排除 raw API response、内部错误栈、密钥、无关历史，借鉴 OpenAI Agents SDK 的 handoff input filter。
- **Checkpoint-first**：先保存 checkpoint，再通知用户和人工，避免通知成功但状态丢失。
- **Reason code 标准化**：所有 handoff 进入统计，例如 `USER_REQUEST_HUMAN`、`LOW_CONFIDENCE_TWICE`、`TOOL_TIMEOUT`、`HIGH_RISK_ACTION`、`CHANNEL_LIMITATION`。
- **转交可撤回**：人工未接手前，用户补充信息后可让 Agent 重新尝试；接手后由人工决定是否退回 Agent。
- **Resume 语义明确**：恢复不是重跑整轮，而是从 `pending_node` 继续，保留已确认事实和已执行动作。

## 17.4 可选方案及利弊

### 方案 A：简单转人工消息 + 完整聊天记录

优点：
- 实现最快。
- 人工能看到所有上下文。

缺点：
- 人工阅读成本高。
- PII、内部错误、工具原始字段容易泄露。
- 无法从流程中断点恢复，只能靠人工重新判断。

### 方案 B：结构化 Handoff Payload + Checkpoint Resume

优点：
- 人工接手快，摘要稳定。
- 支持人审、审批、专家 Agent 回来后继续执行。
- 可审计、可 replay、可转 eval。

缺点：
- 需要设计 checkpoint schema、摘要生成、权限过滤。
- 对 runtime 状态机要求更高。

### 方案 C：全量人工协作工作台 + Agent 旁路

优点：
- 适合企业客服生产环境。
- 人工可以直接看到建议、证据、草稿、风险提示。

缺点：
- 产品范围更大，需要 Inbox、权限、质检、反馈闭环。
- P0 开发成本高于纯 runtime。

## 17.5 推荐方案

采用 **方案 B 作为 P0 核心**，同时在 Inbox 中预留方案 C 的交互入口。P0 必须实现结构化 handoff payload、checkpoint、用户端状态反馈、人工接手摘要；P1 再完善人工工作台、Agent 旁路观察和质检反馈。

## 17.6 配置项

```yaml
handoff_policy:
  enabled: true
  default_target: human_general_support
  max_agent_failures_before_handoff: 2
  max_clarification_turns: 2
  user_request_human:
    enabled: true
    priority: high
  low_confidence:
    threshold: 0.55
    consecutive_turns: 2
  high_risk_topics:
    - refund_dispute
    - compensation
    - legal_complaint
    - identity_conflict
  business_hours:
    mode: queue | offline_ticket | agent_continue
  resume_policy:
    after_human_reply: close_or_resume_by_tag
    after_approval: resume_from_checkpoint
    after_timeout: notify_user_and_create_ticket
  handoff_targets:
    - id: human_refund_specialist
      type: human_queue
      description: 用户要求赔偿、退款争议、情绪强烈或订单数据冲突时转交。
      input_filter: refund_handoff_filter
    - id: logistics_expert_agent
      type: expert_agent
      description: 物流节点异常、包裹滞留、物流工具返回不一致时转交。
      input_filter: logistics_expert_filter
```

## 17.7 数据结构 / schema

```json
{
  "handoff_request": {
    "handoff_id": "ho_123",
    "trace_id": "tr_123",
    "thread_id": "th_123",
    "checkpoint_id": "ckpt_456",
    "source_agent_id": "agent_customer_service",
    "target_id": "human_refund_specialist",
    "target_type": "human_queue",
    "reason_code": "HIGH_RISK_REFUND_DISPUTE",
    "priority": "high",
    "status": "pending",
    "created_at": "2026-06-30T12:00:00Z",
    "expires_at": "2026-06-30T12:30:00Z",
    "user_visible_reason": "这个问题涉及售后争议，需要人工同事协助确认。",
    "summary": {
      "user_goal": "希望查询退款进度并要求解释未到账原因",
      "confirmed_facts": {
        "identity_verified": true,
        "selected_order_id": "O***123",
        "refund_id": "R***789"
      },
      "actions_taken": [
        {
          "action": "query_refund_status",
          "status": "success",
          "result_summary": "退款已提交银行处理，预计 1-3 个工作日到账"
        }
      ],
      "failed_actions": [],
      "user_emotion": "angry",
      "risk_notes": ["用户要求赔偿", "不得承诺额外补偿"],
      "recommended_next_steps": [
        "先安抚情绪",
        "解释银行处理时间",
        "如需补偿需主管审批"
      ]
    },
    "context_filter": {
      "included": ["user_goal", "confirmed_facts", "tool_results_summary", "emotion", "risk_notes"],
      "excluded": ["raw_api_response", "secret_headers", "internal_stack"]
    }
  }
}
```

Checkpoint schema：

```json
{
  "checkpoint": {
    "thread_id": "th_123",
    "checkpoint_id": "ckpt_456",
    "node": "refund_status_resolution",
    "state": {
      "topic": "refund_progress",
      "slots": {
        "order_id": "O***123",
        "refund_id": "R***789"
      },
      "pending_action": null,
      "pending_handoff_id": "ho_123",
      "messages_after_checkpoint": [],
      "resume_allowed": true
    },
    "version_refs": {
      "agent_version": "v12",
      "workflow_version": "v4",
      "channel_config_version": "v3"
    }
  }
}
```

## 17.8 用户体验表现

### 转人工前

- Agent 不应突然消失，应先给出可理解原因：
  - “这个问题涉及退款争议，我会帮你转给售后同事继续处理。”
  - 如果可继续收集信息，给用户一个补充入口：“你也可以先补充订单号或截图，我会一起带给人工。”
- 如果转交是因为 Agent 失败，应避免暴露内部错误：
  - 不说“工具超时/模型失败”，而说“当前系统暂时无法确认订单状态，我会转人工继续跟进。”

### 转人工中

- Web/App：展示排队状态卡，包括队列、预计等待、已带给人工的信息摘要、可取消/补充信息。
- 微信/企微/电商 IM：用短文本 + 快捷按钮或关键词引导；不支持按钮时提示“回复 1 补充信息，回复 2 取消排队”。
- 邮件：自动生成工单号和摘要，说明预计响应时间。
- 语音：播报“正在为你转接人工”，并把摘要推送给坐席屏。

### 人工接手后

- 用户看到明确身份切换：
  - “售后同事小李已接手，会继续基于刚才的信息处理。”
- 不重复询问已确认信息，除非身份或关键槽位过期。
- 人工发送消息时，Agent 旁路记录，但不在用户端抢话。

### 恢复 Agent

- 人工可点击“交回 Agent 继续处理”。
- 用户端展示：
  - “我会继续帮你处理后续查询。”
- Runtime 从 checkpoint 恢复，避免重新问订单号、手机号等已确认信息。

## 17.9 异常分支

- **人工队列满**：创建工单，告知用户预计回复时间；Agent 可继续回答低风险 FAQ，但不得执行争议处理。
- **人工超时未接手**：升级队列或转离线工单；trace 标记 `HANDOFF_TIMEOUT`。
- **Handoff payload 生成失败**：退化为安全摘要模板，只包含用户最后问题、topic、reason_code、trace_id。
- **Checkpoint 保存失败**：不得进入“已转人工”状态，改为提示稍后重试或创建工单。
- **人工退回 Agent 但状态过期**：重新校验身份和关键业务对象，再 resume。
- **用户在排队中改变意图**：新意图可由 Agent 处理，但原 handoff 保留，人工接手时看到“用户排队期间追加的问题”。
- **用户取消排队**：关闭 pending handoff；如有未完成高风险动作，保持 cancelled，不自动执行。

## 17.10 评测 / 验收标准

- 每次 handoff 都有 `reason_code`、`checkpoint_id`、`target_id`、`status`。
- 95% 的 handoff 摘要生成耗时低于 2 秒。
- 人工接手后，已确认关键槽位重复询问率低于 5%。
- 高风险 handoff 不泄露 raw API、内部错误栈、密钥字段，安全测试 100% 通过。
- Handoff timeout、人工拒接、用户取消、恢复成功都进入 trace。
- 从 checkpoint resume 的回归用例中，业务状态一致率达到 99%。
- 人工可对摘要标记“有用/无用/有误”，该反馈进入优化队列。

## 17.11 借鉴项目具体机制

- **OpenAI Agents SDK**：`handoff_description` 定义何时转交，`handoff input filter` 控制上下文裁剪，Agent/Run hooks 记录 `on_handoff`。
- **LangGraph**：checkpoint、interrupt、resume、replay，把人审 pending 作为可恢复状态，而不是一次会话结束。
- **Dify / Coze 产品形态**：客服场景中的人工接管、会话队列和运营配置可作为 Inbox 的产品化参考。
- **OpenHands / AutoGen event model**：以事件流记录用户消息、Agent 动作、人工动作和恢复动作，便于调试和审计。

## 17.12 UAgent 落地优先级

- P0：reason code、handoff payload、checkpoint、用户端转人工状态、人工接手摘要。
- P1：人工工作台中的 Agent 草稿建议、退回 Agent resume、摘要反馈闭环。
- P2：跨团队排班、主管升级、自动质检、复杂多角色协作。

---

# 18. Human-Agent 协作策略

## 18.1 设计目标

- 人工客服不是被 Agent 替代，而是获得“上下文、证据、建议、草稿、风险提醒”。
- Agent 在人工接手后进入旁路模式：观察、总结、建议，不主动对用户发言，除非人工明确授权。
- 人工纠错可以回流到 Skill、Knowledge、Eval、Guardrail，而不是只留在聊天记录里。
- 人工端操作要足够轻：一键采纳话术、一键查看证据、一键生成工单、一键标记 Agent 错误原因。

## 18.2 运行时流程

```text

handoff_created
  -> inbox_ticket_created
  -> human_agent_workspace_loads
      -> summary panel
      -> evidence panel
      -> suggested reply / next action
      -> risk guardrails
  -> human chooses:
      -> send own reply
      -> edit and send agent draft
      -> ask agent to draft
      -> approve/reject pending action
      -> return to agent
      -> close/escalate
  -> feedback captured
      -> correction label
      -> knowledge gap
      -> bad tool result
      -> bad routing
      -> bad tone
  -> ops loop
      -> eval case / skill patch / knowledge task / guardrail task

```

## 18.3 关键策略

- **旁路观察模式**：人工接管后，Agent 继续读取新消息和人工回复，但默认不发给用户。
- **建议分级**：
  - L0：摘要与事实提取。
  - L1：推荐回复草稿。
  - L2：推荐下一步动作。
  - L3：高风险动作建议，需要人工审批。
- **证据绑定**：每条建议必须能展开来源：用户原话、知识引用、工具结果、政策条款。
- **人工优先权**：人工编辑、覆盖、拒绝 Agent 建议时，最终以人工为准，并记录差异。
- **纠错轻量化**：人工不需要写长反馈，至少可打标签：知识缺失、工具错、路由错、语气差、政策风险、摘要错误。

## 18.4 可选方案及利弊

### 方案 A：Agent 完全退出，人工独立处理

优点：
- 风险低。
- 实现简单。

缺点：
- Agent 前面做过的工作价值低。
- 人工仍需翻记录、查系统。
- 无法形成 Agent 反馈闭环。

### 方案 B：Agent 旁路辅助人工

优点：
- 人工掌控最终输出，风险可控。
- Agent 提供摘要、证据、草稿和下一步建议，提升效率。
- 人工纠错可以结构化回流。

缺点：
- 需要设计人工端 UI 和建议权限。
- 需要防止建议误导人工。

### 方案 C：Agent 与人工共同面向用户发言

优点：
- 自动化程度最高。
- 适合低风险场景的快速恢复。

缺点：
- 用户体验可能混乱。
- 责任边界不清，尤其在投诉/赔偿/法律场景风险高。

## 18.5 推荐方案

采用 **方案 B：旁路辅助人工**。P0 做摘要、建议下一步、草稿、反馈标签；高风险动作只允许“建议 + 审批”。低风险 FAQ 可以允许人工点击“让 Agent 发送”，但必须显示发送主体和审计记录。

## 18.6 配置项

```yaml
human_agent_collaboration:
  mode: sidecar
  agent_suggestions:
    summary: true
    suggested_reply: true
    suggested_next_action: true
    suggested_tool_call: false
  auto_send:
    enabled: false
    allowed_topics:
      - faq_low_risk
    require_human_click: true
  evidence_required:
    for_suggested_reply: true
    for_high_risk_action: true
  correction_tags:
    - routing_error
    - knowledge_gap
    - tool_error
    - summary_wrong
    - tone_bad
    - policy_risk
    - channel_format_bad
  feedback_to_eval:
    create_regression_on_p0: true
    sample_rate: 0.2
```

## 18.7 数据结构 / schema

人工工作台会话对象：

```json
{
  "inbox_item": {
    "ticket_id": "tk_123",
    "handoff_id": "ho_123",
    "thread_id": "th_123",
    "customer": {
      "display_name": "用户123",
      "identity_status": "verified",
      "tags": ["VIP", "refund_risk"]
    },
    "agent_context": {
      "summary": "用户咨询退款未到账，已查到退款处理中。",
      "confirmed_facts": [],
      "open_questions": [],
      "tool_evidence": [],
      "risk_flags": []
    },
    "agent_suggestions": [
      {
        "suggestion_id": "sg_1",
        "type": "reply_draft",
        "confidence": 0.82,
        "content": "我理解你着急，我这边看到退款已提交银行处理...",
        "evidence_refs": ["tool_result_1", "policy_refund_timing"],
        "risk_level": "medium",
        "allowed_actions": ["copy", "edit_send", "reject"]
      }
    ],
    "human_actions": []
  }
}
```

人工反馈 schema：

```json
{
  "human_feedback": {
    "feedback_id": "fb_123",
    "thread_id": "th_123",
    "suggestion_id": "sg_1",
    "actor_id": "support_007",
    "action": "edited_and_sent",
    "correction_tags": ["tone_bad"],
    "before": "原 Agent 草稿",
    "after": "人工编辑后的回复",
    "notes": "语气需要更安抚",
    "create_eval": true
  }
}
```

## 18.8 用户体验表现

### 人工端默认布局

- 左侧：用户聊天记录，按“用户/Agent/人工/系统状态”区分。
- 中间：当前输入框和快捷动作。
- 右侧上半：Agent 接管摘要，包括用户目标、已确认信息、失败原因、风险。
- 右侧下半：Agent 建议，包括回复草稿、下一步动作、证据来源。
- 顶部：SLA、队列、用户标签、channel、trace_id。

### Agent 如何给人工建议

- 建议必须短、可编辑、可解释。
- 每条草稿显示置信度和风险标签，不用复杂模型术语。
- 对高风险内容用明显提示：
  - “涉及赔偿承诺，发送前需主管确认。”
  - “该建议基于退款政策第 3 条和订单查询结果。”
- 人工点击“为什么这样建议”可展开证据。

### 用户端感知

- 用户只看到一个清晰服务主体，不看到内部建议流。
- 如果人工使用 Agent 草稿，用户端仍显示人工身份或企业客服身份，不显示“AI 建议生成”除非合规要求。

## 18.9 异常分支

- **Agent 建议生成失败**：人工端仍展示摘要和原始证据；建议区显示“暂无法生成建议”，不影响人工处理。
- **建议与政策冲突**：Guardrail 阻断建议显示，改为风险提示。
- **人工误发高风险内容**：输出前人工端也走 policy check，提示拦截或二次确认。
- **人工编辑导致事实错误**：系统可提示“该内容与工具结果不一致”，但最终由有权限人工确认。
- **多个客服同时打开同一会话**：锁定主处理人，其他人只读或协作备注。
- **Agent 旁路总结过期**：当新消息超过 N 条或关键事实变化时自动刷新摘要。

## 18.10 评测 / 验收标准

- 人工接手首屏能在 3 秒内加载摘要和关键证据。
- 80% 以上 handoff 会话具备 Agent 建议下一步。
- 人工采纳或编辑建议的操作都记录反馈。
- P0 高风险建议 100% 带 evidence_refs 和 risk_level。
- 人工对摘要“有用”反馈率达到 70% 以上作为 P1 优化目标。
- 人工发送前 policy check 覆盖赔偿、法律、隐私、越权四类风险。

## 18.11 借鉴项目具体机制

- **Anthropic eval viewer**：人类评审界面可对候选输出打分、写反馈，UAgent 可借鉴为人工建议的采纳/拒绝/编辑反馈。
- **OpenAI Tool Approval**：高风险动作作为 approval item，由人工审批后 resume。
- **OpenHands event store**：把人工动作、Agent 建议、用户消息都作为 event，支持后续 replay 和审计。
- **客服 SaaS Inbox 形态**：借鉴队列、SLA、坐席锁定、快捷回复、内部备注等成熟客服工作台机制。

## 18.12 UAgent 落地优先级

- P0：接管摘要、建议草稿、证据引用、反馈标签、人工发送前安全检查。
- P1：旁路自动总结刷新、建议质量评分、采纳率分析、从人工纠错一键生成 eval。
- P2：多人工协同、主管审批流、坐席个性化建议、实时质检。

---

# 25. Output Rendering / UI Component 策略

## 25.1 设计目标

- 统一 Agent 输出契约，避免每个 Skill 手写渠道格式。
- 支持文本、卡片、按钮、表格、表单、进度条、引用、商品/订单卡、审批卡等组件。
- 组件在渠道不支持时可预测降级，不丢关键语义。
- 输出结果先通过 schema 校验和 output guardrail，再进入渠道渲染。

## 25.2 运行时流程

```text

model / formatter output
  -> strict schema parse
  -> semantic output envelope
  -> output guardrail
  -> component capability negotiation
  -> channel renderer
      -> native component
      -> markdown/text fallback
      -> attachment/link fallback
      -> handoff if essential interaction unsupported
  -> delivery
  -> delivery ack / format error trace

```

## 25.3 关键策略

- **语义组件优先**：Runtime 输出 `order_card`、`choice_group`、`approval_card`，而不是“微信文本”或“Web HTML”。
- **组件声明重要性**：每个组件有 `importance: essential | helpful | decorative`。关键交互无法降级时触发澄清或 handoff。
- **降级链**：Native card -> Markdown/富文本 -> 纯文本列表 -> 短链接/附件 -> 人工/工单。
- **输出 schema 强约束**：借鉴 OpenAI Agents SDK strict JSON schema，关键组件必须结构化。
- **可访问性**：按钮有 label，图片有 alt，表格有文本替代，进度有状态文案。
- **流式与组件分离**：流式先发“正在查询/生成”，最终组件作为完整消息发送；不在未完成 schema 时渲染半张卡片。

## 25.4 可选方案及利弊

### 方案 A：让模型直接输出每个渠道格式

优点：
- 初期实现简单。
- Prompt 可快速适配单渠道。

缺点：
- 多渠道维护成本高。
- 格式错误难测。
- 模型容易输出不支持的组件。

### 方案 B：统一 UI Component schema + 渠道渲染器

优点：
- 组件可复用、可测试、可降级。
- 渠道差异集中在 adapter。
- 输出格式可做 eval 和 guardrail。

缺点：
- 需要设计组件协议和 renderer。
- 需要组件版本兼容。

### 方案 C：只输出文本，所有复杂交互转链接

优点：
- 最稳定，渠道兼容性好。
- 开发成本低。

缺点：
- Web/App 体验浪费。
- 用户操作效率低。
- 不利于订单、商品、审批等复杂场景。

## 25.5 推荐方案

采用 **方案 B**。P0 组件集控制在客服高频组件：文本、按钮组、订单卡、表格、表单、引用、进度、人工接管状态、审批卡。每个组件必须有 text fallback。P1 扩展商品卡、优惠券、文件、图文混排、多步骤表单。

## 25.6 配置项

```yaml
output_rendering:
  schema_mode: strict
  default_locale: zh-CN
  component_version: "2026-06"
  allow_streaming_text: true
  stream_component_partial: false
  fallback_order:
    - native
    - markdown
    - plain_text
    - link
    - handoff
  max_components_per_message: 5
  max_buttons_per_group: 6
  essential_component_failure: ask_or_handoff
  references:
    require_citation_for_knowledge_answer: true
  accessibility:
    require_alt_text: true
    require_button_label: true
```

## 25.7 数据结构 / schema

统一输出包：

```json
{
  "output_envelope": {
    "message_id": "msg_123",
    "trace_id": "tr_123",
    "thread_id": "th_123",
    "intent": "order_logistics",
    "tone": "warm_professional",
    "streaming": {
      "mode": "text_then_final_components",
      "prelude": "我先帮你查一下订单状态。"
    },
    "components": [
      {
        "id": "c1",
        "type": "text",
        "importance": "essential",
        "props": {
          "text": "我查到你的订单已发货，当前在运输中。"
        }
      },
      {
        "id": "c2",
        "type": "order_card",
        "importance": "helpful",
        "props": {
          "order_id_masked": "O***123",
          "status": "shipped",
          "eta": "2026-07-02",
          "items_summary": "共 2 件商品",
          "actions": [
            {
              "id": "view_logistics",
              "label": "查看物流",
              "action_type": "postback",
              "payload": {
                "action": "query_logistics",
                "order_id": "O***123"
              }
            }
          ]
        },
        "fallback": {
          "plain_text": "订单 O***123：已发货，预计 2026-07-02 送达。回复“物流”查看详情。"
        }
      }
    ],
    "metadata": {
      "requires_user_action": false,
      "contains_pii": true,
      "pii_masked": true
    }
  }
}
```

组件基础 schema：

```json
{
  "ui_component": {
    "id": "string",
    "type": "text | choice_group | card | table | form | progress | reference | approval_card | handoff_status | order_card | product_card",
    "version": "string",
    "importance": "essential | helpful | decorative",
    "props": {},
    "fallback": {
      "markdown": "string",
      "plain_text": "string",
      "link_url": "string"
    },
    "accessibility": {
      "label": "string",
      "alt_text": "string"
    },
    "constraints": {
      "max_width": "string",
      "expires_at": "datetime",
      "requires_auth": true
    }
  }
}
```

## 25.8 用户体验表现

- Web/App：优先展示原生组件，订单卡、进度条、按钮组、表单可交互；用户操作产生 postback，不要求用户复制订单号。
- 微信/企微：优先图文/小程序/模板消息能力；不支持时用短文本列表 + 编号回复。
- 飞书/钉钉：优先交互卡片；按钮回调带 trace_id 和 component_id。
- 邮件：用 HTML 表格和链接；不依赖即时按钮回调。
- 语音：把卡片转成可播报摘要，复杂选择通过“请说第一个/第二个”完成。
- API：返回完整 `output_envelope`，由调用方自行渲染。

## 25.9 异常分支

- **组件 schema 校验失败**：自动修复一次；仍失败则退化为文本；记录 `OUTPUT_SCHEMA_ERROR`。
- **渠道不支持按钮**：转为编号回复；如果 action 高风险，则生成确认文本或转人工。
- **表格过宽/字段过多**：显示 Top N 摘要，提供“查看更多”链接或附件。
- **表单不支持**：逐题澄清，保存 interrupt 状态。
- **引用缺失**：知识问答改为保守回答，提示“当前没有可确认来源”，必要时转人工。
- **组件过期**：用户点击后提示“该操作已过期，我重新为你查询最新状态。”
- **渲染器失败**：使用 plain_text fallback，trace 记录 channel renderer 错误。

## 25.10 评测 / 验收标准

- 核心组件 schema 校验通过率 >= 99%。
- 所有 production 组件必须具备 plain_text fallback。
- 渠道能力缺失时，组件降级路径可在 simulator 中覆盖。
- 格式 eval 覆盖文本、按钮、卡片、表单、引用、审批卡。
- 关键业务组件降级后不得丢失核心字段，例如订单状态、金额、日期、确认动作。
- Web/App 端组件交互必须带 `trace_id`、`component_id`、`action_id`。

## 25.11 借鉴项目具体机制

- **OpenAI Agents SDK strict_json_schema**：用于最终输出、路由和卡片组件约束。
- **MCP tool annotations**：借鉴行为注解思路，为组件声明 readOnly/interactive/destructive 等交互风险属性。
- **Dify/Coze 工作流输出节点**：借鉴文本、变量、卡片输出配置，但 UAgent 需要更强的多渠道降级契约。
- **飞书/钉钉交互卡片**：借鉴卡片 JSON + 回调机制，但不绑定单一渠道。

## 25.12 UAgent 落地优先级

- P0：OutputEnvelope、Text、ChoiceGroup、OrderCard、Table、Form、Reference、HandoffStatus、ApprovalCard、plain_text fallback。
- P1：ProductCard、CouponCard、Attachment、RichMedia、多步骤表单、组件 analytics。
- P2：个性化组件模板、A/B 组件渲染、跨渠道视觉一致性设计系统。

---

# 26. Channel Adapter 策略

## 26.1 设计目标

- 让同一个 Agent 可以发布到多个渠道，同时遵守每个渠道的身份、消息格式、流式、按钮、卡片、人工入口、长度限制。
- 渠道差异不能污染 Skill 和业务逻辑，应集中在 Channel Adapter。
- 渠道能力不足时，自动降级或改变流程，例如从按钮选择降级为编号回复，从流式降级为 typing + 最终消息。
- 渠道级策略可覆盖 Agent 默认策略，例如微信不支持复杂表单时改用逐题问答。

## 26.2 运行时流程

```text

inbound channel event
  -> verify signature / auth
  -> normalize user identity
  -> normalize message parts
  -> attach channel capabilities
  -> agent runtime
  -> output envelope
  -> negotiate capabilities
  -> render and send
  -> delivery callback / retry
  -> trace channel events

```

## 26.3 关键策略

- **能力矩阵**：每个渠道声明是否支持 stream、typing、card、button、form、file、voice、postback、human_transfer。
- **身份映射**：同一用户在 Web/App/微信/企微可能有不同 external_id，需要统一到 UAgent identity graph，并记录置信度。
- **流式策略**：
  - 支持流式：输出 token/段落 + 工具等待状态。
  - 不支持流式：发送 typing/处理中提示，最终一次性发送。
  - 消息条数受限：合并为摘要，避免刷屏。
- **交互降级**：按钮 -> 编号回复 -> 短链接 -> 人工。
- **渠道级 guardrail**：电商 IM、微信、邮件对敏感词、链接、营销话术可能有不同限制。
- **适配器可模拟**：Simulator 必须能模拟不支持流式、不支持按钮、消息长度限制、回调失败。

## 26.4 可选方案及利弊

### 方案 A：每个渠道独立写 Agent 配置

优点：
- 单渠道体验可以快速定制。
- 对接外部渠道初期简单。

缺点：
- Agent 逻辑复制，维护成本高。
- 多渠道表现不一致。
- eval 难复用。

### 方案 B：统一 Agent Runtime + Channel Adapter 能力协商

优点：
- 业务逻辑复用，渠道差异集中。
- 易做降级、测试、观测。
- 支持同一会话跨渠道恢复。

缺点：
- 需要前期抽象 channel capabilities。
- 复杂渠道要写 adapter。

### 方案 C：统一只走 API，由客户自行适配渠道

优点：
- 平台开发成本低。
- 适合技术客户。

缺点：
- 产品体验不可控。
- 无法沉淀渠道最佳实践。
- 中小客户接入成本高。

## 26.5 推荐方案

采用 **方案 B**。P0 支持 Web/App/API/微信客服/企微/电商 IM 的能力矩阵、输出降级和人工入口；P1 扩展飞书/钉钉/邮件/语音。所有渠道都必须走统一 trace 和 OutputEnvelope。

## 26.6 配置项

```yaml
channels:
  - channel_id: web_widget
    type: web
    enabled: true
    capabilities:
      streaming: true
      typing_indicator: true
      rich_card: true
      buttons: true
      forms: true
      file_upload: true
      human_transfer: true
    limits:
      max_message_chars: 8000
      max_buttons: 8
    handoff:
      target_queue: web_general_support
  - channel_id: wechat_service
    type: wechat
    enabled: true
    capabilities:
      streaming: false
      typing_indicator: false
      rich_card: limited
      buttons: limited
      forms: false
      file_upload: true
      human_transfer: true
    limits:
      max_message_chars: 2000
      max_buttons: 3
    fallback:
      button: numbered_reply
      form: sequential_questions
      table: compact_text
  - channel_id: ecommerce_im
    type: ecommerce_im
    enabled: true
    capabilities:
      streaming: false
      typing_indicator: true
      rich_card: limited
      buttons: true
      forms: false
      human_transfer: true
    policies:
      sensitive_word_check: true
      marketing_claim_strict: true
```

## 26.7 数据结构 / schema

渠道能力 schema：

```json
{
  "channel_capabilities": {
    "channel_id": "wechat_service",
    "type": "wechat",
    "supports": {
      "streaming": false,
      "typing_indicator": false,
      "markdown": true,
      "rich_card": "limited",
      "buttons": "limited",
      "forms": false,
      "files": true,
      "postback": true,
      "human_transfer": true
    },
    "limits": {
      "max_message_chars": 2000,
      "max_messages_per_minute": 20,
      "max_buttons": 3,
      "max_card_fields": 6
    },
    "fallback_policy": {
      "streaming": "typing_or_wait_message",
      "button": "numbered_reply",
      "form": "sequential_questions",
      "card": "plain_text_summary"
    }
  }
}
```

标准化输入事件：

```json
{
  "normalized_channel_event": {
    "event_id": "evt_123",
    "channel_id": "wechat_service",
    "external_user_id": "openid_xxx",
    "uagent_user_id": "user_123",
    "identity_confidence": 0.92,
    "message": {
      "type": "text | image | file | voice | postback",
      "text": "帮我查物流",
      "attachments": [],
      "postback": null
    },
    "channel_context": {
      "locale": "zh-CN",
      "entry": "customer_service",
      "supports": {}
    }
  }
}
```

渲染结果 schema：

```json
{
  "render_result": {
    "message_id": "msg_123",
    "channel_id": "wechat_service",
    "render_mode": "plain_text_fallback",
    "degraded": true,
    "degradation_reasons": ["BUTTON_LIMIT_EXCEEDED", "FORM_UNSUPPORTED"],
    "sent_parts": [
      {
        "type": "text",
        "content": "请选择订单：1. O***123  2. O***456。回复数字即可。"
      }
    ],
    "delivery_status": "sent"
  }
}
```

## 26.8 用户体验表现

### 不支持流式时

- 不模拟假流式，不连续发送碎片。
- 发送一条“正在查询，请稍等”的等待消息或 typing 状态；最终一次性发送完整答案。
- 如果工具调用超过阈值，发送阶段性进度：
  - “还在查询物流系统，稍后给你结果。”

### 不支持卡片时

- 订单卡降级为：
  - “订单 O***123：已发货；预计 7 月 2 日送达；回复‘物流’查看详情。”
- 商品卡降级为短列表：
  - “1. 商品 A，¥99，库存充足；2. 商品 B，¥129，库存紧张。”

### 不支持按钮时

- 按钮组降级为编号回复：
  - “请选择：1 查询物流 2 申请售后 3 转人工。”
- 用户回复数字后映射到 component action。

### 不支持表单时

- 多字段表单降级为逐题提问，每一题都是 interrupt/resume 节点。
- 已收集字段显示在摘要中，避免用户重复填写。

### 邮件渠道

- 不做实时多轮假设。
- 输出结构化邮件：问题摘要、处理结果、下一步、工单号、回复入口。

### 语音渠道

- 所有视觉组件转播报摘要。
- 选择题最多 3 个选项，超过则先聚类或转短信/链接。

## 26.9 异常分支

- **渠道发送失败**：按渠道重试策略；失败后创建待发送任务或通知人工。
- **postback 回调丢失**：按钮过期或无法匹配时，提示用户重新选择，保留原 component_id。
- **身份置信度低**：限制 L1+ 个人数据查询，引导登录或转人工。
- **渠道限流**：合并消息，降低进度通知频率，必要时延迟发送。
- **渠道敏感词拦截**：改写话术后重发一次；再次失败转人工并记录 channel_policy_block。
- **跨渠道恢复冲突**：用户在 App 和微信同时操作同一流程时，以最近确认动作和权限更高渠道为准，另一个渠道提示状态已更新。

## 26.10 评测 / 验收标准

- 每个上线渠道必须有 capabilities 配置和 simulator 用例。
- 渠道降级 eval 覆盖：不支持流式、不支持按钮、不支持卡片、不支持表单、长度超限、发送失败。
- 关键交互在降级后仍可完成，P0 场景完成率 >= 95%。
- 所有 channel send / callback / failure 都写入 trace。
- 渠道级转人工 reason code 可统计。
- 跨渠道身份映射错误不得导致越权查询，安全测试 100% 通过。

## 26.11 借鉴项目具体机制

- **UAgent 创建向导渠道选择**：渠道选择影响输出格式、按钮能力、身份获取、人工入口。
- **OpenAI Agents hooks**：在 channel normalize、render、delivery ack 节点插入 trace hooks。
- **LangGraph interrupt/resume**：表单降级为逐题问答时，每一题都是可恢复中断。
- **企业 IM 交互卡片机制**：借鉴飞书/钉钉 postback，但统一抽象为 UAgent component action。

## 26.12 UAgent 落地优先级

- P0：Web/App/API/微信/企微/电商 IM adapter、capabilities、降级策略、trace。
- P1：飞书/钉钉/邮件/语音、跨渠道 identity graph、渠道 simulator。
- P2：渠道 A/B、渠道特定话术优化、全渠道会话迁移。

---

# 38. Multi-agent 协作策略

## 38.1 设计目标

- 允许复杂任务由主 Agent、专家 Agent、工具 Agent、评审 Agent 协作，但用户端仍体验为一个稳定服务。
- 明确谁能说话、谁能调用工具、谁能写记忆、谁能触发 handoff。
- 多 Agent 结果冲突时有仲裁机制，不把内部争论暴露给用户。
- 多 Agent trace 可审计，平台能解释“为什么找了这个专家、谁的建议被采纳”。

## 38.2 运行时流程

```text

orchestrator receives task
  -> decide if subagent needed
      -> no: handle directly
      -> yes: create subtask with context filter
  -> subagent runs with scoped permissions
  -> subagent returns structured result
  -> arbiter evaluates:
      -> accept
      -> merge
      -> ask clarification
      -> send to reviewer/human
      -> fallback to orchestrator
  -> final response composed by orchestrator
  -> render by channel
  -> multi-agent trace recorded

```

## 38.3 关键策略

- **Orchestrator 单出口**：默认只有主 Agent 面向用户发言，专家 Agent 返回结构化建议。
- **Context filter**：专家 Agent 只拿与任务相关的上下文，避免过多历史和敏感信息泄露。
- **权限隔离**：专家 Agent 的 tool scope、memory scope、handoff scope 独立配置。
- **结构化返回**：专家 Agent 必须返回 `answer / confidence / evidence / risks / required_action`。
- **仲裁优先级**：
  1. 安全/合规评审优先于业务建议。
  2. 工具证据优先于模型推测。
  3. 高置信专家结论优先于低置信主 Agent。
  4. 冲突无法解决时澄清或转人工。
- **用户可见策略**：只有当用户体验需要时才说“我会请售后专家确认”，否则内部协作不打扰用户。

## 38.4 可选方案及利弊

### 方案 A：单 Agent 全部处理

优点：
- 简单、成本低、延迟低。
- 用户体验稳定。

缺点：
- 复杂任务上下文和工具过多，容易错路由。
- 不利于专业领域隔离和权限控制。

### 方案 B：Orchestrator + 专家 Agent

优点：
- 专家能力清晰，权限可隔离。
- 主 Agent 保持统一用户体验。
- 可按业务线扩展专家 Agent。

缺点：
- 需要任务拆分、上下文过滤、仲裁。
- 延迟和成本增加。

### 方案 C：多 Agent 群聊式协作

优点：
- 适合复杂推理和方案评审。
- 可产生多角度意见。

缺点：
- 成本高、不可控。
- 用户端不适合直接展示。
- 仲裁和责任边界复杂。

## 38.5 推荐方案

采用 **方案 B：Orchestrator + 专家 Agent + Arbiter**。P0 不做开放式群聊，只做明确的专家转交：物流专家、退款专家、合规评审、输出格式器。P1 增加 reviewer agent 和多候选比较。P2 再考虑复杂群组协作。

## 38.6 配置项

```yaml
multi_agent:
  enabled: true
  user_visible_mode: single_voice
  orchestrator: customer_service_agent
  max_subagents_per_turn: 3
  max_parallel_subagents: 2
  subagent_timeout_seconds: 20
  arbitration:
    mode: rule_then_model
    conflict_policy: clarify_or_handoff
    require_evidence_for_high_risk: true
  agents:
    - id: refund_expert_agent
      role: expert
      description: 处理退款进度、退款规则、退款异常和退款争议。
      enabled_when:
        - topic in [refund_progress, refund_dispute]
      tool_scope:
        - query_refund
        - query_order
      memory_scope: session_only
      can_send_to_user: false
      can_handoff_to_human: true
    - id: compliance_reviewer_agent
      role: reviewer
      description: 检查赔偿、法律、隐私、承诺类风险。
      enabled_when:
        - risk_level in [high, critical]
      tool_scope: []
      memory_scope: none
      can_send_to_user: false
      can_block_output: true
```

## 38.7 数据结构 / schema

子任务 schema：

```json
{
  "agent_subtask": {
    "subtask_id": "st_123",
    "parent_trace_id": "tr_123",
    "orchestrator_agent_id": "customer_service_agent",
    "target_agent_id": "refund_expert_agent",
    "task_type": "expert_assessment",
    "input": {
      "user_goal": "查询退款未到账原因",
      "confirmed_facts": {},
      "tool_results_summary": [],
      "question": "请判断是否需要人工介入，并给出可回复用户的事实依据。"
    },
    "context_filter": {
      "include": ["user_goal", "selected_order", "refund_tool_summary", "policy_refs"],
      "exclude": ["raw_history", "internal_errors", "secret_headers"]
    },
    "permissions": {
      "tools": ["query_refund"],
      "memory": "session_read",
      "send_to_user": false
    }
  }
}
```

专家 Agent 返回 schema：

```json
{
  "subagent_result": {
    "subtask_id": "st_123",
    "agent_id": "refund_expert_agent",
    "status": "success",
    "confidence": 0.86,
    "answer_summary": "退款已进入银行处理阶段，未超出承诺时效。",
    "evidence": [
      {
        "type": "tool_result",
        "ref_id": "tool_refund_1",
        "summary": "退款状态为 bank_processing"
      },
      {
        "type": "policy",
        "ref_id": "refund_policy_3",
        "summary": "银行处理通常 1-3 个工作日"
      }
    ],
    "risks": ["用户情绪激动，不建议承诺赔偿"],
    "recommended_action": "answer_with_empathy",
    "needs_handoff": false
  }
}
```

仲裁结果 schema：

```json
{
  "arbitration_result": {
    "trace_id": "tr_123",
    "mode": "rule_then_model",
    "inputs": ["main_agent_draft", "refund_expert_result", "compliance_review"],
    "decision": "merge_and_send",
    "selected_facts": [],
    "blocked_claims": ["额外赔偿承诺"],
    "final_instruction": "用安抚语气解释退款时效，不承诺赔偿。",
    "confidence": 0.9,
    "user_visible_disclosure": "none"
  }
}
```

## 38.8 用户体验表现

- 默认不暴露内部多 Agent 名称，用户看到统一客服身份。
- 当等待专家会增加明显延迟时，提示：
  - “我需要进一步确认售后规则，马上回来。”
- 当专家 Agent 处理的是用户可理解的专业领域，可以轻量展示：
  - “我已帮你转给售后规则专家确认。”
- 多 Agent 不能交替对用户发消息；最终由主 Agent 或人工统一输出。
- Trace/后台可展示内部协作：
  - 主 Agent 触发退款专家。
  - 退款专家调用了哪些工具。
  - 合规评审阻断了哪些表述。
  - 仲裁器采纳了哪些事实。

## 38.9 异常分支

- **专家 Agent 超时**：主 Agent 使用已有证据保守回答，或转人工；trace 标记 `SUBAGENT_TIMEOUT`。
- **专家 Agent 结果冲突**：优先工具证据和合规评审；无法解决则澄清或人工。
- **专家 Agent schema 失败**：重试一次；仍失败则丢弃该结果并记录。
- **专家 Agent 越权请求工具**：权限引擎阻断，不进入模型可用工具；记录 `SUBAGENT_PERMISSION_DENIED`。
- **多个子 Agent 都建议 handoff**：按最高风险 reason_code 创建单一 handoff，避免多个工单。
- **子 Agent 成本超限**：停止后续专家调用，降级为主 Agent + 人工。
- **用户中途补充信息**：取消或更新未完成子任务，避免基于旧信息回复。

## 38.10 评测 / 验收标准

- 多 Agent 场景用户端只收到一个最终回复或一个明确 handoff 状态。
- 每个 subtask 都有 context_filter、permissions、result schema。
- 高风险场景中 compliance reviewer 的阻断命中进入 trace。
- 专家 Agent 超时不导致整轮无限等待，必须在 SLA 内降级。
- 仲裁结果可解释：采纳/丢弃/阻断的事实都有来源。
- 多 Agent 评测覆盖：专家成功、专家超时、专家冲突、权限阻断、合规阻断、人工升级。

## 38.11 借鉴项目具体机制

- **OpenAI Agents SDK handoff**：专家 Agent 转交可复用 handoff description 和 input filter。
- **AutoGen**：多 Agent 协作和群组讨论的思路可借鉴，但 UAgent P0 应收敛为 Orchestrator 单出口。
- **LangGraph**：将专家调用作为 graph node，支持 checkpoint、interrupt、resume、replay。
- **AgentScope permission engine**：借鉴权限引擎，为每个 Agent 定义工具、记忆、输出权限。
- **OpenAI tracing / OpenHands event store**：记录 subagent_start、subagent_end、arbitration_decision 等事件。

## 38.12 UAgent 落地优先级

- P0：Orchestrator、专家 Agent 调用、context filter、权限隔离、结构化返回、仲裁 trace。
- P1：合规 reviewer、并行专家调用、冲突仲裁 UI、从 trace 生成多 Agent eval。
- P2：复杂群组协作、多 Agent 策略市场、自动专家选择优化。

---

## 6. 跨主题统一事件与指标

### 6.1 Trace 事件

```text
output_envelope_created
output_schema_validated
component_rendered
component_degraded
channel_message_sent
channel_delivery_failed
handoff_decision_created
handoff_checkpoint_saved
handoff_payload_created
handoff_user_notified
human_agent_assigned
human_suggestion_generated
human_feedback_captured
subagent_started
subagent_finished
arbitration_started
arbitration_finished
resume_from_checkpoint
```

### 6.2 核心指标

- Handoff rate by reason/channel/topic。
- Handoff summary generation latency。
- Human first response time。
- Agent suggestion adoption/edit/reject rate。
- Component schema error rate。
- Component degradation rate by channel。
- Channel delivery failure rate。
- Subagent timeout/conflict rate。
- Arbitration accept/merge/block/handoff rate。
- Resume success rate。

---

## 7. UAgent 分阶段落地路线

### P0：可上线闭环

- Handoff reason code、checkpoint、payload、人工摘要。
- OutputEnvelope + 核心组件 + plain_text fallback。
- Channel capabilities + Web/App/API/微信/企微/电商 IM 降级。
- 人工端 Agent 摘要和建议草稿。
- Orchestrator + 少量专家 Agent + rule-based arbitration。
- 全链路 trace 和基础 eval。

### P1：企业可运营

- 人工 Inbox 完整工作台、旁路刷新、纠错回流 eval。
- 渠道 simulator、飞书/钉钉/邮件/语音。
- 组件 analytics、格式 A/B、跨渠道身份恢复。
- Compliance reviewer、并行专家、仲裁可视化。

### P2：平台壁垒

- 多 Agent 策略市场、动态专家选择。
- 高级人机共驾、实时质检、主管审批工作流。
- 全渠道视觉/交互设计系统。
- 从 handoff/人工纠错自动生成 Skill/Knowledge/Guardrail patch。

---

## 8. 总结推荐

子任务 D 的核心设计建议是：**用 checkpoint/handoff payload 管住中断恢复，用 OutputEnvelope 管住输出，用 Channel Adapter 管住渠道差异，用 sidecar 模式管住人工协作，用 Orchestrator + Arbiter 管住多 Agent。**

这样 UAgent 不会退化成“模型随便说、渠道随便发、人工自己翻记录、多 Agent 互相抢话”的系统，而是形成一套可配置、可评测、可审计、可恢复的 Agent Runtime 用户体验层。


---

# 附录 E：E_observability_eval_release_agentops.md

# 子任务 E：反馈学习、Trace、指标、线上评测、沙箱、版本、发布与 AgentOps 详细设计

> 输出文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\runtime_subagent_reports\E_observability_eval_release_agentops.md`  
> 覆盖维度：28 Feedback Learning、30 Trace 事件定义、31 Observability Metrics、32 Evaluation-in-Production、33 Simulator/Sandbox、35 Agent Version Compatibility、39 Release/Canary/Rollback Runtime、40 AgentOps。

## 0. 总建议

这 8 个维度应统一设计成一个 **trace-first、evidence-linked、version-pinned、policy-gated、ops-auto-ticketed** 的运行时闭环：

```text
Trace -> Metrics -> Online Eval -> Release Gate -> Feedback/Ops Task -> Regression -> Next Release
```

---

# 28. Feedback Learning 策略

## 设计目标

把用户反馈、人工纠错、质检结论、投诉、未解决会话转成可追踪、可分发、可回归的优化输入。

## 运行时流程

```text
feedback signal
  -> bind trace/session/version
  -> classify issue
  -> dedupe and severity score
  -> route to knowledge/skill/tool/policy/eval/release
  -> create ops task or candidate patch
  -> verify by regression
```

## 信号来源

- 用户点赞/点踩/文字反馈。
- 人工客服修改 Agent 草稿。
- 人工接管原因。
- QA 质检。
- 投诉/差评。
- 用户重复追问/弃聊。
- 工具失败/超时。
- 线上 eval 失败。

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 自动写回知识/Prompt | 快 | 噪声和风险大 |
| 纯人工审核 | 稳 | 慢、吞吐低 |
| 分级门控混合 | 平衡速度和质量 | 需要阈值与 Owner |

## 推荐方案

分级门控：高风险只进 review；高频低风险生成草稿；P0/P1 事故自动生成回归用例和待办。

## schema

```json
{
  "feedback_id":"fb_1",
  "trace_id":"tr_1",
  "session_id":"s_1",
  "agent_version":"1.4.2",
  "source":"thumbs_down|qa_review|complaint|handoff_note|implicit_repeat",
  "category":"knowledge_gap|tool_error|routing_error|tone|safety|latency",
  "severity":"p0|p1|p2|p3",
  "confidence":0.91,
  "evidence_refs":["span:tool_call","message:turn3"],
  "suggested_target":"knowledge|skill|eval|policy|release|ops",
  "status":"new|triaged|queued|resolved"
}
```

## 验收标准

- 反馈 trace 关联率。
- 自动建单 precision。
- 反馈到修复平均时长。
- 修复后复发率下降。

---

# 30. Trace 事件定义

## 设计目标

让每次运行都能完整重建、审计、回放、对比，而不是只看散乱日志。

## 设计方案

采用 **事件流 + span 树**：事件记录事实，span 聚合生命周期。

## span 层级

```text
session_trace
  turn_span
    route_span
    prompt_compile_span
    knowledge_span
    model_span
    tool_span(s)
    guardrail_span
    reflection_span
    output_render_span
    handoff_span
```

## event schema

```json
{
  "event_id":"evt_1",
  "trace_id":"tr_1",
  "span_id":"sp_1",
  "parent_span_id":"sp_root",
  "turn_id":"turn_7",
  "kind":"tool_call_started|tool_call_finished|guardrail_triggered|chunk_sent|handoff_created",
  "phase":"routing|prompt|model|tool|guardrail|render|handoff",
  "timestamp_ms":1719999999999,
  "duration_ms":120,
  "status":"ok|error|cancelled|blocked",
  "actor_type":"user|agent|tool|system|human",
  "agent_id":"agent_1",
  "agent_version":"1.4.2",
  "skill_id":"order_service",
  "skill_version":"3.1.0",
  "action_id":"query_orders",
  "input_ref":"blob://...",
  "output_ref":"blob://...",
  "token_usage":{"input":123,"output":45},
  "cost_usd":0.0123,
  "redaction_state":"partial"
}
```

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 纯日志 | 简单 | 不可回放 |
| 纯 span | 结构清晰 | 细节不足 |
| 事件流 + span 树 | 可审计、可聚合、可回放 | 存储和设计复杂 |

## 推荐方案

P0 用标准事件 + span；P1 支持 replay from span；P2 支持 trace diff。

## 验收标准

- production turn 100% 有 trace_id。
- 失败样本可从 trace 重建原因。
- trace 可生成 regression eval。

---

# 31. Observability Metrics 体系

## 设计目标

用指标衡量体验、执行、风险、经营，而不是只看会话数。

## 指标分层

| 层 | 指标 |
|---|---|
| 体验 | TTFT、time_to_useful_response、clarification_turns、abandon_rate |
| 执行 | tool_latency、tool_success_rate、routing_confidence、cache_hit_rate |
| 风险 | guardrail_hit_rate、safety_incident、handoff_reason、pii_block |
| 经营 | auto_resolution_rate、cost_per_resolution、csat、saved_human_minutes |

## schema

```yaml
metric_name: tool_success_rate
scope: agent|skill|action|channel|tenant
window: 5m|1h|1d
dimensions: [agent_version, channel, release_stage]
threshold:
  warn: 0.95
  critical: 0.9
action: alert|pause_canary|rollback|create_task
```

## 推荐方案

指标从 Trace 派生，异常可下钻到 trace 样本，再一键生成待办/回归。

## 验收标准

- 关键指标可按 agent/skill/tool/channel/version 维度切片。
- 告警能跳到证据 trace。
- 指标异常可生成 AgentOps task。

---

# 32. Evaluation-in-Production 策略

## 设计目标

把真实线上流量变成持续评估资产，同时不破坏用户体验。

## 流程

```text
production traffic
  -> sample/shadow/canary
  -> auto grade + human review sample
  -> compare baseline/candidate
  -> gate release or create regression
```

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 只离线 eval | 简单 | 脱离真实流量 |
| 只 canary | 真实 | 有用户风险 |
| shadow + canary + sampled review | 最稳 | 基建复杂 |

## 推荐方案

P0 做 sampled online review；P1 做 shadow eval；P2 做 A/B + canary 自动门禁。

## schema

```json
{
  "eval_run_id":"ev_1",
  "trace_id":"tr_1",
  "mode":"shadow|canary|sampled_review|ab_test",
  "variant":"agent_v1.4.2",
  "baseline_variant":"agent_v1.4.1",
  "labels":{"task_success":true,"safety":true,"tone":"good","divergence":false},
  "verdict":"pass|fail|flaky|needs_review"
}
```

## 验收标准

- 线上失败可转 regression。
- canary 指标劣化能阻断放量。
- shadow 不影响用户输出。

---

# 33. Simulator / Sandbox 策略

## 设计目标

上线前模拟用户、工具、渠道、错误、审批和攻击，复现复杂多轮问题。

## 运行时流程

```text
scenario + persona + tool mocks + channel capabilities
  -> simulated conversation
  -> fault injection
  -> oracle grading
  -> trace/replay report
```

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 纯脚本 | 稳定 | 语言变化少 |
| 纯 LLM 用户 | 自然 | 不稳定 |
| LLM 用户 + 规则工具沙箱 | 覆盖和稳定兼顾 | 复杂 |

## 推荐方案

用户模拟用 LLM + 状态机；工具模拟用录制回放 + fault injection；渠道限制通过 channel capabilities 注入。

## schema

```json
{
  "scenario_id":"scn_refund_01",
  "persona":{"goal":"check_refund_status","emotion":"angry","patience_turns":2,"channel":"wechat"},
  "tool_plan":[{"tool":"query_orders","mode":"timeout","latency_ms":3000}],
  "oracle":{"must_handoff_after":2,"forbidden_actions":["refund_create_without_approval"]}
}
```

## 验收标准

- 场景可固定 seed 重放。
- 可模拟工具超时/空结果/schema drift。
- simulator 输出 trace 和 eval report。

---

# 35. Agent Version Compatibility 策略

## 设计目标

保证 Agent、Skill、Action、Prompt、Memory、Trace、Workflow、Channel 版本变化不破坏存量会话。

## 策略

- 会话开始时 pin artifact set。
- active session 默认继续旧版本。
- 新版本有兼容矩阵。
- schema breaking change 需要 migration adapter。
- replay 使用原版本或显式迁移版本。

## 方案对比

| 方案 | 优点 | 缺点 |
|---|---|---|
| 老会话永不升级 | 稳 | 版本碎片多 |
| 语义兼容 + lazy migration | 平衡 | 需矩阵 |
| 强制迁移 | 简单 | 风险大 |

## 推荐方案

使用 semantic compatibility matrix + lazy on resume migration。

## schema

```yaml
artifact_set:
  agent: 1.4.2
  skill_order: 3.1.0
  action_query_orders: 2.0.1
  memory_schema: 5.x
  trace_schema: 1.x
compatibility:
  migration_mode: lazy_on_resume
  incompatible_on: [removed_required_slot, breaking_tool_output_schema]
```

## 验收标准

- 旧会话恢复成功率。
- 迁移 dry-run 可见。
- 回滚后会话连续。

---

# 39. Release / Canary / Rollback Runtime 策略

## 设计目标

发布不只是保存配置，而是可门禁、可灰度、可回滚、可保护 active session 的状态机。

## 状态机

```text
draft -> testing -> staging -> shadow -> canary -> production -> paused/rollback/archived
```

## 推荐策略

- shadow 先行，零风险比对。
- canary 分 1/5/10/25/50/100。
- active session version sticky。
- 指标异常自动 pause/rollback。

## 配置

```yaml
release_policy:
  canary_weights: [1,5,10,25,50,100]
  session_stickiness: true
  rollback_thresholds:
    safety_incidents: 0
    task_success_drop_pp: 3
    p95_latency_delta_ms: 300
    tool_error_rate_delta_pp: 2
```

## 验收标准

- 发布记录包含 artifact set 和 eval report。
- 自动回滚有触发原因。
- 回滚恢复时延可测。

---

# 40. AgentOps 闭环策略

## 设计目标

把线上信号自动变成待办，并要求修复后绑定回归用例和指标验证。

## 流程

```text
signals from trace/metrics/feedback/eval/release
  -> classify + dedupe + score
  -> create ops task
  -> assign owner/SLA
  -> fix
  -> bind regression eval
  -> verify metric recovery
```

## 待办类型

- knowledge_gap。
- skill_bug。
- tool_contract_error。
- routing_error。
- policy_gap。
- release_regression。
- cost_anomaly。
- channel_degradation。

## schema

```json
{
  "ops_task_id":"ops_1",
  "source_type":"trace|metric|feedback|eval|incident",
  "source_refs":["tr_1","ev_2"],
  "issue_type":"knowledge_gap|skill_bug|tool_contract|policy_gap|release_regression",
  "severity":"p0|p1|p2|p3",
  "summary":"订单查询 canary 组 tool timeout spike",
  "owner_team":"agent-runtime",
  "sla_hours":24,
  "status":"new|triaged|in_progress|resolved|closed",
  "regression_eval_id":"re_1"
}
```

## 验收标准

- P0/P1 线上事故必须有 ops task。
- task 关闭必须绑定回归或说明豁免。
- 修复后指标恢复可见。
- 重复问题自动聚合。

---

## E 组落地顺序

1. Trace event/span schema。
2. Metrics 从 trace 派生。
3. Release gate + canary + rollback。
4. Feedback -> Ops task -> regression。
5. Simulator/Sandbox。
6. Version compatibility。
