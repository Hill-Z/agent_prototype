# 客户需求进入后，如何搭建一个 UAgent Agent

> 文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\customer_agent_build_playbook.md`  
> 目标：把“客户来了一个需求”转成标准 Agent 交付流程。  
> 适用角色：售前、产品经理、解决方案工程师、实施工程师、平台研发、QA、客服运营。

---

## 1. 总体流程

客户来了需求后，不应该直接开始写 Prompt 或写 Skill，而应该按这条链路搭建：

```text
客户需求
  -> 需求澄清
  -> 场景拆解
  -> Agent 目标定义
  -> 数据/系统盘点
  -> Knowledge 配置
  -> Action/Tool 配置
  -> Skill 设计与生成
  -> Workflow/Policy 设计
  -> Eval 测试集生成
  -> 沙箱调试
  -> 人审/发布门禁
  -> 灰度上线
  -> 监控运营
  -> 失败回流迭代
```

一句话：

> 先确定“Agent 要帮客户解决什么业务结果”，再确定“它需要知道什么、能做什么、不能做什么、怎么验证它做对了”。

---

## 2. 第一阶段：需求澄清

### 2.1 目标

把客户一句模糊需求，例如：

> “我们想做一个智能客服，能帮用户处理订单和售后。”

拆成可落地的业务边界。

### 2.2 需要问客户的问题

#### A. 业务目标

1. 这个 Agent 首要解决什么问题？
   - 降低转人工？
   - 提升首响？
   - 提升售前转化？
   - 降低投诉？
   - 降低客服培训成本？

2. 成功指标是什么？
   - 自动解决率达到多少？
   - 转人工率降低多少？
   - 响应时间降低多少？
   - 每月减少多少人工工单？

3. 哪些场景必须自动处理？
4. 哪些场景必须转人工？
5. 哪些场景第一期不做？

#### B. 用户与渠道

1. 用户来自哪里？
   - 官网。
   - App。
   - 微信客服。
   - 企微。
   - 小程序。
   - 电商平台 IM。
   - 电话/语音。

2. 用户身份怎么获取？
   - 已登录。
   - 手机号。
   - openid。
   - unionid。
   - 会员 ID。
   - 订单号。

3. 渠道是否支持按钮、卡片、图片、跳转链接？

#### C. 知识与业务资料

1. 有哪些现成资料？
   - FAQ。
   - 帮助中心。
   - SOP。
   - 商品资料。
   - 活动规则。
   - 订单/售后规则。
   - 历史客服话术。
   - 历史工单。

2. 资料是否最新？谁负责维护？
3. 有没有冲突规则？例如不同活动规则重叠。

#### D. 系统与工具

1. Agent 需要查询哪些系统？
   - 会员系统。
   - 订单系统。
   - 物流系统。
   - 售后系统。
   - 优惠券系统。
   - 工单系统。
   - CRM。

2. 有 API 文档吗？
3. API 是否区分测试环境和生产环境？
4. 哪些接口只读？哪些接口会写入或改变用户权益？

#### E. 风险与合规

1. 哪些操作不能自动做？
   - 退款。
   - 取消订单。
   - 修改地址。
   - 补偿优惠券。
   - 改会员权益。

2. 哪些话不能说？
   - 承诺赔偿。
   - 承诺具体到账时间。
   - 暴露内部接口信息。
   - 暴露用户隐私。

3. 需要人工审批的动作有哪些？

### 2.3 需求澄清产物

输出一份《Agent 需求澄清表》：

```md
客户名称：
Agent 名称：
业务目标：
目标指标：
上线渠道：
目标用户：
一期范围：
不做范围：
必须转人工场景：
需要知识源：
需要工具/API：
高风险动作：
验收标准：
客户负责人：
我方负责人：
```

---

## 3. 第二阶段：场景拆解

### 3.1 目标

把客户需求拆成一个个可测试、可配置、可监控的 Topic / Scenario。

### 3.2 示例：订单售后 Agent

客户说：

> “我们要做订单售后智能客服。”

不要直接写一个“订单售后 Agent Prompt”，而是拆成：

| 场景 | 是否一期 | 处理方式 |
|---|---|---|
| 查询订单状态 | 是 | 调订单 API |
| 查询物流 | 是 | 调物流 API |
| 查询退款进度 | 是 | 调售后 API |
| 退货规则咨询 | 是 | 查知识库 |
| 申请退货 | 二期 | 需要用户确认 + 可能人工审批 |
| 修改地址 | 二期 | 高风险动作，需要人工 |
| 投诉赔偿 | 一期只转人工 | 直接升级人工 |
| 催发货 | 是 | 查订单状态 + 按规则回复 |
| 活动优惠咨询 | 否，归售前 Agent | 转售前/推荐场景 |

### 3.3 每个场景需要定义

```yaml
scenario_id: order_logistics
name: 订单物流查询
business_goal: 帮用户查询包裹发货和物流状态
user_examples:
  - 我的东西到哪了
  - 物流怎么还没更新
  - 帮我查下订单配送
negative_examples:
  - 有什么优惠活动
  - 推荐一个商品
required_variables:
  - wuid
optional_variables:
  - order_id
knowledge_needed:
  - 物流规则
  - 配送时效说明
actions_needed:
  - query_orders
  - get_order_detail
risk_level: L1
handoff_rules:
  - 用户投诉
  - 查询失败两次
  - 物流异常超过阈值
output_format:
  - 订单卡片
  - 物流说明
```

### 3.4 场景拆解产物

输出《Scenario Map》：

- 场景列表。
- 正例/负例。
- 必填变量。
- 知识依赖。
- 工具依赖。
- 风险等级。
- 转人工规则。
- 评测用例。

---

## 4. 第三阶段：定义 Agent 骨架

### 4.1 在平台创建 Agent

路径：

```text
Agents -> New Agent -> 选择模板/空白创建
```

填写：

- Agent 名称。
- 行业。
- 业务线。
- 负责人。
- 目标渠道。
- 业务目标。
- 目标指标。
- 默认语气。

### 4.2 Agent Profile 示例

```yaml
name: 屈臣氏订单售后 Agent
business_goal: 自动处理订单、物流、退款进度类咨询，降低人工转接。
target_users: 已登录会员和提供订单信息的用户
primary_metrics:
  - auto_resolution_rate
  - handoff_rate
  - csat
style:
  tone: 温和、专业、简洁
  avoid:
    - 绝对承诺赔偿
    - 编造物流状态
    - 暴露内部字段
boundaries:
  allowed:
    - 订单查询
    - 物流查询
    - 售后进度查询
    - 售后规则解释
  must_handoff:
    - 投诉赔偿
    - 法律威胁
    - 用户强烈不满
    - 高风险权益修改
```

### 4.3 此阶段产物

- Agent draft。
- Agent profile。
- 初始 policy。
- 绑定的一期场景。

---

## 5. 第四阶段：配置 Knowledge

### 5.1 判断哪些内容进知识库

适合进知识库：

- FAQ。
- 售后规则。
- 活动规则。
- 配送时效。
- 会员权益。
- 商品说明。
- 门店服务规则。

不适合只进知识库：

- 实时订单状态。
- 实时退款状态。
- 用户优惠券余额。
- 库存。
- 价格实时变化。

这些应该通过 Action / Tool 查询。

### 5.2 配置步骤

```text
Knowledge -> New Knowledge Source
  -> 选择来源：文件/网页/FAQ/数据库/历史工单
  -> 设置同步方式
  -> 设置权限范围
  -> 绑定 Agent / Scenario
  -> 跑知识质量检测
```

### 5.3 知识配置检查

- 是否过期？
- 是否有冲突？
- 是否有重复？
- 是否有来源引用？
- 是否可以被当前 Agent 访问？
- 是否需要审核后发布？

### 5.4 此阶段产物

- Knowledge source。
- 知识绑定关系。
- 知识质量报告。
- 知识引用策略。

---

## 6. 第五阶段：配置 Actions / Tools

### 6.1 判断哪些能力要做成 Action

凡是需要查实时系统、改变业务状态、生成工单的，都应该做成 Action。

常见 Action：

| Action | 类型 | 风险 |
|---|---|---|
| 查询会员信息 | 读用户数据 | L1 |
| 查询订单列表 | 读订单数据 | L1 |
| 查询订单详情 | 读订单数据 | L1 |
| 查询物流 | 读物流数据 | L1 |
| 查询退款进度 | 读售后数据 | L1 |
| 创建工单 | 写入 | L2 |
| 申请退款 | 高风险写入 | L3 |
| 修改地址 | 高风险写入 | L3 |
| 发放补偿券 | 权益变更 | L4 |

### 6.2 配置 Action

路径：

```text
Actions -> New Action -> HTTP API / Function / MCP
```

必须填写：

- 动作名称。
- 业务说明。
- Endpoint。
- 鉴权。
- Input schema。
- Output schema。
- 参数来源。
- 超时重试。
- 错误码。
- Mock。
- 权限等级。
- HITL 策略。

### 6.3 参数来源示例

```yaml
action: query_orders
parameters:
  wuid:
    source: session.wuid
    required: true
    pii: true
    missing_strategy: ask_login_or_handoff
  page:
    source: fixed
    value: 1
  page_size:
    source: fixed
    value: 5
  trace_id:
    source: runtime.trace_id
```

### 6.4 错误处理示例

```yaml
errors:
  AUTH_MISSING:
    strategy: ask_user_login_or_transfer
  ORDER_NOT_FOUND:
    strategy: ask_order_id_or_show_recent_orders
  TIMEOUT:
    strategy: retry_once_then_handoff
  UPSTREAM_ERROR:
    strategy: conservative_reply_and_create_ticket
```

### 6.5 此阶段产物

- Action 配置。
- schema。
- mock。
- 权限策略。
- 错误恢复策略。

---

## 7. 第六阶段：设计 Skills

### 7.1 Skill 怎么拆

一个 Agent 通常由多个 Skill 组成。

以订单售后 Agent 为例：

| Skill | 作用 |
|---|---|
| customer-info | 获取用户会员/身份信息 |
| order-service | 订单、物流、售后查询 |
| refund-policy | 售后规则解释 |
| response-format | 格式化输出卡片和按钮 |
| handoff-policy | 判断是否转人工 |
| complaint-escalation | 投诉升级处理 |

### 7.2 Skill 不是越大越好

推荐拆法：

- 一个 Skill 解决一个高内聚业务能力。
- 格式化 Skill 单独拆。
- 高风险动作 Skill 单独拆。
- 通用用户信息 Skill 单独拆。
- 不要把售前、售后、投诉、会员权益全部塞一个 Skill。

### 7.3 创建 Skill

路径：

```text
Skills -> New Skill -> 使用 Skill Copilot / 从模板创建 / 手动创建
```

### 7.4 Skill Copilot 输入

上传：

- 场景说明。
- SOP。
- API 文档。
- 历史对话。
- 输出格式要求。
- 风险规则。

系统生成：

- `skill.yaml`。
- `SKILL.md`。
- `tools.yaml`。
- `evals.json`。
- `guardrails/policy.yaml`。
- mocks。
- open_questions。

### 7.5 Skill 设计示例

```yaml
id: order-service
name: 订单售后查询
version: 0.1.0
status: draft
description: 处理订单状态、物流、退款进度、售后单状态查询。
triggers:
  include:
    - 我的订单在哪
    - 查物流
    - 退款什么时候到账
  exclude:
    - 商品推荐
    - 优惠活动
variables:
  required:
    - wuid
actions:
  - query_orders
  - get_order_detail
  - query_refunds
guardrails:
  - no_fake_order_status
  - no_cross_user_query
  - complaint_to_human
evals:
  min_pass_rate: 0.9
```

### 7.6 此阶段产物

- Skill 包。
- Skill 依赖关系。
- Skill 触发规则。
- Skill eval。
- Skill guardrail。

---

## 8. 第七阶段：设计 Workflow / Policy

### 8.1 什么时候需要 Workflow

如果场景只是 FAQ，可不需要复杂 Workflow。

如果有多步判断，就需要 Workflow：

- 先判断登录。
- 再查订单。
- 如果多订单，让用户选择。
- 如果物流异常，转人工。
- 如果工具失败，重试。
- 如果用户投诉，升级。

### 8.2 订单查询 Workflow 示例

```text
Start
  -> Identify Topic
  -> Check session.wuid
    -> missing: ask login / handoff
    -> exists: query_orders
  -> orders count
    -> 0: ask order_id or handoff
    -> 1: get_order_detail
    -> many: ask user choose order
  -> format response
  -> end
```

### 8.3 Policy 设计

必须系统化配置，不只写提示词。

| Policy | 规则 |
|---|---|
| 隐私 | 不能查询他人订单 |
| 事实 | 不能编造订单/物流状态 |
| 投诉 | 投诉赔偿转人工 |
| 高风险动作 | 退款/取消/改地址需要确认和审批 |
| 工具失败 | 重试一次，失败后保守回复/转人工 |
| 用户要求人工 | 立即转人工 |

### 8.4 此阶段产物

- Workflow。
- Policy。
- HITL 规则。
- 转人工规则。

---

## 9. 第八阶段：生成 Eval 测试集

### 9.1 为什么必须做 Eval

没有 Eval，就无法判断 Agent 是否真的能上线。

试聊只能证明“某一次看起来可以”，Eval 才能证明“这一批核心场景稳定可用”。

### 9.2 Eval 类型

| 类型 | 测什么 |
|---|---|
| Trigger eval | 该场景是否正确触发 |
| Negative eval | 不该触发时是否不触发 |
| Tool mapping eval | 工具参数是否正确 |
| Task success eval | 用户问题是否解决 |
| Format eval | 输出是否符合渠道格式 |
| Safety eval | 风险动作是否拦截 |
| Regression eval | 历史失败是否修复 |

### 9.3 示例 Eval

```json
{
  "id": "order-logistics-001",
  "prompt": "我的东西到哪了？",
  "context": {
    "session": {"wuid": "mock-wuid-1"}
  },
  "mock_tools": {
    "query_orders": "success_one_order",
    "get_order_detail": "logistics_shipping"
  },
  "expected": {
    "selected_topic": "order_logistics",
    "selected_skill": "order-service",
    "tool_calls": ["query_orders", "get_order_detail"],
    "answer_contains": ["物流", "订单"],
    "forbidden": ["请提供 wuid", "我猜测"]
  }
}
```

### 9.4 最低测试数量

一期 Agent 上线前建议：

- 每个核心 Topic：10 条正例。
- 每个核心 Topic：5 条负例。
- 每个 Action：成功、空结果、失败、超时各 1 条。
- 每个高风险规则：至少 3 条 safety eval。
- 历史失败样本：全部进入 regression eval。

### 9.5 此阶段产物

- Eval suite。
- Mock 数据。
- 发布阈值。
- 回归集。

---

## 10. 第九阶段：沙箱调试

### 10.1 调试顺序

不要一上来连生产接口。

推荐顺序：

```text
Skill Lint
  -> Mock Tool 单测
  -> 单轮试聊
  -> 多轮试聊
  -> Eval 批量跑
  -> 测试环境真实 API
  -> 灰度真实用户
```

### 10.2 试聊时要看什么

不要只看最终回答，要看 Trace：

- 识别了哪个 Topic。
- 触发了哪个 Skill。
- 读取了哪些变量。
- 检索了哪些知识。
- 调用了哪些 Action。
- 参数是否正确。
- 工具返回什么。
- 有没有触发 Guardrail。
- 为什么转人工或没转人工。
- 输出格式是否正确。

### 10.3 常见调试问题

| 问题 | 可能原因 | 修复方式 |
|---|---|---|
| 不触发 Skill | description 太窄 / Topic 正例不足 | 优化 trigger examples |
| 误触发 | description 太宽 / 缺负例 | 增加 negative eval |
| 工具参数错 | 变量来源不清 | 修 tools.yaml 参数映射 |
| 工具失败乱答 | 缺错误恢复 | 加 error strategy |
| 输出格式乱 | formatter Skill 不稳定 | 加 format schema/eval |
| 高风险未拦截 | Guardrail 缺失 | 加 safety policy |

### 10.4 此阶段产物

- 调试报告。
- Eval 结果。
- Trace 样本。
- 修复清单。

---

## 11. 第十阶段：发布前评审

### 11.1 发布门禁

必须通过：

- Skill Lint 无 Error。
- 核心 Eval 通过率 >= 90%。
- Safety Eval 100% 通过。
- Tool mapping 100% 通过。
- Format Eval >= 95%。
- 高风险 Action 有 HITL。
- 回滚版本存在。
- 客户确认话术与边界。

### 11.2 评审角色

| 角色 | 看什么 |
|---|---|
| PM | 是否符合业务范围和目标 |
| 解决方案工程师 | API/Skill/Workflow 是否完整 |
| QA | Eval 是否覆盖核心路径 |
| 客服主管 | 话术、转人工、业务规则是否可接受 |
| 安全/合规 | 隐私、权限、高风险动作 |
| 客户负责人 | 是否允许上线灰度 |

### 11.3 发布产物

- 发布版本。
- Eval 报告。
- 风险说明。
- 回滚方案。
- 灰度策略。
- 客户确认记录。

---

## 12. 第十一阶段：灰度上线

### 12.1 灰度策略

建议不要全量上线。

可以按：

- 5% 流量。
- 单一渠道。
- 单一业务线。
- 白名单用户。
- 低风险场景。

### 12.2 灰度监控

重点看：

- 自动解决率。
- 转人工率。
- 投诉率。
- 工具失败率。
- 用户满意度。
- 高风险拦截。
- 成本。

### 12.3 自动暂停规则

例如：

```yaml
rollback_rules:
  - tool_error_rate > 10% for 10 minutes
  - complaint_rate > baseline * 2
  - safety_violation_count > 0
  - csat < 3.5 for 100 sessions
```

### 12.4 此阶段产物

- 灰度报告。
- 是否扩量建议。
- 问题清单。
- 新增 regression eval。

---

## 13. 第十二阶段：正式上线与持续运营

### 13.1 上线后不是结束

Agent 上线后要进入运营循环：

```text
线上会话
  -> Trace / Analytics
  -> 失败聚类
  -> 知识缺口
  -> Skill patch
  -> Eval 回归
  -> 灰度发布
  -> 指标复盘
```

### 13.2 每周运营例会看板

- 本周会话量。
- 自动解决率。
- Top 10 Topic。
- Top 10 未解决问题。
- 转人工原因分布。
- 工具失败排行。
- 知识缺口。
- 新增/修改 Skill。
- 成本变化。
- 下周优化计划。

### 13.3 持续优化动作

- 补知识。
- 优化 Topic 触发。
- 修改 Skill。
- 修工具错误处理。
- 增加转人工策略。
- 新增 eval。
- 调整模型路由。
- 优化输出格式。

---

## 14. 一个完整例子：搭建“订单售后 Agent”

### 客户原始需求

> 我们希望用户能自己查询订单、物流、退款进度，减少人工客服压力。

### 拆解后的一期范围

做：

- 查询订单列表。
- 查询订单详情。
- 查询物流。
- 查询退款进度。
- 售后规则问答。
- 异常转人工。

不做：

- 自动退款。
- 自动取消订单。
- 自动修改地址。
- 自动赔偿。

### 需要资料

- 售后 FAQ。
- 物流时效规则。
- 退款到账规则。
- 历史人工话术。
- API 文档。

### 需要 Actions

- `get_customer_info`。
- `query_orders`。
- `get_order_detail`。
- `query_refunds`。
- `get_refund_detail`。

### 需要 Skills

- `customer-info`。
- `order-service`。
- `refund-policy`。
- `response-format`。
- `handoff-policy`。

### 需要 Guardrail

- 无 wuid 不查订单。
- 不查他人订单。
- 不编造订单状态。
- 投诉赔偿转人工。
- 自动退款不做。

### 需要 Eval

- 订单物流正例 20 条。
- 退款进度正例 15 条。
- 售后规则正例 15 条。
- 商品推荐负例 10 条。
- 投诉赔偿 safety 10 条。
- 工具失败 10 条。
- 格式校验 10 条。

### 上线标准

- 核心 Eval >= 90%。
- Safety 100%。
- Tool mapping 100%。
- 客户验收 20 条真实问题。
- 灰度 5% 一周无安全事故。

---

## 15. 不同客户需求对应搭建方式

### 15.1 纯知识问答型

例如：政策咨询、产品说明、HR 问答。

重点：

- Knowledge。
- Topic。
- 引用来源。
- 知识缺口。
- Format eval。

不一定需要复杂 Tool。

### 15.2 查询型 Agent

例如：查订单、查物流、查会员、查工单。

重点：

- 身份变量。
- Action。
- 参数映射。
- Tool error recovery。
- Trace。
- 隐私 guardrail。

### 15.3 交易/写操作型 Agent

例如：退款、改地址、取消订单、发券。

重点：

- 用户确认。
- HITL。
- 权限。
- 幂等。
- 审计。
- 回滚/补偿机制。

### 15.4 售前导购型

例如：商品推荐、活动咨询、搭配推荐。

重点：

- 商品知识。
- 用户画像。
- 推荐策略。
- 库存/价格工具。
- 卡片格式。
- 转化指标。

### 15.5 投诉/复杂服务型

例如：赔偿、纠纷、法律威胁、差评安抚。

重点：

- 情绪识别。
- 人工转接。
- 话术边界。
- 风险拦截。
- 质检。

---

## 16. 标准交付物清单

一个客户 Agent 交付完成，至少应该有这些材料：

```text
01_requirements.md             需求澄清表
02_scenario_map.md             场景地图
03_agent_profile.yaml          Agent 身份与目标
04_policy.yaml                 策略与边界
05_knowledge_plan.md           知识配置方案
06_actions.yaml                工具/API 配置
07_skills/                     Skill 包
08_workflow.yaml               流程配置
09_evals.json                  测试集
10_eval_report.md              测试报告
11_trace_samples.md            调试样本
12_release_plan.md             发布计划
13_rollout_report.md           灰度报告
14_operation_playbook.md       运营手册
```

---

## 17. 最关键的产品原则

1. 客户需求进来后，先拆业务，不先写 Prompt。
2. 能用知识解决的，不做工具。
3. 必须查实时状态的，做 Action。
4. 一个 Skill 只负责一个高内聚能力。
5. 高风险动作默认不自动执行。
6. 每个上线能力必须有 Eval。
7. 每个线上回答必须有 Trace。
8. 每个失败样本都应该能回流成知识、Skill 或 Eval。
9. 发布必须有版本和回滚。
10. Agent 的交付终点不是上线，而是指标持续改善。
