# UAgent 下一代 Agent 平台 PRD 蓝图

> 位置：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\agent_platform_prd_blueprint.md`  
> 目标：把调研结论转成可立项、可拆迭代、可交付的产品蓝图。  
> 产品定位：面向企业客服/营销/售后场景的可治理 Agent 平台。

## 1. 产品愿景

让企业可以像配置客服 SOP 一样配置 Agent，像管理生产系统一样发布 Agent，像管理客服团队一样评估 Agent。

不是做“会聊天的机器人”，而是做：

- 能回答知识问题。
- 能调用业务系统。
- 能遵守权限和风险策略。
- 能和人工客服协作。
- 能被测试、监控、回滚。
- 能持续从失败中学习。

## 2. 目标用户

| 用户 | 当前痛点 | 平台应提供 |
|---|---|---|
| 业务/客服 PM | 不知道怎么把 SOP 变成 Agent；依赖工程写 Skill | 创建向导、模板、Skill Copilot、测试集生成 |
| 前线/解决方案工程师 | 被迫手写 Prompt/Skill，质量不可控 | 标准 Skill 包、lint、mock、工具 schema、评测门禁 |
| 平台工程师 | Agent 行为不可复现，问题难排查 | Trace、Event、Checkpoint、Replay、权限引擎 |
| 客服主管 | 不知道 Agent 有没有真的解决问题 | ROI 看板、解决率、转人工、知识缺口、失败聚类 |
| 质检/合规 | 怕错误承诺、泄露隐私、越权操作 | Guardrail、HITL、审计、敏感动作审批 |
| 企业管理员 | 需要权限、安全、审计、成本管理 | Workspace、RBAC、SSO、环境、成本中心 |

## 3. 核心模块

### 3.1 Agent Studio

**目标**：让 PM/运营以业务语言创建 Agent。

关键功能：

- Agent 创建向导：行业、目标、渠道、业务能力、交接规则。
- Agent Profile：名称、描述、负责人、目标指标、品牌语气。
- Policy 配置：拒答、升级人工、用户确认、合规边界。
- 场景绑定：选择 Topic/Scenario/Skill/Workflow。
- 高级 Prompt 模式：给专业用户编辑系统提示词、开发者指令。

验收：

- 新人 PM 可在 30 分钟内创建可试聊 Agent。
- 创建完成自动生成初始测试集。
- Agent 配置可版本化、可 diff、可回滚。

### 3.2 Scenario / Topic Center

**目标**：把业务场景从 Prompt 中拆出来。

字段：

- 场景名称：订单查询、售后退款、商品推荐、投诉升级。
- 触发表达：正式问法、口语、错别字、多轮隐式表达。
- 排除表达：相邻但不应触发的场景。
- 必填槽位：订单号、手机号、wuid、商品 ID。
- 关联 Skill/Action/Workflow。
- 转人工条件：低置信度、敏感、重复失败、VIP。

验收：

- 每个 Topic 至少有 10 条正例、5 条负例。
- Topic 触发率、误触发率可在评测中看到。

### 3.3 Skill Studio

**目标**：把 Skill 从“工程师手写文件”升级为“平台资产”。

功能：

- Skill 包上传/创建/版本管理。
- 结构化编辑：`skill.yaml`、`SKILL.md`、prompts、tools、evals、guardrails、memory。
- 依赖检查：变量、工具、知识库、权限、渠道格式。
- Skill Lint：frontmatter、触发描述、变量来源、敏感信息、工具 schema。
- Skill Preview：单 Skill 试跑、mock 工具结果、输出格式检查。
- Skill Diff：版本差异、风险变化、评测变化。
- Skill Marketplace：官方行业包、企业内部包。

P0 标准 Skill 包：

```text
skill-id/
  skill.yaml
  SKILL.md
  tools/tools.yaml
  evals/evals.json
  guardrails/policy.yaml
```

### 3.4 Skill Copilot

**目标**：把 SOP/API/历史会话生成可测试的 Skill 草稿。

输入：

- SOP/话术/业务流程。
- API 文档/OpenAPI/Postman 示例。
- 历史会话和人工接管记录。
- 失败日志和质检问题。
- 现有 Skill。

输出：

- 候选 Skill 列表。
- open_questions：无法自动判断的问题。
- `skill.yaml`、`SKILL.md`、工具 schema、变量映射、guardrail、eval。
- mock 数据和测试集。
- 发布风险报告。

流程：

```text
材料上传 -> 自动抽取 -> 业务确认 -> 生成草稿 -> lint -> mock eval -> 人审 -> staging -> 灰度 -> production
```

MVP 不允许一键直发生产；只能生成 draft/review。

### 3.5 Action / Tool Center

**目标**：把 API 包装成可治理业务动作。

字段：

- 动作名称：查询订单、创建工单、申请退款。
- API/函数/MCP 配置。
- 输入 schema、输出 schema。
- 参数来源：fixed/runtime/session/slot/tool_result/inferred/hitl。
- 鉴权方式、租户隔离。
- 风险等级：只读、低风险写、高风险写。
- 超时、重试、熔断。
- 错误码与恢复策略。
- mock 数据。
- 人审策略。

验收：

- 所有工具参数必须有来源。
- 高风险动作必须有 HITL。
- 工具结果必须进入 trace。

### 3.6 Knowledge Center

**目标**：从上传资料升级为知识运营。

功能：

- 多源导入：文件、网页、FAQ、帮助中心、工单、商品库、CRM。
- 同步状态：成功/失败/过期/权限异常。
- 知识质量：冲突、重复、过期、低命中、无引用。
- 引用答案：每次回答可追溯来源。
- 知识缺口：未解决问题聚类、建议新增 FAQ。
- 审核发布：知识草稿、审核、上线、回滚。

### 3.7 Workflow / Graph Studio

**目标**：承载复杂客服流程，避免 Prompt 变成流程图。

P0 先不做重画布，可做模板式流程：

```text
识别意图 -> 检查变量 -> 检索知识 -> 调动作 -> 判断结果 -> 输出/转人工
```

P1 再提供可视化节点：

- LLM 节点。
- Tool 节点。
- 条件分支。
- 变量提取。
- 人工审批。
- 子流程。
- 结束/转人工。

必须支持 checkpoint、interrupt、resume。

### 3.8 Test & Evaluation Center

**目标**：让上线前风险可见。

评测类型：

- Trigger eval：该不该触发。
- Tool mapping eval：参数是否正确。
- Task success eval：任务是否完成。
- Regression eval：旧问题有没有被破坏。
- Safety eval：风险是否被拦截。
- Format eval：输出是否符合前端协议。

发布门禁建议：

- 核心场景通过率 >= 90%。
- 高风险 safety eval 100% 通过。
- 工具参数映射 100% 通过。
- 回归集不低于上一版本。
- 人审通过后才能 production。

### 3.9 Trace / Replay Console

**目标**：让每个 Agent 决策可复现。

Trace 内容：

- 用户输入。
- 命中 Topic/Skill。
- 读取的变量。
- 检索的知识与引用。
- 工具调用参数/结果/错误。
- Guardrail 触发。
- Handoff 原因。
- 最终回答。
- 成本、延迟、模型。

功能：

- 单会话时间线。
- 失败原因聚类。
- 一键生成回归用例。
- 版本间 replay 对比。

### 3.10 Handoff / Inbox

**目标**：让 Agent 和人工客服协作，而不是断裂。

交接信息：

- 用户问题摘要。
- Agent 已尝试动作。
- 已确认事实。
- 工具结果摘要。
- 失败/转人工原因。
- 建议下一步。
- 风险提示。

状态机：

```text
auto_handling -> pending_user_confirmation -> pending_human_review -> human_taking_over -> resolved / returned_to_agent
```

### 3.11 Analytics / ROI

角色化看板：

- 运营：主题分布、知识缺口、话术质量。
- 主管：自动解决率、转人工率、CSAT、队列压力。
- 管理员：成本、权限、渠道、SLA、错误。
- 工程：trace、工具失败、延迟、API 错误。

核心指标：

- 自动解决率。
- 转人工率。
- 平均响应时间。
- 每解决成本。
- 工具成功率。
- 知识命中率。
- 用户满意度。
- 高风险拦截成功率。

## 4. 迭代路线

### Phase 0：标准化现有 Skill

- 选择 `order-service` 做样板。
- 补 `skill.yaml`、`tools.yaml`、mock、eval、guardrail。
- 跑 30 条测试：正例、负例、工具失败、格式校验。

### Phase 1：Skill Studio + Testbench

- 平台能上传/编辑/版本化 Skill。
- 能做 lint、mock eval、试聊 trace。
- 发布前显示风险和通过率。

### Phase 2：Agent 创建向导 + 业务动作中心

- 用业务模板创建 Agent。
- API 动作结构化配置。
- 关联 Skill/Topic/Knowledge/Action。

### Phase 3：Release / Analytics / Handoff

- sandbox/staging/production。
- 灰度与回滚。
- 人工接管和 ROI 看板。

### Phase 4：Skill Copilot

- SOP/API/历史会话生成 Skill 草稿。
- 失败日志自动生成 regression eval。
- 不自动上线，必须人审。

### Phase 5：Marketplace / 行业方案

- 官方电商售后包、SaaS 支持包、教育咨询包。
- 企业内部 Skill 模板库。
- 逐步开放第三方生态。

## 5. 关键风险

| 风险 | 表现 | 规避 |
|---|---|---|
| Prompt 黑盒化 | 所有逻辑塞进提示词 | 结构化 Scenario/Action/Workflow/Guardrail |
| Skill 质量不可控 | 前线工程师各写各的 | 模板、lint、eval、review、版本 |
| 保存即事故 | 改配置直接影响生产 | 环境、门禁、灰度、回滚 |
| 商业价值不清 | 客户只看到聊天量 | 解决率、成本、转人工、知识缺口 |
| 工具越权 | 模型调用了不该调的 API | 权限 scope、参数来源、HITL |
| 线上问题难复现 | 没有 trace/replay | 事件流、checkpoint、回归用例生成 |

## 6. 第一批需求清单

### P0

1. Agent 目标驱动创建向导。
2. Topic/Scenario 结构化配置。
3. Skill 标准包解析与版本管理。
4. Skill Lint。
5. Tool schema/参数来源/风险等级配置。
6. Mock 工具与单 Skill 试跑。
7. 测试集管理与批量运行。
8. 试聊 Trace 面板。
9. 人工交接摘要。
10. 草稿/上线版本/回滚。

### P1

11. 多环境 sandbox/staging/production。
12. 发布门禁与审批。
13. 知识缺口分析。
14. 失败日志一键生成 eval。
15. 灰度发布。
16. 权限/RBAC/审计。
17. 成本与 ROI 看板。
18. 业务动作模板库。
19. 渠道级策略。
20. Skill Copilot draft 生成。

### P2

21. 多 Agent 分诊与协作。
22. Workflow Graph 可视化。
23. 行业方案包。
24. Skill Marketplace。
25. 语音 Agent 支持。
26. 合规策略库。
27. A/B 测试。
28. 自动知识生成与人审。
29. 线上 replay 对比。
30. 企业私有化与模型可替换。
