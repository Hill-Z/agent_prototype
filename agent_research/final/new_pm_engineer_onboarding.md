# 新人 PM / 工程师 Agent 平台从 0 到 1 训练手册

> 位置：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\new_pm_engineer_onboarding.md`  
> 目标：让新人理解什么是顶级 Agent，并能开始设计/实现一个可靠 Agent。

## 1. 先记住一句话

Agent = 目标 + 状态 + 工具 + 策略 + 执行循环 + 评测 + 治理。

如果只有 Prompt，它只是一个聊天机器人。  
如果只有 Tool，它只是一个 API 包装器。  
如果只有 Skill，它只是一个能力包。  
能上线服务客户的 Agent，必须能被测试、监控、回滚、交接人工。

## 2. 核心概念

### 2.1 Agent

负责完成业务目标的运行对象。它知道：

- 我是谁。
- 我要服务谁。
- 哪些事情能做，哪些不能做。
- 有哪些 Skills/Tools/Knowledge。
- 什么时候问用户，什么时候转人工。
- 怎么输出结果。

### 2.2 Skill

可复用能力包，例如：订单查询、商品推荐、售后退款、格式化输出。

Skill 不是完整 Agent。Skill 只解决一类能力；Agent 决定何时使用它、如何组合它、如何治理它。

### 2.3 Tool / Action

能对外部系统做确定性动作的接口，例如查询订单、创建工单、查询优惠券。

工具必须有：

- 输入 schema。
- 输出 schema。
- 参数来源。
- 权限。
- 错误码。
- 超时重试。
- mock。
- trace。

### 2.4 Knowledge

Agent 可引用的事实材料。知识不是越多越好，关键是：

- 是否新。
- 是否冲突。
- 是否命中。
- 是否有引用。
- 是否有权限。
- 是否能从失败中补齐。

### 2.5 Memory / State

Memory 不是把所有聊天记录塞回上下文。

应该分层：

- Turn state：当前轮临时变量。
- Session memory：会话内变量，如 wuid、订单号。
- Long-term memory：跨会话偏好，需授权。
- Checkpoint：流程恢复点。
- Compressed context：结构化摘要。

### 2.6 Eval

Eval 是 Agent 的测试集。没有 Eval 的 Agent 不该进生产。

至少测：

- 该不该触发。
- 工具参数对不对。
- 回答事实对不对。
- 格式对不对。
- 风险动作有没有拦截。
- 新版本有没有破坏旧场景。

## 3. 设计一个 Agent 的标准步骤

### Step 1：定义业务结果

不要先写 Prompt，先回答：

- 这个 Agent 要降低什么成本？
- 要提升什么指标？
- 哪些问题必须自动解决？
- 哪些问题必须转人工？
- 失败后怎么兜底？

模板：

```md
Agent 名称：
目标用户：
业务目标：
核心指标：
必须解决的问题：
必须拒绝/转人工的问题：
可调用系统：
上线渠道：
风险等级：
```

### Step 2：拆 Scenario / Topic

每个场景写清：

```md
场景名：订单物流查询
用户正例：
- 我的东西到哪了？
- 订单怎么还没到？
- 帮我查下物流
用户负例：
- 有什么优惠活动？
- 推荐一款面霜
必填变量：wuid 或订单号
可用工具：query_order、get_order_detail
输出：订单卡片 + 物流说明
转人工：查不到订单、用户投诉、连续失败 2 次
```

### Step 3：拆 Skill

Skill 最小结构：

```text
order-service/
  skill.yaml
  SKILL.md
  tools/tools.yaml
  evals/evals.json
  guardrails/policy.yaml
```

`SKILL.md` 应短、明确、可执行。长 SOP 放 references，不要全塞正文。

### Step 4：定义 Tool / Action

每个工具都要问：

- 这是只读还是写入？
- 需要什么权限？
- 哪些参数来自 session，哪些来自用户输入？
- 如果缺参数怎么办？
- 如果 API 超时怎么办？
- 返回空时能不能继续答？
- 是否需要用户确认或人工审批？

### Step 5：写 Guardrail

常见客服风险：

- 未登录查个人订单。
- 查询他人信息。
- 编造物流/退款状态。
- 错误承诺赔付。
- 泄露内部字段。
- 未确认就取消订单/申请退款。

### Step 6：生成 Eval

每个 Skill 至少要有：

- 10 条 should-trigger。
- 5 条 should-not-trigger。
- 5 条工具成功。
- 3 条工具空结果。
- 3 条工具失败/超时。
- 3 条风险动作。
- 3 条格式校验。

### Step 7：试聊 + Trace

试聊时不要只看最终回答，还要看：

- 触发了哪个 Topic/Skill。
- 用了哪些变量。
- 查了哪些知识。
- 调了哪个工具。
- 参数是否正确。
- 工具结果是什么。
- 为什么没转人工。

### Step 8：发布

上线前必须有：

- 版本号。
- 评测结果。
- 审核人。
- 回滚目标。
- 灰度策略。
- 监控指标。

## 4. Prompt 设计基本法

### 4.1 Prompt 分层

| 层 | 放什么 | 不放什么 |
|---|---|---|
| System | 安全、身份、不可违反规则 | 业务细节流水账 |
| Developer | 租户策略、权限、语气、工具边界 | 临时用户上下文 |
| Task | 当前用户请求、变量、检索摘要 | 长期固定规则 |
| Skill | 触发后执行某能力的步骤 | 全部 API 文档 |
| Tool | 参数说明、错误恢复 | 品牌人设 |
| Reflection | 失败复核、高风险检查 | 每轮都跑的废话 |

### 4.2 好 Prompt 的特征

- 能执行，不只是描述愿景。
- 有边界，知道何时不做。
- 能处理失败。
- 不要求模型记住可由系统保证的东西。
- 结构化输出关键决策。

### 4.3 坏 Prompt 的特征

- “你是最专业的客服，请热情回答所有问题。”
- 把 30 页 SOP 直接粘进去。
- 只说“必要时调用工具”，没说必要是什么。
- 风险动作只靠“请谨慎”。
- 没有负例和转人工条件。

## 5. Skill 编写模板

### 5.1 `skill.yaml`

```yaml
id: order-service
version: 0.1.0
status: draft
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
permissions:
  data_scope: customer_order_read
release:
  min_eval_pass_rate: 0.9
  human_review_required: true
```

### 5.2 `SKILL.md`

```md
---
name: order-service
description: Use when the user asks about orders, logistics, delivery status, after-sales, refund progress, or implicitly refers to a recent purchase. Requires wuid from session or explicit user identity before querying order APIs.
---

# Order Service Skill

Use this skill to help users query order, logistics, after-sales, and refund status.

Rules:
1. If `wuid` is missing, do not call order tools. Ask the user to login or transfer to human.
2. Never invent order, logistics, or refund status.
3. If tool result is empty, explain that no matching order was found and ask for order number.
4. If the user is angry or asks for compensation, transfer to human.
5. Format order results using the response-format skill.
```

## 6. Eval 模板

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
        "query_order": "success"
      },
      "expected": {
        "selected_skills": ["order-service", "response-format"],
        "tool_calls": [
          {"name": "query_order", "args_contains": {"wuid": "mock-wuid-1"}}
        ],
        "answer_contains": ["物流", "订单"],
        "forbidden": ["请提供 wuid"]
      },
      "risk": "low"
    }
  ]
}
```

## 7. 工程实现顺序

如果你是工程新人，最小实现顺序：

1. 消息模型：UserMessage、AssistantMessage、ToolCall、ToolResult、Event。
2. 模型适配：统一不同 LLM 的输入、输出、流式事件。
3. 工具注册：schema、权限、超时、错误、mock。
4. Agent loop：模型生成 -> 工具调用 -> 工具结果 -> 最终回答。
5. Session：thread_id、历史、变量、checkpoint。
6. Skill loader：读取 SKILL.md、manifest、工具依赖。
7. Router：根据 description/topic/eval 选择 Skill。
8. Trace：记录每一步。
9. Guardrail：输入、工具、输出。
10. Eval runner：批量跑测试集。
11. Release：版本、门禁、回滚。

## 8. PM 评审清单

设计 Agent 前，PM 必须能回答：

- 业务目标是什么？
- 目标指标是什么？
- 场景边界是什么？
- 必须转人工的情况有哪些？
- 需要哪些知识源？
- 需要哪些业务动作？
- 哪些动作有风险？
- 上线渠道是什么？
- 测试集覆盖了哪些正例/负例？
- 失败后怎么监控和迭代？

## 9. 工程评审清单

上线前，工程必须确认：

- 工具参数都有 schema 和来源。
- 工具有超时、重试、错误处理。
- 高风险工具有 HITL。
- 所有调用进入 trace。
- 会话状态可恢复。
- 评测可重复运行。
- 版本可回滚。
- 敏感信息脱敏。
- 生产密钥不在 Skill 包里。

## 10. 常见反模式

1. 把所有业务逻辑塞进系统 Prompt。
2. 前线工程师凭经验手写 Skill，没有测试。
3. 只有试聊，没有批量评测。
4. 保存即上线。
5. 工具没有权限和参数来源。
6. 用户要求人工时还继续硬答。
7. 工具失败后编造结果。
8. 只看会话数，不看解决率。
9. 知识库只上传不运营。
10. 没有 trace，线上问题靠猜。

## 11. 新人 7 天训练计划

| 天数 | 学习目标 | 输出 |
|---|---|---|
| Day 1 | 理解 Agent/Skill/Tool/Knowledge/Eval | 概念图 |
| Day 2 | 分析一个客服场景 | Scenario spec |
| Day 3 | 写一个标准 Skill | `skill.yaml` + `SKILL.md` |
| Day 4 | 设计工具 schema 和错误处理 | `tools.yaml` |
| Day 5 | 写 eval 和 guardrail | `evals.json` + `policy.yaml` |
| Day 6 | 跑试聊和 trace 分析 | 调试报告 |
| Day 7 | 做发布评审 | 上线 checklist + 风险报告 |

## 12. 推荐阅读顺序

1. `C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\agent_design_master_guide.md`
2. `C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\agent_platform_prd_blueprint.md`
3. `C:\Users\13609\.codex\workbase\chat_agent\agent_research\subagent_reports\prompt_skill_tool_eval.md`
4. `C:\Users\13609\.codex\workbase\chat_agent\agent_research\subagent_reports\opensource_architecture.md`
5. `C:\Users\13609\.codex\workbase\chat_agent\agent_research\subagent_reports\commercial_products.md`
