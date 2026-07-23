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
