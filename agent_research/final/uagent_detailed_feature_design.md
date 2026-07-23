# UAgent 下一代 Agent 平台详细功能清单与功能设计

> 文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\uagent_detailed_feature_design.md`  
> 版本：v0.1  
> 日期：2026-06-30  
> 角色视角：AI 产品经理 / Agent 平台产品负责人  
> 目标：把“调研结论”落到可以立项、拆需求、评审、排期、研发实现、测试验收的功能设计粒度。

---

## 0. 产品定位

UAgent 不应定位成“Prompt 配置后台”，而应定位成：

> 面向企业客服、售前、售后、运营场景的 **Agent 生产、测试、发布、监控、治理平台**。

它要让企业可以：

1. 用业务语言创建 Agent。
2. 用 Skills / Actions / Knowledge / Workflow 组装 Agent 能力。
3. 用 Eval / Trace / Guardrail 控制质量与风险。
4. 用 Handoff / Analytics / Feedback 闭环运营效果。
5. 用 Marketplace / Skill Copilot 规模化复制交付能力。

---

## 1. 总体信息架构 IA

建议一级导航：

```text
Dashboard                      总览与待办
Agents                         Agent 管理
Scenarios / Topics             场景与意图
Skills                         Skill 能力包
Actions / Tools                业务动作与工具
Knowledge                      知识库与知识运营
Workflows                      流程编排
Memory & Variables             记忆与变量
Test & Evaluation              测试与评测
Trace & Replay                 调试、追踪、回放
Handoff / Inbox                人工接管
Analytics                      数据分析与 ROI
Channels                       渠道发布
Release Center                 版本、灰度、回滚
Governance                     权限、安全、审计
Marketplace                    模板、Skill、动作市场
Settings                       租户、模型、计费、系统设置
```

---

## 2. 功能优先级总览

| 优先级 | 目标 | 功能范围 |
|---|---|---|
| P0 | 做出可上线、可调试、可回滚的客服 Agent 最小闭环 | Agent Studio、Skill Studio、Action Center、Knowledge、试聊 Trace、基础 Eval、发布/回滚、人工接管 |
| P1 | 做出企业可用、可商业化的平台 | 多环境、灰度、RBAC、审计、知识缺口、批量评测、成本 ROI、渠道策略、Skill Copilot 草稿生成 |
| P2 | 做出平台壁垒和生态 | Marketplace、多 Agent 协作、Workflow Graph、自动知识生成、语音 Agent、A/B Test、行业方案包 |

---

# 模块 A：Dashboard 总览与待办

## A1. Agent 运营总览

### 功能说明
为运营、客服主管、管理员提供所有 Agent 的核心健康状态，不再只看会话量，而是看 Agent 是否真的产生业务价值。

### 用户价值
- 主管能快速知道哪些 Agent 在解决问题，哪些在制造问题。
- PM 能发现需要优化的场景、知识、工具。
- 管理员能看到成本、异常、风险。

### 页面设计
顶部指标卡：
- 总会话数。
- 自动解决率。
- 转人工率。
- 平均首响时间。
- 平均解决时长。
- 用户满意度 CSAT。
- 模型成本。
- 每解决成本。
- 工具失败率。
- 高风险拦截次数。

中部图表：
- 趋势图：会话量 / 解决率 / 转人工率 / 成本。
- Top 场景：咨询量最高、失败率最高、转人工最高。
- Top Agent：表现最好 / 最差。
- 知识缺口聚类。
- 工具异常排行。

右侧待办：
- 待审核 Skill。
- 待发布版本。
- 待处理知识缺口。
- 待审批高风险动作。
- 评测失败版本。

### 数据对象
```json
{
  "workspace_id": "string",
  "agent_id": "string",
  "metric_date": "date",
  "sessions": 1234,
  "auto_resolution_rate": 0.63,
  "handoff_rate": 0.21,
  "csat": 4.3,
  "model_cost": 128.5,
  "cost_per_resolution": 0.12,
  "tool_error_rate": 0.03
}
```

### 验收标准
- 可按时间、Agent、渠道、场景筛选。
- 指标点击后可下钻到会话列表。
- 重要异常可生成优化待办。

---

## A2. 优化建议中心

### 功能说明
系统基于线上日志自动生成可执行优化建议，而不是让运营自己翻日志。

### 建议类型
1. 知识缺口：用户问了，但知识库没有答案。
2. 知识冲突：不同文档给出不同答案。
3. Skill 误触发：本该走订单，却走了推荐。
4. Tool 参数错误：订单号、wuid、手机号映射失败。
5. Guardrail 缺失：高风险动作没有拦截。
6. 转人工异常：低风险问题大量转人工。
7. 成本异常：某 Agent 平均 token/成本过高。
8. 渠道异常：某渠道格式失败、按钮不可用。

### 交互设计
每条建议展示：
- 问题描述。
- 影响范围。
- 证据样本。
- 建议动作。
- 一键生成：知识补充 / eval / Skill patch / 工具修复单。

### 验收标准
- 建议必须有证据链接。
- 建议可以转成任务或忽略。
- 被忽略的建议需要记录原因。

---

# 模块 B：Agents Agent 管理

## B1. Agent 列表

### 功能说明
统一管理所有 Agent，而不是每个 Agent 只是一个孤立配置页。

### 列表字段
- Agent 名称。
- 状态：draft / testing / staging / production / paused / archived。
- 负责人。
- 业务线。
- 渠道。
- 当前版本。
- 最近发布时间。
- 自动解决率。
- 转人工率。
- 最近 24h 异常数。
- 成本。

### 操作
- 新建 Agent。
- 复制 Agent。
- 进入配置。
- 进入调试。
- 查看监控。
- 暂停 / 恢复。
- 归档。

### 验收标准
- 支持搜索、标签、状态筛选。
- 高风险 Agent 有明显标识。
- production Agent 暂停需要二次确认并记录审计。

---

## B2. Agent 创建向导

### 功能说明
替代“先写 Prompt”的创建方式，从业务目标开始创建 Agent。

### 步骤设计

#### Step 1：选择业务场景
选项：
- 电商售前导购。
- 订单物流查询。
- 退换货售后。
- SaaS 技术支持。
- 预约/改期。
- 投诉安抚。
- 企业内部 IT Helpdesk。
- HR 政策问答。
- 自定义。

#### Step 2：填写业务目标
字段：
- Agent 名称。
- 目标用户。
- 主要目标：降低转人工 / 提升首响 / 提升转化 / 降低投诉 / 提升知识命中。
- 目标指标。
- 不允许处理的问题。

#### Step 3：选择渠道
- Web Widget。
- App SDK。
- API。
- 微信客服。
- 企微。
- 飞书。
- 钉钉。
- 邮件。
- 电商平台 IM。

渠道选择会影响：
- 输出格式。
- 按钮能力。
- 身份获取方式。
- 人工入口。
- 消息长度限制。

#### Step 4：绑定知识
- 上传文件。
- 绑定已有知识库。
- 绑定网页/帮助中心。
- 绑定 FAQ。
- 从历史工单生成知识草稿。

#### Step 5：选择业务动作
- 查询订单。
- 查询物流。
- 查询优惠券。
- 创建工单。
- 申请退款。
- 修改地址。
- 查询会员权益。

#### Step 6：选择转人工策略
默认策略：
- 用户明确要求人工。
- 连续失败 2 次。
- 低置信度。
- 高风险动作。
- 投诉/辱骂/法律/赔偿。
- VIP 用户。

#### Step 7：生成初始配置
系统自动生成：
- Agent profile。
- 初始 Prompt。
- Topic 列表。
- 推荐 Skills。
- 推荐 Actions。
- 基础 Guardrail。
- 初始 evals。

### 验收标准
- 10 分钟内可完成一个可试聊 Agent。
- 创建后必须自动生成至少 20 条测试用例。
- 创建结果进入 draft，不允许直接 production。

---

## B3. Agent Profile

### 功能说明
配置 Agent 的身份、目标、语气和业务边界。

### 字段设计
```yaml
agent_id: string
name: string
description: string
owner: string
business_line: string
business_goal: string
primary_metrics:
  - auto_resolution_rate
  - handoff_rate
  - csat
tone:
  style: professional | warm | concise | energetic | brand_custom
  forbidden_words: []
boundaries:
  allowed_topics: []
  forbidden_topics: []
  must_handoff_topics: []
```

### 交互设计
- 普通模式：表单配置。
- 高级模式：可编辑生成的 profile YAML。
- 右侧实时预览：不同语气下的回答示例。

### 验收标准
- 修改 profile 会生成版本 diff。
- production 修改需走发布流程。

---

## B4. Agent Policy

### 功能说明
配置 Agent 的拒答、升级、确认、合规、承诺边界。

### 策略类型
1. 拒答策略：违法、越权、隐私、无权限。
2. 升级策略：人工、主管、工单、投诉队列。
3. 用户确认策略：执行前二次确认。
4. 品牌承诺策略：不得承诺赔偿、时效、价格。
5. 合规策略：PII、金融、医疗、未成年人。

### 设计重点
Policy 应系统执行，不能只写在 Prompt 里。

### 验收标准
- 每条策略有触发条件、动作、话术、日志。
- 可通过 safety eval 验证。

---

# 模块 C：Scenarios / Topics 场景意图中心

## C1. Topic 管理

### 功能说明
把用户意图从 Prompt 中拆出来，形成可测试、可统计、可优化的业务对象。

### 字段
```yaml
topic_id: order_logistics
name: 订单物流查询
description: 用户询问订单发货、物流、配送进度。
positive_examples:
  - 我的东西到哪了
  - 帮我查一下物流
negative_examples:
  - 有什么优惠活动
  - 推荐一个商品
required_slots:
  - wuid
  - order_id optional
linked_skills:
  - order-service
linked_actions:
  - query_order
handoff_rules:
  - no_order_found_twice
  - user_angry
```

### 交互设计
- 左侧 Topic 列表。
- 中间基本配置。
- 右侧触发测试面板。
- 支持批量导入历史问法。

### 验收标准
- 每个 production Topic 必须有正例和负例。
- 触发测试通过率低于阈值不允许发布。

---

## C2. Topic 冲突检测

### 功能说明
检测两个 Topic 的触发表达过近，避免 Agent 路由错误。

### 场景
- “我要退货”可能触发售后退款，也可能触发投诉升级。
- “有没有优惠”可能触发商品推荐，也可能触发优惠券查询。

### 设计
系统计算：
- 语义相似度。
- 历史误触发率。
- 共享关键词。
- Skill 冲突关系。

输出：
- 冲突 Topic。
- 冲突样例。
- 推荐优先级。
- 推荐澄清问题。

### 验收标准
- 发布前自动扫描冲突。
- 高冲突必须处理或显式忽略。

---

## C3. Slot 槽位管理

### 功能说明
定义每个场景需要收集和验证的变量。

### 字段
- 槽位名。
- 类型：string / number / enum / date / phone / order_id。
- 是否必填。
- 来源：用户输入 / session / tool_result / memory。
- 抽取规则。
- 置信度阈值。
- 缺失处理。
- 冲突处理。

### 示例
```yaml
slot: order_id
type: string
required: false
source_priority:
  - user_input
  - session.selected_order_id
  - tool_result.latest_order
confidence_threshold: 0.8
missing_strategy: query_recent_orders
conflict_strategy: ask_user_to_confirm
```

### 验收标准
- 工具参数不得直接依赖未定义槽位。
- 低置信度槽位必须澄清或降级。

---

# 模块 D：Skills Skill 能力包中心

## D1. Skill 列表与资产管理

### 功能说明
将 Skill 作为平台资产管理，支持版本、状态、依赖、评测、发布。

### 列表字段
- Skill 名称。
- 描述。
- 类型：业务 Skill / 格式 Skill / 工具 Skill / 路由 Skill / Guardrail Skill。
- 版本。
- 状态。
- Owner。
- 被多少 Agent 使用。
- 最近评测通过率。
- 最近线上失败数。
- 风险等级。

### 操作
- 新建。
- 上传。
- 复制。
- 编辑。
- 运行评测。
- 发布。
- 废弃。

### 验收标准
- 被 production Agent 使用的 Skill 不允许直接修改，只能新版本。
- 废弃 Skill 前提示影响范围。

---

## D2. Skill 标准包编辑器

### 功能说明
提供结构化 Skill 编辑体验，不要求所有人手写文件。

### 页面结构
左侧文件树：
```text
skill.yaml
SKILL.md
prompts/
tools/
references/
scripts/
evals/
guardrails/
memory/
```

中间编辑区：
- Markdown 编辑器。
- YAML/JSON schema 编辑器。
- 表单化编辑。

右侧辅助区：
- Lint 结果。
- 依赖检查。
- 触发测试。
- 评测结果。
- 版本 diff。

### 验收标准
- `skill.yaml`、`SKILL.md`、`tools.yaml`、`evals.json`、`policy.yaml` 缺一则不能 production。
- 保存时做静态校验。

---

## D3. Skill Lint

### 功能说明
对 Skill 做静态质量检查，减少“靠经验写 Skill”。

### 检查项
1. frontmatter 是否完整。
2. description 是否可触发、是否过宽。
3. 是否包含密钥、token、生产账号。
4. 是否声明依赖变量。
5. 工具是否存在。
6. 工具参数是否有来源。
7. 高风险动作是否有 HITL。
8. 是否有正/负触发用例。
9. 输出格式是否有 schema。
10. 是否引用不存在的知识库/动作。

### 输出
- Error：必须修复。
- Warning：建议修复。
- Info：优化建议。

### 验收标准
- Error 未清零不能发布。
- Warning 需要确认后才能发布。

---

## D4. Skill Copilot

### 功能说明
根据 SOP、API 文档、历史会话、失败日志生成 Skill 草稿。

### 输入材料
- SOP / 话术。
- API / OpenAPI / Postman。
- 历史会话。
- 人工接管记录。
- 质检报告。
- 现有 Skill。

### 输出内容
- 候选 Skill 列表。
- 能力边界。
- open_questions。
- `skill.yaml`。
- `SKILL.md`。
- 工具 schema。
- evals。
- guardrails。
- mocks。
- 风险报告。

### 交互流程
1. 上传材料。
2. 系统抽取业务对象：意图、槽位、工具、风险动作。
3. 用户确认边界。
4. 生成 Skill 草稿。
5. 自动 lint。
6. 自动生成 eval。
7. mock 运行。
8. 人审。
9. 进入 staging。

### 关键规则
- 不允许一键发布 production。
- 不确定业务规则必须进入 open_questions。
- 生成内容必须带证据来源。
- 高风险动作必须默认 HITL。

### 验收标准
- 从一份 API 文档 + SOP 可生成可 lint 的 Skill 草稿。
- 至少生成 20 条 trigger eval。
- 至少生成 10 条 task eval。

---

## D5. Skill 依赖与影响分析

### 功能说明
修改 Skill 前显示影响哪些 Agent、Topic、Action、Eval。

### 展示内容
- 使用该 Skill 的 Agent。
- 使用版本。
- 线上流量占比。
- 相关 Topic。
- 相关 Actions。
- 最近失败样本。
- 必跑回归集。

### 验收标准
- production Skill 修改必须看到影响分析。
- 可一键生成回归测试任务。

---

# 模块 E：Actions / Tools 业务动作中心

## E1. Action 列表

### 功能说明
把 API、函数、MCP 工具包装为业务动作。

### 字段
- 动作名称。
- 动作类型：HTTP API / Function / MCP / Webhook / 内置工具。
- 风险等级：只读 / 低风险写入 / 高风险写入。
- 鉴权方式。
- Owner。
- 被哪些 Skill 使用。
- 成功率。
- 平均耗时。
- 最近错误。

### 验收标准
- 高风险动作列表有单独筛选。
- 停用动作前提示影响范围。

---

## E2. Action 配置

### 功能说明
让工程配置 API，让运营看到业务动作。

### 配置项
- 基本信息：名称、描述、业务含义。
- Endpoint / 函数入口。
- Method。
- Headers。
- Auth。
- Input schema。
- Output schema。
- 参数映射。
- 超时重试。
- 错误码映射。
- Mock。
- 权限。
- HITL。

### 参数来源设计
| 来源 | 示例 | 说明 |
|---|---|---|
| fixed | channel=uagent | 平台固定注入 |
| runtime | trace_id、tenant_id | 运行时注入 |
| session | wuid、phone_hash | 会话变量 |
| slot | order_id | 用户表达抽取 |
| tool_result | latest_order_id | 上一步工具结果 |
| inferred | date_range | 模型推断，需记录依据 |
| hitl | approval_id | 人审结果 |

### 验收标准
- 每个 required 参数必须有来源。
- inferred 参数用于高风险动作时必须用户确认。

---

## E3. Action 测试与 Mock

### 功能说明
上线前测试工具，不依赖真实生产环境。

### 功能
- 单次请求测试。
- 参数样例保存。
- Mock 返回配置。
- 错误返回模拟。
- 超时模拟。
- 权限失败模拟。
- schema 校验。

### 验收标准
- 每个 production Action 至少有 success / empty / error / timeout mock。
- Eval 可引用 mock。

---

## E4. Action 权限与审批

### 功能说明
将工具权限系统化。

### 风险等级
- L0：纯读公开数据。
- L1：读用户个人数据。
- L2：低风险写入，如创建咨询工单。
- L3：高风险写入，如退款、取消订单、修改地址。
- L4：资金/权益/法律承诺相关动作。

### 策略
- L0 可直接调用。
- L1 需要身份变量。
- L2 需要用户确认。
- L3 需要用户确认 + HITL 或策略审批。
- L4 默认人工处理。

### 验收标准
- 无权限调用被系统阻断。
- 阻断事件进入 trace。

---

# 模块 F：Knowledge 知识运营

## F1. 知识源管理

### 功能说明
管理文档、网页、FAQ、帮助中心、商品库、工单库等知识源。

### 字段
- 知识源名称。
- 类型。
- 同步方式。
- 同步频率。
- 权限范围。
- 最近同步时间。
- 文档数量。
- 失败数量。
- 绑定 Agent。

### 验收标准
- 同步失败可定位具体文档。
- 知识源可按 Agent / Topic 绑定。

---

## F2. 知识质量检测

### 功能说明
检测知识库是否适合 Agent 使用。

### 检测项
- 过期文档。
- 重复文档。
- 冲突答案。
- 缺标题。
- 无效链接。
- 低命中文档。
- 高命中低满意文档。
- 没有引用来源的答案。

### 验收标准
- 每个问题可生成修复建议。
- 可指派给知识 Owner。

---

## F3. 知识缺口分析

### 功能说明
从未解决会话中发现需要补充的知识。

### 流程
1. 收集未解决/转人工/差评会话。
2. 聚类用户问题。
3. 判断是否已有知识覆盖。
4. 生成候选 FAQ。
5. 人审。
6. 发布到知识库。
7. 加入回归 eval。

### 验收标准
- 每个缺口有样本数量和代表问题。
- 生成 FAQ 必须人审后上线。

---

# 模块 G：Workflows 流程编排

## G1. 模板化流程

### 功能说明
P0 不建议直接做复杂画布，先提供客服常用流程模板。

### 模板
- 知识问答流程。
- 订单查询流程。
- 售后退款流程。
- 投诉升级流程。
- 信息收集流程。
- 预约流程。

### 示例：订单查询流程
```text
识别订单意图
 -> 检查 wuid
 -> 如无 wuid，引导登录/转人工
 -> 查询最近订单
 -> 如多订单，询问用户选择
 -> 查询详情/物流
 -> 格式化输出
 -> 如失败，转人工或创建工单
```

### 验收标准
- 模板生成后可编辑变量和动作。
- 每个节点进入 trace。

---

## G2. Graph 高级模式

### 功能说明
P1/P2 面向高级用户提供可视化编排。

### 节点类型
- Start。
- LLM。
- Skill。
- Action。
- Knowledge Retrieval。
- Condition。
- Slot Filling。
- Human Approval。
- Formatter。
- End。
- Handoff。

### 必备能力
- checkpoint。
- interrupt。
- resume。
- 节点级重试。
- 节点级日志。
- 子流程。

### 验收标准
- 用户可从任一 checkpoint 恢复。
- 人审节点 pending 时不会丢失状态。

---

# 模块 H：Memory & Variables 记忆与变量

## H1. 变量中心

### 功能说明
统一管理固定变量、会话变量、槽位变量、工具结果变量。

### 变量类型
- Fixed variables：平台/租户固定注入。
- Runtime variables：trace_id、request_id、channel。
- Session variables：wuid、会员等级、最近订单。
- Slot variables：订单号、商品名、日期。
- Tool result variables：工具返回后写入。
- Long-term memory：偏好、禁忌、历史摘要。

### 字段
- 名称。
- 类型。
- 来源。
- TTL。
- 是否 PII。
- 可访问 Skills。
- 写入策略。
- 冲突策略。

### 验收标准
- PII 变量默认脱敏展示。
- Skill 访问未授权变量会被阻断。

---

## H2. 记忆写入策略

### 功能说明
避免 Agent 随意写长期记忆。

### 写入策略
- 禁止写入。
- 用户明确授权。
- 高置信自动写入。
- 人审后写入。

### 验收标准
- 长期记忆写入有审计。
- 用户可查看/删除长期记忆。

---

# 模块 I：Test & Evaluation 测试评测

## I1. Eval 用例管理

### 功能说明
管理 Agent/Skill/Topic 的测试用例。

### 用例字段
- id。
- 类型：trigger / tool_mapping / task_success / safety / format / regression。
- prompt。
- context。
- mock_tools。
- expected。
- forbidden。
- risk。
- owner。

### 验收标准
- 支持手动创建、批量导入、从日志生成。
- 每条用例可单独运行。

---

## I2. 批量评测运行

### 功能说明
发布前批量评测 Agent/Skill。

### 输出
- 总通过率。
- 各类型通过率。
- 失败原因。
- 工具调用差异。
- 新旧版本对比。
- 成本与耗时。

### 发布门禁
- P0 核心用例 >= 90%。
- Safety 100%。
- Tool mapping 100%。
- Format >= 95%。
- 回归不低于上一版本。

### 验收标准
- 评测结果可绑定发布记录。
- 失败用例可一键创建修复任务。

---

## I3. 红队测试

### 功能说明
模拟攻击、诱导、越权、敏感话题。

### 测试类型
- 越权查订单。
- 要求泄露内部系统字段。
- 诱导绕过人工审批。
- 要求虚假赔偿承诺。
- 恶意辱骂。
- Prompt injection。

### 验收标准
- 高风险 Agent 必须跑红队集。
- 红队失败不能上线。

---

# 模块 J：Trace & Replay 调试回放

## J1. 会话 Trace

### 功能说明
展示 Agent 每一步为什么这么做。

### 时间线事件
- 用户输入。
- Topic 判断。
- Skill 触发。
- 变量读取。
- 知识检索。
- 工具调用。
- 工具返回。
- Guardrail。
- Reflection。
- Handoff。
- 最终回答。

### 交互设计
- 左侧会话消息。
- 右侧事件时间线。
- 点击事件展开输入/输出/耗时/成本。
- 敏感字段脱敏。

### 验收标准
- 每一次 production 回答都有 trace_id。
- 可从 trace 生成 eval。

---

## J2. Replay 对比

### 功能说明
用同一批历史会话比较新旧版本表现。

### 对比项
- 是否触发相同 Topic。
- 是否调用相同工具。
- 参数是否变化。
- 答案是否更好。
- 是否更安全。
- 成本是否变化。

### 验收标准
- 发布前可选择最近失败样本 replay。
- replay 差异进入发布审批。

---

# 模块 K：Handoff / Inbox 人工接管

## K1. 人工接管规则

### 功能说明
配置何时从 Agent 转人工。

### 触发条件
- 用户要求人工。
- 低置信度。
- 连续失败。
- 工具异常。
- 高风险动作。
- 投诉/辱骂/法律/赔偿。
- VIP 用户。
- 超出营业时间策略。

### 验收标准
- 每次转人工都有 reason code。
- reason code 可统计分析。

---

## K2. 接管摘要

### 功能说明
人工客服接手时看到 Agent 已做过什么。

### 内容
- 用户问题摘要。
- 已确认信息。
- 已调用工具。
- 工具结果。
- 失败原因。
- 用户情绪。
- 建议下一步。

### 验收标准
- 摘要生成耗时低于 2 秒。
- 人工可反馈摘要是否有用。

---

# 模块 L：Channels 渠道发布

## L1. 渠道配置

### 功能说明
不同渠道有不同身份、格式、按钮、人工入口。

### 渠道字段
- 渠道类型。
- 身份获取方式。
- 欢迎语。
- 菜单。
- 输出格式限制。
- 按钮能力。
- 人工入口。
- 营业时间。
- 敏感词策略。

### 验收标准
- 同一 Agent 可绑定多渠道。
- 渠道级策略可覆盖 Agent 默认策略。

---

## L2. 发布嵌入

### 功能说明
支持 Web/API/SDK 等发布方式。

### 输出
- Web embed code。
- API endpoint。
- SDK 配置。
- 渠道 token。
- 回调 webhook。

### 验收标准
- 发布到生产前必须选择版本。
- embed/API 调用记录版本号。

---

# 模块 M：Release Center 版本发布

## M1. 版本管理

### 功能说明
Agent、Skill、Action、Knowledge、Workflow 都应版本化。

### 版本内容
- Prompt。
- Skills。
- Actions。
- Knowledge index version。
- Workflow。
- Policies。
- Eval thresholds。
- Channel config。

### 验收标准
- 任何 production 变更都有版本记录。
- 可查看 diff。
- 可回滚。

---

## M2. 发布流程

### 状态机
```text
draft -> testing -> staging -> pending_approval -> production -> paused / rollback / archived
```

### 发布前检查
- Lint 通过。
- Eval 通过。
- 高风险审批通过。
- 影响分析确认。
- 回滚版本存在。

### 验收标准
- 不满足门禁不能 production。
- 发布记录包含操作者、时间、结果。

---

## M3. 灰度发布

### 功能说明
降低上线风险。

### 灰度维度
- 渠道。
- 用户标签。
- 地区。
- 流量比例。
- 业务线。
- 白名单。

### 监控
- 灰度解决率。
- 转人工率。
- 错误率。
- 投诉率。
- 成本。

### 验收标准
- 指标异常自动暂停灰度。

---

# 模块 N：Governance 权限安全审计

## N1. RBAC

### 角色
- Owner。
- Admin。
- PM。
- Engineer。
- Operator。
- QA。
- Reviewer。
- Viewer。

### 权限对象
- Agent。
- Skill。
- Action。
- Knowledge。
- Eval。
- Release。
- Trace。
- Billing。

### 验收标准
- 权限变更有审计。
- 高风险 Action 需独立权限。

---

## N2. 审计日志

### 记录事件
- 登录。
- 创建/修改/删除。
- 发布。
- 回滚。
- 权限变更。
- 查看敏感 trace。
- 执行高风险动作。

### 验收标准
- 支持导出。
- 支持按人、对象、时间筛选。

---

## N3. 数据安全

### 功能
- PII 自动识别。
- Trace 脱敏。
- 数据保留策略。
- 租户隔离。
- 模型调用脱敏。
- 禁止 Skill 包内出现密钥。

### 验收标准
- 敏感数据字段按策略脱敏。
- 违规内容阻断发布。

---

# 模块 O：Analytics 数据分析

## O1. 客服 ROI 看板

### 指标
- 自动解决数。
- 节省人工时长。
- 每解决成本。
- 工单减少量。
- 转人工减少率。
- CSAT 提升。

### 验收标准
- 支持按 Agent、渠道、Topic 分析。
- 可导出报告。

---

## O2. 失败分析

### 失败类型
- 知识缺失。
- 知识冲突。
- 工具失败。
- 参数缺失。
- 意图误判。
- Guardrail 拦截。
- 用户要求人工。
- 输出格式失败。

### 验收标准
- 每类失败可查看样本。
- 可一键转 eval / 知识任务 / Skill 修复。

---

# 模块 P：Marketplace 模板市场

## P1. 官方模板库

### 模板类型
- Agent 模板。
- Skill 模板。
- Action 模板。
- Workflow 模板。
- Eval 模板。
- Guardrail 模板。
- 渠道模板。

### 首批建议
- 电商售前导购。
- 订单物流查询。
- 退换货售后。
- 投诉升级。
- SaaS 技术支持。
- HR 政策问答。
- IT Helpdesk。

### 验收标准
- 模板安装后生成 draft 配置。
- 模板有示例数据和 eval。

---

## P2. 企业内部模板库

### 功能说明
企业可沉淀自己的最佳实践。

### 功能
- 内部发布。
- 适用业务线。
- 评分。
- 下载/安装次数。
- 版本。
- 审核。

### 验收标准
- 模板发布需要管理员审核。

---

# 模块 Q：模型与成本管理

## Q1. 模型路由

### 功能说明
不同任务使用不同模型。

### 路由维度
- 场景。
- 风险等级。
- 成本预算。
- 响应时延。
- 语言。
- 工具复杂度。

### 示例
- 简单 FAQ：低成本模型。
- 高风险售后：高能力模型 + Reflection。
- 评测生成：离线模型。

### 验收标准
- 每次模型调用记录模型、成本、耗时。

---

## Q2. 成本预算

### 功能
- workspace 预算。
- Agent 预算。
- 渠道预算。
- 告警。
- 自动降级。

### 验收标准
- 超预算可自动切低成本模型或暂停非核心 Agent。

---

# 模块 R：开放平台与 API

## R1. Agent Run API

### 功能说明
对外提供 Agent 调用能力。

### 能力
- thread_id。
- stream。
- session_info。
- message。
- interrupted。
- pending_approval。
- trace_id。

### 验收标准
- API 返回可关联 trace。
- 支持历史查询。

---

## R2. Webhook

### 事件
- session_started。
- message_received。
- tool_called。
- handoff_requested。
- approval_required。
- session_resolved。
- eval_failed。

### 验收标准
- 支持重试和签名。

---

# 3. 第一阶段详细落地建议

## 3.1 最推荐先做的 10 个功能

1. Skill 标准包解析与编辑。
2. Skill Lint。
3. Action 参数来源和权限配置。
4. Mock 工具返回。
5. Eval 用例管理。
6. 批量评测运行。
7. 试聊 Trace 面板。
8. Agent 版本与回滚。
9. 人工接管摘要。
10. 知识缺口分析。

原因：这些能直接解决当前“前线工程师手写 Skills、不可测试、不可治理”的核心痛点。

## 3.2 用现有 order-service 做样板

建议拿当前 `order-service` Skill 做第一条标准化链路：

```text
现有 SKILL.md + tool.py
  -> 拆 skill.yaml
  -> 拆 tools.yaml
  -> 补 mock
  -> 补 evals
  -> 补 guardrail
  -> 接入 Skill Lint
  -> 接入 Testbench
  -> 接入 Trace
  -> 接入 Release Gate
```

验收：

- 能在平台看到 order-service 的依赖变量 `wuid`。
- 能看到 query_orders 等工具参数来源。
- 能 mock 成功、空结果、超时。
- 能跑 30 条 eval。
- 能看到每次试聊的 Skill 命中、工具调用、输出格式。
- 能阻止未登录查订单。

---

# 4. 总结

UAgent 下一阶段的产品重点不是再加一个“提示词优化器”，而是建设一套 Agent 工业化生产线：

```text
业务场景 -> Skill / Action / Knowledge -> Eval / Trace / Guardrail -> Release / Handoff / Analytics -> 失败回流 -> 再优化
```

这套能力做好以后，前线工程师不再是手写 Prompt 的苦力，而是使用平台标准件做交付；PM 不再靠感觉验收 Agent，而是用指标、评测、trace 和版本门禁管理 Agent。
