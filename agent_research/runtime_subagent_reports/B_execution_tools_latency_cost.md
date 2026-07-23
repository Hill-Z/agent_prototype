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
