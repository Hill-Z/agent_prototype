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
