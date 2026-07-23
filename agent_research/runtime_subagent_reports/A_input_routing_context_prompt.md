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
