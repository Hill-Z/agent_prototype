# 顶级 Agent 产品与架构设计总纲

> 位置：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\agent_design_master_guide.md`  
> 日期：2026-06-30  
> 目标读者：Agent 平台负责人、产品经理、架构师、开发工程师、解决方案工程师  
> 输入来源：3 个子研究报告 + 本地源码/官方文档/用户现有 Skills 观察。

## 1. 一句话结论

顶级 Agent 不是“一个大 Prompt + 一堆工具”，而是一个可配置、可执行、可观测、可评测、可回滚、可商业化的 **Agent Harness 平台**。

真正成熟的 Agent 产品至少包含九层：

```text
业务入口 / 渠道
  -> Agent 配置与版本
  -> 场景 / Topic / Skill 路由
  -> Prompt / Policy / Guardrail
  -> Tool / Action / Connector
  -> Workflow / Graph / Checkpoint
  -> Memory / Session / State
  -> Trace / Event / Replay
  -> Eval / Release Gate / HITL
  -> Analytics / Governance / Commercial Loop
```

对 UAgent 来说，现在最关键的不是继续把 Skills 写长，而是把 Skills 变成平台可治理资产：可生成、可测试、可发布、可监控、可迭代。

---

## 2. 主流 Agent 产品的五条路线

| 路线 | 代表产品 | 核心卖点 | 商业化方式 | 对 UAgent 的启发 |
|---|---|---|---|---|
| 个人通用执行 Agent | ChatGPT Agent / Operator、Claude、Gemini | 替用户跨网页、文件、工具完成任务 | 个人订阅、企业席位 | 执行轨迹、敏感动作确认、自然语言入口 |
| 开发者 Agent | Claude Code、OpenAI Agents SDK、Google ADK、OpenHands | 代码库理解、工具执行、验证闭环 | 高阶订阅、API 用量、企业安全 | Trace、工具权限、Skill 包、沙箱执行 |
| 企业知识与流程 Agent | Copilot Studio、Google Agentspace、Agentforce、ServiceNow | 连接企业数据、受权限治理、嵌入流程 | 席位、消息/动作、企业合同 | Workspace、连接器、治理、发布渠道 |
| 客服垂直 Agent | Intercom Fin、Zendesk AI、Salesforce Service Agent | 自动解决客户问题、减少人工工单 | 按解决量/自动化结果 + 套餐 | 解决率、转人工率、知识缺口、人工交接 |
| 低代码/开发者平台 | Dify、Coze/扣子、火山方舟、阿里百炼、百度千帆、腾讯元器 | 快速编排 Bot、Workflow、知识库、插件、渠道 | 订阅、模型用量、资源包、私有化 | 模板、画布、插件市场、多渠道发布 |

### 2.1 共同趋势

1. **从聊天机器人变成业务自动化 Agent**：客户买的是自动解决率、效率、成本下降，不是“能聊天”。
2. **从 Prompt 配置变成结构化配置**：Agent、Knowledge、Action、Workflow、Channel、Eval、Deployment 分离。
3. **从试聊变成评测/回归**：成熟平台必须支持测试集、离线 replay、版本对比、发布门禁。
4. **从工具调用变成业务动作**：运营看到“查询订单/创建工单/申请退款”，工程看到 API schema。
5. **从上线变成生命周期**：草稿、沙箱、预发、生产、灰度、回滚、审计。
6. **从模型能力变成治理能力**：权限、PII、HITL、审批、数据隔离是企业采购核心。

---

## 3. 开源 Agent / Harness 的架构共识

本次源码深读样本：OpenAI Agents SDK、LangGraph、AutoGen、OpenHands、Qwen-Agent、AgentScope。

| 抽象 | 成熟项目中的表现 | UAgent 应如何产品化 |
|---|---|---|
| Agent | 绑定 instructions/tools/guardrails/handoffs/session | Agent 不只是配置表单，应是可运行对象 |
| Tool / Action | JSON schema、权限、超时、错误、trace、MCP | 工具要有权限、mock、错误恢复、审批 |
| Skill | `SKILL.md + scripts + references + assets` 的能力包 | Skill 要有 manifest、版本、依赖、eval、guardrail |
| Workflow / Graph | 状态图、分支、interrupt、resume、checkpoint | 客服流程不能全塞 Prompt，应有可恢复业务流 |
| Memory / State | session、long-term memory、checkpoint、context compression | 区分会话变量、长期画像、工具结果、流程状态 |
| Trace / Event | tool call、model call、handoff、guardrail 事件流 | 调试、审计、复盘、评测都依赖 trace |
| Guardrail | input/output/tool guardrail，tripwire | 不可只靠提示词，风险策略要系统级执行 |
| Handoff / HITL | interrupt/resume、人工审批、上下文交接 | 客服 Agent 必须原生支持人工接管状态机 |
| Eval | trigger、tool mapping、task success、safety、format | 发布前没有评测，就不应进生产 |

### 3.1 最值得 UAgent 学的开源设计

- **OpenAI Agents SDK**：Agent、Tool、Guardrail、Handoff、Tracing、Session 的边界划分清晰。
- **LangGraph**：状态图、checkpoint、interrupt/resume 是长流程客服 Agent 的底座。
- **AgentScope**：Skill、Workspace、Permission、Event、Session 的平台化程度高。
- **OpenHands**：conversation + sandbox + event store + skill loader 适合学习“产品化运行时”。
- **AutoGen**：多 Agent team / group chat / event 模型值得借鉴，但新项目不宜重依赖其旧主干。
- **Qwen-Agent**：Agent / Tool / Memory / Router 边界简单直观，适合新人学习。

---

## 4. 顶级客服 Agent 的产品对象模型

UAgent 不应继续以“Prompt 页面”为中心，而应以这些对象为中心：

```text
Workspace
  Agent
    Profile            # 名称、目标、负责人、行业、渠道、语气
    Policies           # 拒答、升级、确认、合规、品牌承诺
    Scenarios/Topics   # 售前、订单、退款、投诉等业务场景
    Skills             # 可触发能力包
    KnowledgeBindings  # 知识源、权限、引用、同步策略
    Actions            # 查询订单、创建工单、申请退款等业务动作
    Workflows          # 分支、变量、人审、子流程
    Memory             # 会话变量、长期画像、checkpoint
    Evaluation         # 测试集、红队、回归、发布阈值
    Deployment         # 环境、版本、灰度、回滚、渠道
    Monitoring         # 指标、trace、失败、成本、ROI
```

### 4.1 一级导航建议

1. Dashboard：解决率、转人工、成本、异常、待优化项。
2. Agents：Agent 列表、状态、渠道、版本、负责人、目标指标。
3. Scenarios：意图/topic 管理，定义边界、样例、转人工条件。
4. Knowledge：知识源、文档、FAQ、冲突检测、缺口分析、审核发布。
5. Actions：业务动作、API、连接器、权限、审批、测试。
6. Skills：Skill 包、版本、依赖、评测、发布、市场。
7. Workflows：复杂流程编排、变量、分支、HITL。
8. Channels：Web、App、微信、企微、飞书、钉钉、电商 IM、API。
9. Test & Evaluation：试聊、测试集、回归、安全、版本对比。
10. Inbox / Handoff：人工接管、摘要、失败原因、建议回复。
11. Analytics：ROI、主题、知识、工具、人员效率。
12. Governance：RBAC、审计、SSO、数据保留、合规策略。
13. Marketplace / Templates：行业模板、动作包、渠道包、评测集。

---

## 5. Skill 在平台里的正确位置

### 5.1 Skill 是能力包，不是 Agent 本体

一个 Skill 可以完成“订单查询”“商品推荐”“售后进度”“响应格式化”这样的能力，但完整 Agent 还需要：

- 何时触发 Skill。
- Skill 之间如何冲突/组合。
- 需要哪些变量、工具、权限。
- 失败后如何恢复。
- 高风险动作是否需要人审。
- 输出是否符合渠道格式。
- 上线前是否通过评测。
- 线上效果如何监控。

所以：**写好 Skills 只是做出了 Agent 的能力层，还没做出完整 Agent 产品。**

### 5.2 UAgent 标准 Skill 包结构

```text
skill-id/
  skill.yaml                 # 平台元数据：版本、状态、owner、依赖、权限、发布阈值
  SKILL.md                   # Agent 可读主说明，短、明确、可执行
  prompts/
    routing.md               # 触发/排除/冲突规则
    task.md                  # 主任务执行模板
    reflection.md            # 失败恢复/复核模板
    tool_usage.md            # 工具使用策略
  tools/
    tools.yaml               # 工具清单、schema、权限、超时、mock
    schemas/*.json
    mocks/*.json
  references/
    sop.md
    api.md
    glossary.md
  scripts/
    validate_inputs.py
    render_card.py
  evals/
    evals.json
    grading.json
  guardrails/
    policy.yaml
    output_checks.yaml
  memory/
    schema.yaml
  README.md
```

### 5.3 Skill 生成器不是“生成一个 SKILL.md”

正确流程应该是：

```text
材料输入
  -> 需求抽取
  -> 能力边界确认
  -> Prompt / Tool / Memory 建模
  -> Skill 草稿
  -> Mock / 沙箱执行
  -> Eval 对比
  -> Guardrail / HITL 审核
  -> 发布
  -> 运行观测
  -> 失败日志反哺迭代
```

---

## 6. 顶级 Agent 平台的最小闭环

### 6.1 P0：能上线、可控、可优化

- Agent 创建向导：行业、目标、渠道、知识、动作、交接。
- 知识库：导入帮助中心/文件/FAQ，引用答案，同步状态。
- 业务动作：HTTP API 动作，带鉴权、测试、风险等级、失败处理。
- 场景/topic：定义意图、示例问法、边界和转人工条件。
- Skill Studio：Skill 结构化编辑、版本、依赖、变量、工具映射。
- 试聊调试：展示命中意图、召回知识、工具调用、变量、交接原因。
- 人工交接：保留上下文摘要、用户信息、Agent 尝试路径。
- 发布渠道：Web/API 起步，国内产品尽快接企微/微信客服。
- 版本管理：草稿、上线版本、回滚。
- 基础报表：会话量、自动解决、转人工、未解决问题。

### 6.2 P1：可商业化、可企业采购

- 多 workspace、多环境、RBAC、审计日志。
- 评测集：从历史会话生成测试用例，发布前跑回归。
- 灰度发布：按渠道、用户标签、比例、业务线。
- 工具权限：只读/写入/高风险，支持人工审批。
- 知识缺口分析：未解决问题聚类、建议新增 FAQ。
- 连接器：Zendesk、Salesforce、Intercom、飞书、企微、钉钉、电商平台。
- 成本看板：模型成本、每解决成本、工具成本。

### 6.3 P2：形成壁垒

- 行业方案包：电商、SaaS、教育、金融咨询、政务热线。
- Marketplace：模板、动作包、渠道包、评测集。
- 多 Agent 协作：分诊 Agent、订单 Agent、退款 Agent、投诉 Agent。
- 自动知识生成：从工单/聊天记录生成 FAQ，必须人审。
- 语音客服 Agent：ASR/TTS、打断、转人工、质检。
- 合规策略：PII、敏感承诺、行业规则库。
- Agent Copilot：给人工客服建议回复、摘要、下一步动作。

---

## 7. 商业化建议

### 7.1 不建议只按 token 收费

客服客户不关心 token，关心：

- 自动解决了多少问题。
- 少转了多少人工。
- 响应速度提升多少。
- 投诉和质检风险有没有下降。
- 每解决成本是多少。

### 7.2 推荐套餐

| 套餐 | 目标客户 | 计费建议 | 核心能力 |
|---|---|---|---|
| Starter / Trial | 小团队试用 | 低订阅 + 限量消息 | 单渠道、基础知识库、基础报表 |
| Growth | 中小客服团队 | 订阅 + 超额消息/解决量 | 多渠道、基础动作、知识缺口、工作流 |
| Business | 多业务线团队 | 平台费 + 自动解决量 + 人工席位 | 多环境、灰度、权限、评测、API |
| Enterprise | 大客户/合规行业 | 合同价 + 用量包 + 实施 | SSO、审计、私有化、审批流、专属模型 |
| Solution Packs | 行业方案 | 模板/实施包 | 电商售后、SaaS 支持、教育咨询等 |

### 7.3 最适合 UAgent 的价值锚点

1. 自动解决率。
2. 转人工率下降。
3. 每解决成本。
4. 首响时间。
5. 知识缺口修复速度。
6. 高风险动作零事故。
7. 客服新人上手速度。

---

## 8. 设计原则

1. 从业务结果设计，不从模型能力设计。
2. 默认可控，逐步自动化：只读问答先上线，写操作后上线，高风险动作加人审。
3. 每个 Agent 必须可测试、可回滚、可解释。
4. 知识、动作、流程、Prompt 分离。
5. 高级能力要包装成业务语言。
6. 渠道差异是一等约束。
7. 运营闭环比创建体验更重要。
8. 企业治理不是 Enterprise 才开始，从第一版就要有版本、审计、权限。

---

## 9. 证据与来源

### 本地子报告

- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\subagent_reports\commercial_products.md`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\subagent_reports\opensource_architecture.md`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\subagent_reports\prompt_skill_tool_eval.md`

### 本地源码样本

- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\openai-agents-python`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\langgraph`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\autogen`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\openhands`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\qwen-agent`
- `C:\Users\13609\.codex\workbase\chat_agent\agent_research\sources\agentscope`

### 官方/上游链接

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [LangGraph](https://github.com/langchain-ai/langgraph)
- [AutoGen](https://github.com/microsoft/autogen)
- [OpenHands](https://github.com/OpenHands/OpenHands)
- [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent)
- [AgentScope](https://github.com/agentscope-ai/agentscope)
- [Anthropic Skills](https://github.com/anthropics/skills)
- [Microsoft Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/)
- [Salesforce Agentforce](https://www.salesforce.com/agentforce/)
- [Intercom Fin](https://www.intercom.com/fin)
- [Zendesk AI Agents](https://www.zendesk.com/service/ai-agents/)
- [Dify](https://docs.dify.ai/)
- [Coze](https://www.coze.com/docs/welcome)
- [火山方舟](https://www.volcengine.com/product/ark)
- [阿里云百炼](https://help.aliyun.com/zh/model-studio/)
