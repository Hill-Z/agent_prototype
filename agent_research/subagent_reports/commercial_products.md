# 商业 Agent 产品与商业化/UX 深度调研

> 子研究员 A2 报告  
> 主题：主流商业 Agent 产品、平台商业化与 UX/配置范式  
> 调研日期：2026-06-30  
> 证据优先级：官方官网 / 官方文档 / 官方博客 / 官方价格页优先；第三方资料仅作辅助，不作为核心结论依据。  
> 用途：为 UAgent / 企业客服 Agent 平台的下一代产品设计提供可落地参考。

## 0. 执行摘要

商业 Agent 产品正在分化为 5 类主路径：

1. **个人通用执行 Agent**：ChatGPT Agent / Operator、Claude、Gemini。核心卖点是“替用户完成跨网页/文件/工具任务”，商业化依附个人订阅和企业席位。
2. **开发者与研发 Agent**：Claude Code、OpenAI Agents SDK、Google ADK、GitHub/Copilot 生态。核心卖点是“代码库理解 + 工具执行 + 可审计自动化”，商业化依附高阶订阅、API 用量和企业安全。
3. **企业知识与流程 Agent 平台**：Google Agentspace / Gemini Enterprise、Microsoft Copilot Studio、Salesforce Agentforce、ServiceNow AI Agents。核心卖点是“连接企业系统、受权限约束、可治理、可监控、可嵌入业务流程”。
4. **客服垂直 Agent**：Intercom Fin、Zendesk AI、Salesforce Service Agent、ServiceNow CSM Agent。核心卖点不是“能聊天”，而是“减少人工工单、提升解决率、可交接人工、可按结果计费”。
5. **低代码 / 开发者 Agent 平台**：Dify Cloud、Coze/扣子、火山方舟、阿里云百炼、百度千帆 AppBuilder、腾讯元器/智能体开发平台。核心卖点是“快速编排 Bot/Workflow/知识库/插件/发布渠道”，商业化依附订阅、模型用量、资源包、企业私有化和实施服务。

对 UAgent 的关键判断：

- **应该 copy 的不是某个界面，而是产品骨架**：Agent 创建向导、模板市场、知识库、工具连接器、工作流、测试调试、发布渠道、监控分析、权限治理、人审交接、评测回归。
- **客服 Agent 必须以“业务闭环”组织 IA**：知识命中、意图识别、工具动作、确认/审批、人工交接、工单沉淀、解决率分析，而不是只围绕 Prompt 编辑器。
- **企业客户购买的不是 Agent 数量，而是可控风险下的自动化结果**：权限、审计、回滚、灰度、沙箱、评测、数据隔离、人审策略要成为一等功能。
- **商业化要支持三层模型**：入门订阅降低试用门槛；用量/解决量计费绑定价值；企业版/私有化/实施服务承接大客户。

## 1. 横向产品地图

| 类型 | 代表产品 | 主客户 | 核心场景 | 商业化主轴 | UAgent 可借鉴重点 |
| --- | --- | --- | --- | --- | --- |
| 个人执行 Agent | ChatGPT Agent/Operator、Claude、Gemini | 个人/团队 | 网页操作、文件分析、日程/研究/写作 | 订阅套餐、企业席位 | 自然语言任务入口、可视化执行轨迹、用户确认 |
| 开发者 Agent | Claude Code、OpenAI Agents SDK、Google ADK | 工程团队/平台开发者 | 编码、工具调用、自动化任务 | 高阶订阅、API 用量、企业安全 | 工具权限、trace、可复现任务、技能包 |
| 企业 Agent 平台 | Copilot Studio、Agentspace、Agentforce、ServiceNow AI Agents | 大中型企业 | 内部知识助手、流程自动化、CRM/ITSM/HR | 席位、消息/动作、平台套餐、实施 | 连接器、治理、角色权限、发布渠道 |
| 客服 Agent | Intercom Fin、Zendesk AI、Salesforce Service Agent | 客服/运营团队 | 自动应答、工单分流、人工交接 | 按解决量/自动化量、客服套件 | 解决率、失败兜底、知识质量、人工协同 |
| 低代码 Agent 平台 | Dify、Coze、火山方舟、百炼、千帆、腾讯元器 | 创业团队/开发者/业务部门 | Agent 应用、工作流、知识库、插件、发布 | 订阅、模型 token、资源包、企业版 | 低代码编排、模板、插件市场、快速发布 |

## 2. 产品信息架构的共同范式

主流商业 Agent 平台的 IA 趋同明显，可抽象为 10 个模块：

1. **Workspace / Organization**
   - 团队、成员、角色、环境、计费、审计。
   - 企业产品普遍从 workspace 组织资源，而不是单 Bot 文件夹。

2. **Agent / App 创建**
   - 创建方式：自然语言描述、模板、空白 Agent、导入现有文档/流程。
   - 关键字段：名称、目标、角色、语气、边界、目标渠道、所属业务线。

3. **Instruction / Prompt / Policy**
   - 不只是系统提示词，还包括行为约束、拒答策略、升级人工条件、工具使用规则、品牌语气。

4. **Knowledge / Data Store**
   - 文件、网页、FAQ、帮助中心、数据库、CRM、工单历史。
   - 企业平台强调权限继承、索引更新、引用来源、知识质量。

5. **Tools / Actions / Connectors**
   - API 调用、SaaS 连接器、函数、插件、MCP/外部工具。
   - 成熟平台会把工具参数、认证、权限、审批、失败处理独立建模。

6. **Workflow / Orchestration**
   - 低代码节点、条件分支、人工审批、循环、变量、子流程。
   - 客服场景常见：识别意图 -> 检索知识 -> 收集信息 -> 调接口 -> 确认结果 -> 交接人工。

7. **Test / Debug / Preview**
   - 交互式试聊、工具调用日志、trace、变量观察、提示词版本、失败原因。
   - 高级平台提供评测集、批量回归、离线 replay。

8. **Publish / Channels**
   - Web widget、App、Teams/Slack、WhatsApp/微信、API、网站嵌入、帮助中心。
   - 发布应有环境区分：草稿、测试、灰度、生产、回滚。

9. **Monitor / Analytics**
   - 会话量、解决率、转人工率、知识命中率、工具成功率、成本、延迟、用户满意度。
   - 客服产品必须将“未解决原因”和“知识缺口”回流到知识库。

10. **Governance / Safety / Human-in-the-loop**
    - RBAC、SSO、审计、数据保留、PII、审批、人审阈值、敏感动作二次确认。
    - 企业采购中这是核心，不是附加项。

## 3. 产品逐项调研

### 3.1 OpenAI：ChatGPT Agent / Operator / Custom GPTs / Agents

**商业定位与客户场景**

- ChatGPT 面向个人、团队和企业知识工作者；从问答/写作扩展到文件、数据分析、网页任务和工具执行。
- Operator 是 OpenAI 早期“使用浏览器替用户执行任务”的研究预览，强调让模型与网页 UI 交互。
- Custom GPTs 面向无代码创建者，用自然语言配置专用助手，可添加知识、能力和 Actions。
- Agents SDK / Responses API 面向开发者构建生产 Agent，核心包括工具调用、handoff、guardrails、tracing。

**商业化模式**

- ChatGPT 采用 Free / Plus / Pro / Business / Enterprise 等订阅与企业销售模式；团队/企业版强调更高限额、管理、安全和数据控制。
- Custom GPTs 通过 ChatGPT 套餐和 GPT Store 生态承载，适合形成模板/能力市场。
- Agents SDK 和 OpenAI API 走模型/token/API 用量计费；企业客户另有合规、安全和容量方案。

**产品 IA / UX 机制**

- Custom GPT Builder 的典型流程：描述目标 -> 配置 Instructions -> 上传 Knowledge -> 开启能力/Actions -> 测试 -> 发布。
- Actions 让 GPT 通过 OpenAPI schema 调外部 API；这使“能力”从提示词中解耦出来。
- Agents SDK 把生产 Agent 的核心抽象为 Agent、Tool、Handoff、Guardrail、Tracing，强调可观测性。
- Operator / ChatGPT Agent 的 UX 重点是让用户看到执行过程，并在敏感动作前要求确认。

**Evidence**

- ChatGPT pricing: https://openai.com/chatgpt/pricing/
- OpenAI Operator announcement: https://openai.com/index/introducing-operator/
- Custom GPT / GPTs help center: https://help.openai.com/
- OpenAI Agents SDK docs: https://developers.openai.com/api/docs/guides/agents
- OpenAI platform pricing: https://openai.com/api/pricing/

**对 UAgent 的启发**

- Copy：
  - “自然语言创建 Agent + 可编辑结构化配置”的双入口。
  - Actions/API schema 机制，让业务能力可配置、可测试、可授权。
  - Trace / guardrail / handoff 作为平台级能力，而非开发者自己拼日志。
  - 发布前 Preview + 敏感动作二次确认。
- 不要 copy：
  - 不要把 GPT Store 式泛化市场作为客服平台早期重点；客服客户更需要可控模板和行业方案。
  - 不要让“系统提示词”成为主要配置界面。客服 Agent 需要意图、知识、工具、交接、质检的结构化配置。

### 3.2 Anthropic：Claude / Claude Code / Claude Skills

**商业定位与客户场景**

- Claude 面向个人、团队和企业知识工作；以长上下文、推理、安全和写作/分析体验为主要卖点。
- Claude Code 面向工程团队，在终端/IDE 中理解代码库、执行命令、修改文件、运行测试。
- Claude Skills 是把可复用能力打包成技能目录/指令/脚本，供 Claude 在任务中调用，适合把“专家工作流”模块化。

**商业化模式**

- Claude 采用 Free / Pro / Max / Team / Enterprise 等订阅与企业销售；企业版强调管理、安全、SSO、审计、数据控制。
- Claude Code 能力随 Claude 订阅和 Anthropic API/企业方案承载；高频开发使用通常需要更高阶套餐或企业容量。
- Skills 是生态和能力复用机制，可成为企业内部技能库。

**产品 IA / UX 机制**

- Claude Code 的关键体验不是低代码画布，而是“Agent 在真实工程上下文中执行，并要求验证”。
- Skills 把复杂领域能力拆成可发现、可调用、可维护的包：说明文档 + 脚本 + 模板 + 资源。
- Claude 企业能力强调连接企业数据源、权限、合规和团队管理。

**Evidence**

- Claude pricing: https://www.anthropic.com/pricing
- Claude Code docs: https://docs.anthropic.com/en/docs/claude-code/overview
- Anthropic Skills docs/help: https://support.anthropic.com/
- Anthropic API docs: https://docs.anthropic.com/

**对 UAgent 的启发**

- Copy：
  - “技能包/能力包”概念：把行业 FAQ 处理、退款、预约、售后、投诉升级等做成可安装模板。
  - 每个技能包包含说明、输入输出、工具依赖、测试用例、回滚说明。
  - 对复杂任务展示执行计划、文件/工具修改、验证结果。
- 不要 copy：
  - 不要把研发 Agent 的终端式 UX 直接迁移给客服运营。客服运营更需要表单、流程、案例和指标。

### 3.3 Google：Gemini / Agentspace / Gemini Enterprise / Vertex AI Agent Builder

**商业定位与客户场景**

- Gemini 覆盖个人助手和 Workspace 办公场景。
- Agentspace / Gemini Enterprise 面向企业“统一搜索 + 专家 Agent + 企业数据连接 + 工作流自动化”。
- Vertex AI Agent Builder 面向开发者/企业构建检索增强、对话、Agent 和搜索应用。
- Google ADK 面向开发者构建多 Agent、工具调用和可部署应用。

**商业化模式**

- Gemini Enterprise/Agentspace 通常以企业 SaaS 席位/套餐销售。
- Vertex AI Agent Builder 与 Vertex AI 资源、搜索、模型调用、数据存储等云用量绑定。
- Google Cloud 生态通过云用量、企业合同、专业服务、合作伙伴集成变现。

**产品 IA / UX 机制**

- Agent 创建与企业搜索结合：先连接企业数据，再让 Agent 在权限范围内回答和执行。
- 数据连接器是核心资产：Drive、Gmail、Docs、Cloud Storage、BigQuery、第三方 SaaS。
- Vertex AI Agent Builder 强调 data store、tools、extensions、conversation/search app、部署和评估。

**Evidence**

- Google Agentspace product page: https://cloud.google.com/products/agentspace
- Gemini Enterprise / Google Cloud AI agents: https://cloud.google.com/products/gemini-enterprise
- Vertex AI Agent Builder docs: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder
- Vertex AI pricing: https://cloud.google.com/vertex-ai/pricing
- Google ADK docs: https://google.github.io/adk-docs/

**对 UAgent 的启发**

- Copy：
  - 企业知识入口优先做“连接源 + 权限继承 + 引用答案”。
  - 把 Agent 和 Search/RAG 作为同一产品栈，而不是两个孤立模块。
  - 面向管理员提供数据源状态、索引时间、权限同步、知识质量报告。
- 不要 copy：
  - 不要过早做过宽的企业搜索平台。UAgent 应先围绕客服场景，把帮助中心、工单、CRM、订单、售后系统打透。

### 3.4 Microsoft Copilot Studio

**商业定位与客户场景**

- Copilot Studio 是微软企业低代码 Agent 平台，面向业务用户和 IT 管理员创建 Copilot/Agent。
- 场景覆盖员工助手、客服、IT/HR 自动化、Teams/Microsoft 365 内嵌 Agent、企业流程自动化。

**商业化模式**

- 采用订阅/消息包/企业授权模式，与 Microsoft 365、Power Platform、Azure、Dynamics 生态联动。
- 价值锚点是“在现有 Microsoft 企业环境中创建、发布和治理 Agent”。

**产品 IA / UX 机制**

- 创建 Agent：描述目标、选择知识源、配置主题/topics、actions、channels。
- 知识源：SharePoint、OneDrive、网站、Dataverse、文件、第三方连接器。
- Actions：Power Automate、连接器、插件、API。
- 发布：Teams、网站、Copilot、渠道嵌入。
- 治理：环境、DLP、权限、安全、审计、分析。

**Evidence**

- Copilot Studio product/pricing: https://www.microsoft.com/en-us/microsoft-copilot/microsoft-copilot-studio
- Copilot Studio docs overview: https://learn.microsoft.com/en-us/microsoft-copilot-studio/
- Publish channels docs: https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-fundamentals-publish-channels
- Knowledge docs: https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio
- Analytics docs: https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview

**对 UAgent 的启发**

- Copy：
  - Agent 生命周期完整：创建、配置、测试、发布、分析、治理。
  - 用“知识 + Topics/Intent + Actions + Channels”组织 IA，业务用户容易理解。
  - 渠道发布作为一等功能，而不是部署文档。
  - 管理员视角的 DLP、环境和权限。
- 不要 copy：
  - 不要复刻 Power Platform 式复杂生态入口。UAgent 需要更轻的客服专用默认路径。

### 3.5 Salesforce Agentforce

**商业定位与客户场景**

- Agentforce 面向 CRM 场景：销售、服务、营销、商务、数据云上的业务 Agent。
- 核心客户是已经使用 Salesforce 的企业；Agent 与 CRM 数据、流程、权限深度绑定。
- Service Agent 是客服自动化重点产品，强调回答客户、执行服务流程、升级人工。

**商业化模式**

- 采用企业 SKU、按会话/动作/用量或 Flex Credits 等方式组合销售。
- Agentforce 的商业化重心在 CRM 平台增购、Data Cloud、行业云、实施服务和合作伙伴生态。

**产品 IA / UX 机制**

- Agent Builder 通常围绕 topic、instruction、action、data、channel、testing、deployment。
- Actions 可绑定 Flow、Apex、API、Prompt Template 等 Salesforce 原生资产。
- 强调 Trust Layer、权限、审计、数据接地、人工交接。
- Trailhead 和模板降低学习成本。

**Evidence**

- Agentforce pricing: https://www.salesforce.com/agentforce/pricing/
- Agentforce product page: https://www.salesforce.com/agentforce/
- Agentforce help/docs: https://help.salesforce.com/
- Agentforce Trailhead: https://trailhead.salesforce.com/
- Salesforce Einstein Trust Layer: https://www.salesforce.com/artificial-intelligence/einstein-trust-layer/

**对 UAgent 的启发**

- Copy：
  - 客服 Agent 要内嵌客户资料、订单、工单、服务流程，而不是只接知识库。
  - “Topic + Action”结构适合客服：每类问题有边界、可用动作和升级规则。
  - 信任层要产品化：数据脱敏、引用、权限、审计、敏感动作确认。
- 不要 copy：
  - 不要依赖单一大型 CRM 生态锁定。UAgent 应用连接器方式兼容多 CRM/工单/电商平台。

### 3.6 ServiceNow AI Agents

**商业定位与客户场景**

- ServiceNow AI Agents 面向企业工作流：ITSM、CSM、HR、采购、安全运营等。
- 核心卖点是让 Agent 在 ServiceNow workflow 和企业记录系统中执行任务。

**商业化模式**

- 与 Now Platform、Now Assist、Pro/Enterprise 套餐、行业解决方案和实施服务绑定。
- 通常面向大企业销售，价格依赖模块、席位、用量和合同。

**产品 IA / UX 机制**

- AI Agent Studio / Now Assist 组织 Agent 能力、技能、流程、数据和审批。
- 强调在既有工作流中让 Agent 协作，而不是孤立聊天机器人。
- AI Control Tower 等治理能力面向监控、策略和风险控制。

**Evidence**

- ServiceNow AI Agents: https://www.servicenow.com/products/ai-agents.html
- ServiceNow Now Assist: https://www.servicenow.com/products/now-assist.html
- ServiceNow docs: https://docs.servicenow.com/
- ServiceNow AI Control Tower: https://www.servicenow.com/products/ai-control-tower.html

**对 UAgent 的启发**

- Copy：
  - Agent 应绑定业务对象：ticket、case、customer、order、SLA、assignee。
  - 工作流自动化与人审审批要原生支持。
  - 管控台应跨 Agent 展示风险、成本、失败和自动化收益。
- 不要 copy：
  - 不要做过重 ITSM 平台化。UAgent 要服务客服场景，但保留工作流扩展能力。

### 3.7 Intercom Fin

**商业定位与客户场景**

- Fin 是客服 AI Agent，面向 SaaS、电商、互联网服务团队。
- 卖点是基于企业知识回答客户问题，减少人工客服压力，并能接入 Intercom inbox、帮助中心和工作流。

**商业化模式**

- Intercom 以客服套件订阅 + Fin AI Agent 用量/解决量计费为核心。
- 典型价值锚点是“按解决的问题付费”，比按 seat 更容易和客服 ROI 对齐。

**产品 IA / UX 机制**

- 知识源：帮助中心、网页、PDF、代码片段/内容、外部知识。
- 配置：行为/语气、回答边界、渠道、受众、转人工规则。
- Actions / Workflows：收集信息、调用外部系统、创建 ticket、路由。
- Analytics：解决率、参与率、转人工、未解决问题、知识缺口。

**Evidence**

- Intercom pricing: https://www.intercom.com/pricing
- Fin AI Agent product page: https://www.intercom.com/fin
- Intercom Fin help docs: https://www.intercom.com/help/en/collections/2094062-fin-ai-agent
- Fin AI Engine / knowledge: https://www.intercom.com/fin-ai-engine

**对 UAgent 的启发**

- Copy：
  - “按解决量/有效自动化”作为客服 Agent 商业化锚点。
  - 未解决问题 -> 知识缺口 -> 建议补充知识的闭环。
  - 运营可读的指标优先：解决率、转人工率、节省工时、CSAT。
  - 人工交接必须保留上下文和 Agent 尝试路径。
- 不要 copy：
  - 不要只绑定自家 inbox。UAgent 需要从第一天支持多渠道客服入口。

### 3.8 Zendesk AI / AI Agents

**商业定位与客户场景**

- Zendesk AI 面向客服套件客户，提供 AI agents、agent copilot、知识建议、工单分类、智能路由。
- AI Agents 面向自动解决客户问题，Advanced AI 面向更高阶自动化和洞察。

**商业化模式**

- Zendesk 以 Support Suite 套餐、AI add-on、自动化/解决量相关计费组合销售。
- 适合已有 Zendesk 客户增购。

**产品 IA / UX 机制**

- 与 Help Center、ticket、messaging、routing、macro、agent workspace 深度集成。
- AI Agent 配置围绕品牌、知识、意图、回答、handoff、渠道。
- 分析强调自动化率、工单量、客户满意度、人工效率。

**Evidence**

- Zendesk pricing: https://www.zendesk.com/pricing/
- Zendesk AI product page: https://www.zendesk.com/ai/
- Zendesk AI agents: https://www.zendesk.com/service/ai-agents/
- Zendesk support docs: https://support.zendesk.com/

**对 UAgent 的启发**

- Copy：
  - 客服平台应把 AI Agent 和人工工作台放在同一闭环，而不是两个产品。
  - 工单分类、摘要、建议回复、知识推荐是 Agent 之外的高价值辅助功能。
  - 客服主管需要团队级报表，不只看单 Agent 日志。
- 不要 copy：
  - 不要只围绕传统 ticket 模式；新一代 UAgent 应同时支持即时消息、语音、邮件、社媒、电商 IM。

### 3.9 Dify Cloud

**商业定位与客户场景**

- Dify 是开源 + 云服务的 LLM 应用开发平台，面向开发者、创业团队和企业内部 AI 应用团队。
- 场景覆盖 Chatbot、Agent、Workflow、RAG、文本生成、API 后端。

**商业化模式**

- Dify Cloud 采用免费/专业/团队/企业等订阅，结合消息数、成员数、应用数、知识库容量、模型调用、企业支持。
- 开源版本促进生态，企业版/云版承接商业化。

**产品 IA / UX 机制**

- 应用类型：Chatbot、Agent、Workflow、Text Generator 等。
- 编排：Prompt、变量、知识库、工具、工作流节点。
- 知识库：数据集、分段、嵌入、检索、引用。
- 工具/插件：内置工具、第三方工具、API 工具。
- 监控：日志、标注、用户反馈、数据分析。
- 发布：WebApp、API、嵌入。

**Evidence**

- Dify pricing: https://dify.ai/pricing
- Dify docs: https://docs.dify.ai/
- Application orchestration docs: https://docs.dify.ai/en/guides/application-orchestrate
- Workflow docs: https://docs.dify.ai/en/guides/workflow
- Knowledge docs: https://docs.dify.ai/en/guides/knowledge-base

**对 UAgent 的启发**

- Copy：
  - 多应用类型入口：客服 Bot、工作流 Agent、内部助手、API Agent。
  - 工作流画布适合复杂客服流程，但必须提供行业模板降低门槛。
  - 日志、标注、反馈是低成本评测闭环。
  - 开源/私有化是企业信任和生态加速器。
- 不要 copy：
  - 不要让节点画布成为唯一入口。客服运营更需要“场景模板 + 表单化配置 + 高级模式”。

### 3.10 Coze / 扣子

**商业定位与客户场景**

- Coze/扣子是面向开发者和业务用户的 Agent/Bot 创建平台，强调低门槛创建、插件、工作流、知识库和多渠道发布。
- 海外 Coze 和国内扣子在生态、模型、渠道和商业化上有所差异；国内更强调抖音/飞书/微信等本地生态渠道。

**商业化模式**

- 采用免费额度、资源/credit、团队/空间、企业服务、插件/生态等组合。
- 国内平台常与模型调用、云资源、企业定制和渠道生态绑定。

**产品 IA / UX 机制**

- Bot 创建：Persona/Prompt、Skills/插件、Knowledge、Workflow、Memory、Variables。
- 工作流：节点式编排，支持大模型、代码、插件、条件分支、消息处理。
- 发布渠道：网页、API、Discord/Telegram/Slack、飞书/微信公众号等视区域而定。
- Marketplace：模板、插件、工作流、Bot 分发。

**Evidence**

- Coze docs: https://www.coze.com/docs/welcome
- Coze product: https://www.coze.com/
- 扣子官网: https://www.coze.cn/
- 扣子文档: https://www.coze.cn/docs/

**对 UAgent 的启发**

- Copy：
  - 模板、插件、工作流、知识库组合成“低代码 Agent 标准件”。
  - 新手向导要能 5 分钟发布一个可用 Agent。
  - Marketplace 可先做内部模板库，后做生态市场。
  - 多渠道发布能力对客服产品至关重要。
- 不要 copy：
  - 不要走泛娱乐/泛 Bot 社区路线。UAgent 应聚焦企业客服可信、可运营、可治理。

### 3.11 火山引擎：火山方舟 / 智能体与应用开发

**商业定位与客户场景**

- 火山方舟是字节系大模型服务平台，面向企业和开发者提供模型调用、模型精调、知识库、应用/智能体构建和评测等能力。
- 场景包括企业知识助手、客服、营销内容、办公自动化、行业应用。

**商业化模式**

- 主要按模型调用 token、资源包、平台能力、企业合同、私有化/专属资源和实施服务变现。
- 与字节生态、云资源、模型矩阵和行业解决方案绑定。

**产品 IA / UX 机制**

- 典型能力包括模型广场、应用创建、知识库/RAG、插件/工具、工作流、评测、监控。
- 国内云平台普遍强调“模型服务 + 应用开发平台 + 企业部署”的一体化。

**Evidence**

- 火山方舟产品页: https://www.volcengine.com/product/ark
- 火山引擎文档: https://www.volcengine.com/docs
- 火山引擎定价中心: https://www.volcengine.com/pricing

**对 UAgent 的启发**

- Copy：
  - 模型接入和应用编排要解耦：允许客户换模型、做 A/B、做成本控制。
  - 评测和监控应与模型/知识/Agent 配置联动。
  - 企业客户需要资源隔离、专属模型、私有部署选项。
- 不要 copy：
  - 不要把 UAgent 变成泛模型云控制台。客服场景必须有更短的业务路径。

### 3.12 阿里云百炼 Model Studio

**商业定位与客户场景**

- 阿里云百炼是面向企业和开发者的一站式大模型应用开发平台，依托通义模型和阿里云生态。
- 场景包括智能体应用、企业知识问答、客服、办公、营销、数据分析。

**商业化模式**

- 以模型调用、资源包、平台服务、企业版、私有化和阿里云整体云资源消费为主。
- 对阿里云客户具有云账户、RAM 权限、日志、对象存储、数据库等生态优势。

**产品 IA / UX 机制**

- 常见模块：模型选择、应用/智能体创建、Prompt、知识库、插件/工具、工作流、评测、发布/API。
- 强调企业级权限、安全、云产品连接和模型服务管理。

**Evidence**

- 阿里云百炼产品/控制台入口: https://bailian.console.aliyun.com/
- 百炼官方文档: https://help.aliyun.com/zh/model-studio/
- 阿里云定价中心: https://www.aliyun.com/price

**对 UAgent 的启发**

- Copy：
  - 对接客户现有云资源和权限体系，降低企业采购阻力。
  - 应用开发与 API 发布双路径：业务人员配置，工程人员集成。
  - 提供知识库质量、召回测试和模型评测入口。
- 不要 copy：
  - 不要让控制台云产品术语淹没客服运营。UAgent 的主导航应以业务结果命名。

### 3.13 百度智能云千帆 AppBuilder / AgentBuilder

**商业定位与客户场景**

- 千帆是百度智能云的大模型平台，AppBuilder/AgentBuilder 面向企业 AI 原生应用和智能体开发。
- 场景包括知识问答、客服、办公助手、行业流程、搜索增强应用。

**商业化模式**

- 模型调用、应用服务、企业合同、专属资源、私有化部署和行业方案。
- 与百度云、文心模型、搜索/RAG 能力结合。

**产品 IA / UX 机制**

- 典型能力包括组件化应用搭建、知识库、工具/插件、工作流、API 发布、评测和监控。
- 百度系优势在搜索、文档解析、中文知识处理和企业云服务。

**Evidence**

- 百度智能云千帆产品: https://cloud.baidu.com/product/wenxinworkshop
- AppBuilder 文档: https://cloud.baidu.com/doc/AppBuilder/
- 百度智能云定价: https://cloud.baidu.com/doc/Price/index.html

**对 UAgent 的启发**

- Copy：
  - 中文客服知识库需要强化文档解析、FAQ 生成、相似问聚类和搜索召回。
  - 用组件化能力降低工程接入成本。
  - 为客户提供“从历史工单生成知识/流程”的迁移工具。
- 不要 copy：
  - 不要只强调模型能力。客服客户更关心工单减少、解决率、人工效率。

### 3.14 腾讯元器 / 腾讯云智能体开发平台

**商业定位与客户场景**

- 腾讯元器面向个人、开发者和企业创建智能体，强调腾讯生态渠道和低代码创建。
- 腾讯云智能体开发平台面向企业级应用开发，结合模型、知识库、插件、工作流、API 和渠道。
- 场景包括微信生态客服、企业微信助手、知识问答、营销、办公。

**商业化模式**

- 免费额度/资源包、模型调用、企业版、腾讯云资源、私有化与生态渠道服务。
- 微信、企微、腾讯会议/文档等生态入口是商业化杠杆。

**产品 IA / UX 机制**

- Agent/Bot 创建、角色设定、知识库、插件、工作流、多渠道发布。
- 国内生态产品特别重视微信公众号、小程序、企微、网页和 API 发布。

**Evidence**

- 腾讯元器官网: https://yuanqi.tencent.com/
- 腾讯云 AI / 智能体相关产品入口: https://cloud.tencent.com/product/
- 腾讯云文档中心: https://cloud.tencent.com/document
- 腾讯云定价中心: https://cloud.tencent.com/pricing

**对 UAgent 的启发**

- Copy：
  - 国内客服产品必须把微信、企微、小程序、抖音、快手、电商平台 IM 作为核心渠道。
  - 发布渠道配置应有渠道差异化策略：欢迎语、菜单、人工入口、敏感词、营业时间。
  - 企业微信/微信客服场景要支持组织权限和客户标签。
- 不要 copy：
  - 不要把渠道生态绑定成平台锁定。UAgent 应做多渠道统一运营层。

## 4. 商业化模式拆解

### 4.1 主流计费维度

| 计费维度 | 代表产品 | 优点 | 风险 | UAgent 建议 |
| --- | --- | --- | --- | --- |
| 个人/团队订阅 | ChatGPT、Claude、Dify、Coze | 易理解，低门槛 | 与客服 ROI 弱绑定 | 作为试用/小团队套餐 |
| 企业席位 | Google、Microsoft、Salesforce、ServiceNow | 适合企业采购 | 客服自动化价值不完全按 seat 体现 | 管理员/人工客服/运营席位可采用 |
| 消息数 / token / 调用量 | OpenAI API、云厂商、Dify | 成本可控，和模型消耗匹配 | 客户难预估，可能抑制使用 | 作为底层成本维度，不宜唯一对外 |
| 解决量 / 自动化结果 | Intercom Fin、Zendesk AI 倾向 | 和客服 ROI 强绑定 | 需要定义“解决”并防争议 | UAgent 应重点采用 |
| Agent 数 / 工作流数 / 知识容量 | Dify、低代码平台 | 易做套餐分层 | 容易人为限制价值 | 可用于套餐边界，但不要太碎 |
| 企业版 / 私有化 | Dify、国内云、Salesforce、ServiceNow | 高客单价，满足合规 | 交付和运维成本高 | 针对中大型客户必备 |
| Marketplace / 插件生态 | GPTs、Coze、Salesforce、Microsoft | 生态扩展 | 早期质量难控 | 先做官方模板库，后开放生态 |
| 实施服务 / 行业方案 | Salesforce、ServiceNow、国内云 | 大客户落地关键 | 非标交付膨胀 | 产品化实施包和迁移工具 |

### 4.2 UAgent 推荐商业化分层

1. **Starter / Trial**
   - 目标：让客户 1 天内接入一个渠道、导入知识库、跑起来。
   - 限制：坐席数、消息量、知识库容量、渠道数、仅标准模型。
   - 不限制：核心 Agent 创建、基础监控、人工交接。

2. **Growth**
   - 目标：中小客服团队正式使用。
   - 包含：多渠道、知识库自动优化、工作流、CRM/工单连接器、基础评测、解决率报表。
   - 计费：订阅 + 超额消息/解决量。

3. **Business**
   - 目标：多团队、多业务线运营。
   - 包含：多 Agent、多环境、灰度发布、权限、审计、SLA、Webhook/API、A/B 测试。
   - 计费：平台费 + 自动解决量 + 人工席位。

4. **Enterprise**
   - 目标：大客户、金融/医疗/政企。
   - 包含：SSO、SCIM、私有化/VPC、专属模型、数据隔离、审批流、合规审计、专属实施。
   - 计费：合同价 + 用量包 + 实施服务。

5. **Marketplace / Solution Packs**
   - 先做官方行业包：电商售后、SaaS 支持、教育咨询、物业/本地生活、金融非敏感咨询。
   - 后开放第三方插件/模板，但必须有安全审核和质量评分。

## 5. UX 与配置体验模式

### 5.1 创建 Agent：从“空白 Prompt”改为“目标驱动向导”

优秀平台共同点：

- 先问业务目标，不先问系统提示词。
- 让用户选择场景模板：售前咨询、订单查询、退款退货、故障排查、预约、投诉升级。
- 自动生成初始配置：角色、语气、知识源、意图、工具、交接规则、测试用例。
- 提供高级模式给工程团队改 Prompt、API schema 和工作流。

UAgent 建议创建向导：

1. 选择行业和渠道。
2. 选择目标：降低转人工、提升响应速度、支持订单查询、售后处理等。
3. 导入知识：帮助中心、FAQ、历史工单、商品/订单字段说明。
4. 选择能力：查订单、查物流、创建工单、退款申请、预约、优惠券。
5. 选择交接规则：敏感问题、低置信度、用户要求人工、重复失败、VIP 客户。
6. 生成测试集：常见问法、边界问法、攻击问法、工具失败场景。
7. 预览并发布到沙箱。

### 5.2 工具/连接器：从“API 配置”改为“业务动作”

多数平台的问题是工具配置偏工程化。客服运营需要看到：

- 动作名称：查询订单、修改地址、创建退货单。
- 输入：手机号、订单号、用户 ID。
- 权限：是否需登录、是否需人工审批、是否限制角色。
- 风险等级：只读、低风险写入、高风险交易。
- 失败处理：重试、解释、交接人工、创建工单。
- 用户确认：执行前展示将要做什么。

UAgent 应把 API schema 包装为业务动作卡片，并保留工程高级配置。

### 5.3 知识库：从“上传文件”改为“知识运营”

客服 Agent 的知识库不是静态 RAG：

- 需要知识源健康度：最近同步时间、失败文档、权限异常。
- 需要知识质量：缺标题、过期、冲突、重复、低命中。
- 需要会话反馈：未解决问题聚类、用户追问聚类、人工修正建议。
- 需要答案引用：让客服主管知道 Agent 依据哪篇知识回答。
- 需要变更流程：草稿、审核、发布、回滚。

UAgent 应把“知识运营”作为一级导航，而不是隐藏在 Agent 设置里。

### 5.4 测试调试：从“试聊”改为“回归评测”

商业平台成熟度差异最大的地方在评测：

- 新手平台只给试聊窗口。
- 成熟平台提供日志、trace、工具调用、用户反馈。
- 顶级企业平台需要离线评测集、回归测试、版本对比、灰度监控。

UAgent 最小可行评测体系：

1. 单轮试聊：展示命中意图、召回知识、工具调用、置信度、交接原因。
2. 用例集：从历史工单和人工标注生成。
3. 发布前门禁：核心用例通过率、拒答准确率、敏感问题通过率、工具成功率。
4. 线上监控：失败样本自动入库。
5. 版本对比：新旧 Agent 在同一批用例上的差异。

### 5.5 发布与回滚：从“复制 embed code”改为“环境化发布”

企业客户需要：

- Draft / Sandbox / Staging / Production。
- 渠道级配置：欢迎语、菜单、营业时间、人工入口、身份验证、语言。
- 灰度：按渠道、用户标签、比例、地区、业务线。
- 回滚：回到上一版本，包括 Prompt、知识索引版本、工具配置、工作流。
- 审批：高风险 Agent 或高风险动作上线前需要审批。

UAgent 应避免“保存即上线”的危险体验。

### 5.6 监控分析：从“消息统计”改为“客服 ROI 看板”

客服主管关心：

- 自动解决率。
- 转人工率。
- 平均响应时间。
- 用户满意度。
- 重复咨询率。
- 工单减少量。
- 高风险失败。
- 知识缺口。
- 工具失败率。
- 模型成本 / 每解决成本。

UAgent 报表应按角色分层：

- 运营：问题类型、知识缺口、话术质量。
- 主管：解决率、CSAT、转人工、队列压力。
- 管理员：成本、权限、渠道、错误、SLA。
- 工程：trace、工具失败、延迟、API 错误。

## 6. UAgent 应该 copy 的产品能力

### 6.1 一级 IA 建议

建议 UAgent 一级导航：

1. **Dashboard**
   - 解决率、转人工、成本、异常、待处理优化项。

2. **Agents**
   - Agent 列表、状态、渠道、版本、负责人、目标指标。

3. **Scenarios**
   - 意图/topic 管理：售前、售后、退款、订单、投诉、技术支持。

4. **Knowledge**
   - 知识源、文档、FAQ、冲突检测、缺口分析、审核发布。

5. **Actions**
   - 业务动作、API、连接器、权限、审批、测试。

6. **Workflows**
   - 复杂流程编排：收集信息、分支、工具、人审、工单。

7. **Channels**
   - Web、App、微信、企微、邮件、WhatsApp、飞书、钉钉、电商 IM。

8. **Test & Evaluation**
   - 试聊、测试集、回归、红队、安全、版本对比。

9. **Inbox / Handoff**
   - 人工接管、上下文摘要、Agent 失败原因、建议回复。

10. **Analytics**
    - ROI、会话、主题、知识、工具、人员效率。

11. **Governance**
    - 权限、审计、SSO、环境、数据保留、安全策略。

12. **Marketplace / Templates**
    - 行业模板、动作包、渠道包、知识模板、评测集。

### 6.2 Agent 创建模板

首批模板建议：

- 电商售前导购 Agent。
- 订单/物流查询 Agent。
- 退换货处理 Agent。
- SaaS 技术支持 Agent。
- 预约/改期 Agent。
- 投诉安抚与升级 Agent。
- 企业内部 IT Helpdesk Agent。
- HR 政策问答 Agent。

每个模板必须包含：

- 目标指标。
- 默认意图。
- 推荐知识源。
- 推荐动作。
- 交接规则。
- 测试用例。
- 禁止事项。
- 上线检查清单。

### 6.3 Agent 配置对象模型

UAgent 应把 Agent 拆成可版本化对象：

```text
Agent
  - profile: name, description, owner, business_goal, tone
  - policies: refusal, escalation, confirmation, compliance
  - scenarios/topics: intent definitions, examples, boundaries
  - knowledge_bindings: sources, filters, permission scope
  - actions: tools, auth, risk level, schemas, approval
  - workflows: flow definitions, branches, variables
  - channels: channel-specific behavior
  - evaluation: test suites, thresholds, red-team cases
  - deployment: environment, version, rollout, rollback
  - monitoring: metrics, alerts, feedback loop
```

这个结构比“一个 prompt + 一个知识库 + 一个 API key”更适合企业客服落地。

## 7. UAgent 不应该 copy 的模式

1. **泛 Bot 社区优先**
   - 风险：吸引大量低质量 Agent，偏娱乐和试验，弱化企业可信形象。
   - 替代：先做官方行业模板库和企业内部模板库。

2. **只做 Prompt 编辑器**
   - 风险：业务不可控，难测试，难交接新人 PM/运营。
   - 替代：结构化配置 + 高级 Prompt 模式。

3. **只按 token 计费**
   - 风险：客户无法和业务价值关联，采购阻力高。
   - 替代：订阅 + 自动解决量 + 企业用量包。

4. **保存即上线**
   - 风险：客服事故、错误退款、错误承诺、品牌风险。
   - 替代：环境、审批、评测门禁、灰度、回滚。

5. **把工作流画布暴露给所有用户**
   - 风险：新手 PM/客服运营学习成本高。
   - 替代：模板/表单优先，画布作为高级模式。

6. **只看会话数，不看解决质量**
   - 风险：Agent 看似活跃但没有解决问题。
   - 替代：解决率、转人工、复问率、满意度、知识缺口。

7. **渠道作为后置集成**
   - 风险：客服场景无法上线。
   - 替代：渠道是 Agent 设计的一部分，不同渠道有不同约束。

8. **缺少人工协同**
   - 风险：客服 Agent 无法兜底，人工看不到上下文。
   - 替代：原生 inbox/handoff、摘要、失败原因、建议下一步。

## 8. 可落地功能清单

### P0：从 0 搭建顶级客服 Agent 的最低闭环

- Agent 创建向导：行业、目标、渠道、知识、动作、交接。
- 知识库：导入帮助中心/文件/FAQ，引用答案，基础同步状态。
- 业务动作：至少支持 HTTP API 动作，带测试、鉴权、风险等级、失败处理。
- 场景/topic：定义常见意图、示例问法、边界和交接条件。
- 试聊调试：展示知识命中、工具调用、最终答案、交接原因。
- 发布渠道：Web widget/API 至少一个；国内产品应尽快加企微/微信客服。
- 人工交接：保留上下文摘要、用户信息、Agent 尝试路径。
- 基础报表：会话量、自动解决、转人工、未解决问题。
- 版本管理：草稿/上线版本、回滚。

### P1：商业化和企业可用

- 多团队 workspace、RBAC、审计日志。
- 多环境：sandbox/staging/production。
- 评测集：从历史会话生成测试用例，发布前跑回归。
- 灰度发布：按渠道/用户标签/比例。
- 知识缺口分析：未解决问题聚类、建议新增 FAQ。
- 工具权限：只读/写入/高风险，支持人工审批。
- 连接器：Zendesk、Salesforce、Intercom、飞书、企微、钉钉、Shopify/有赞/微盟等。
- 成本看板：模型成本、每解决成本、渠道成本。

### P2：差异化与规模化

- 行业方案包：电商、SaaS、教育、金融咨询、政务热线。
- Marketplace：模板、动作包、渠道包、评测集。
- 多 Agent 协作：分诊 Agent、订单 Agent、退款 Agent、投诉 Agent。
- 自动知识生成：从工单/聊天记录生成 FAQ，需人审。
- 语音客服 Agent：ASR/TTS、打断、转人工、质检。
- 合规策略：PII 识别、敏感承诺拦截、行业规则库。
- Agent Copilot：给人工客服建议回复、摘要、下一步动作。

## 9. 设计原则

1. **从业务结果设计，而不是从模型能力设计**
   - 客服客户要的是解决率、少转人工、少投诉、低成本。

2. **默认可控，逐步自动化**
   - 只读问答先上线；低风险动作后上线；高风险动作加人审。

3. **每个 Agent 都必须可测试、可回滚、可解释**
   - 没有评测和版本控制的 Agent 不应进入生产。

4. **知识、动作、流程分离**
   - 知识负责回答，动作负责执行，流程负责业务状态，Prompt 负责策略整合。

5. **运营闭环比创建体验更重要**
   - 创建很快不等于长期可用；知识缺口、失败分析、人工反馈是持续优化核心。

6. **渠道差异是一等约束**
   - Web、微信、邮件、语音、电商 IM 的身份、消息格式、时效和人工入口不同。

7. **把高级能力包装成业务语言**
   - 不说 function calling，给运营看“查询订单”。
   - 不说 RAG chunk，给运营看“引用了哪篇知识，是否过期”。
   - 不说 trace span，给主管看“为什么转人工”。

8. **企业治理不是 Enterprise 才开始**
   - 从早期就要有版本、审计、权限和发布流程，否则后续补会很痛。

## 10. 证据矩阵

| 产品 | 官方来源 | 覆盖信息 |
| --- | --- | --- |
| OpenAI ChatGPT | https://openai.com/chatgpt/pricing/ | 套餐、个人/团队/企业定位 |
| OpenAI Operator | https://openai.com/index/introducing-operator/ | 浏览器执行 Agent 定位 |
| OpenAI Agents SDK | https://developers.openai.com/api/docs/guides/agents | Agent、工具、handoff、guardrails、tracing |
| Anthropic Claude | https://www.anthropic.com/pricing | 订阅与企业套餐 |
| Claude Code | https://docs.anthropic.com/en/docs/claude-code/overview | 研发 Agent UX、工具执行 |
| Google Agentspace | https://cloud.google.com/products/agentspace | 企业搜索与 Agent |
| Vertex AI Agent Builder | https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder | 开发者 Agent 平台 |
| Microsoft Copilot Studio | https://www.microsoft.com/en-us/microsoft-copilot/microsoft-copilot-studio | 企业低代码 Agent、价格入口 |
| Copilot Studio Docs | https://learn.microsoft.com/en-us/microsoft-copilot-studio/ | 创建、知识、动作、发布、分析、治理 |
| Salesforce Agentforce | https://www.salesforce.com/agentforce/ | CRM Agent 定位 |
| Agentforce Pricing | https://www.salesforce.com/agentforce/pricing/ | 企业计费与商业化入口 |
| ServiceNow AI Agents | https://www.servicenow.com/products/ai-agents.html | 企业工作流 Agent |
| ServiceNow AI Control Tower | https://www.servicenow.com/products/ai-control-tower.html | Agent 治理 |
| Intercom Fin | https://www.intercom.com/fin | 客服 AI Agent |
| Intercom Pricing | https://www.intercom.com/pricing | 客服套件与 Fin 商业化 |
| Zendesk AI | https://www.zendesk.com/ai/ | 客服 AI 套件 |
| Zendesk AI Agents | https://www.zendesk.com/service/ai-agents/ | 客服自动化 Agent |
| Dify | https://dify.ai/pricing | Cloud 套餐 |
| Dify Docs | https://docs.dify.ai/ | 应用、工作流、知识库、发布、监控 |
| Coze | https://www.coze.com/docs/welcome | Bot、插件、知识库、工作流、发布 |
| 扣子 | https://www.coze.cn/ | 国内 Agent 平台 |
| 火山方舟 | https://www.volcengine.com/product/ark | 模型服务与智能体/应用平台 |
| 火山引擎文档 | https://www.volcengine.com/docs | 官方文档入口 |
| 阿里云百炼 | https://help.aliyun.com/zh/model-studio/ | 百炼官方文档 |
| 阿里云定价 | https://www.aliyun.com/price | 云产品价格入口 |
| 百度千帆 | https://cloud.baidu.com/product/wenxinworkshop | 千帆平台 |
| 百度 AppBuilder | https://cloud.baidu.com/doc/AppBuilder/ | AppBuilder 文档 |
| 腾讯元器 | https://yuanqi.tencent.com/ | 智能体创建平台 |
| 腾讯云文档/产品 | https://cloud.tencent.com/document | 腾讯云官方文档入口 |

## 11. 给后续 PM/工程的落地建议

1. 先定义 UAgent 的核心对象模型：Agent、Scenario、KnowledgeSource、Action、Workflow、Channel、Evaluation、Deployment、Handoff。
2. 第一版不要从画布开始，应从客服创建向导和模板开始。
3. 第一版必须支持“知识 + 动作 + 人工交接 + 监控”的闭环，否则只是聊天机器人。
4. 对外商业化文案应避免“最强大模型”，改成“自动解决率、转人工下降、知识缺口闭环、上线可控”。
5. 工程架构上要早做版本化和 trace，否则评测、回滚、审计都会困难。
6. 客服 Agent 的差异化来自运营系统：知识缺口、失败聚类、质检、人工反馈、渠道策略。
7. 国内版渠道优先级应高于泛插件市场：企微/微信客服/公众号/小程序/飞书/钉钉/抖音/电商 IM 是真实落地入口。
8. 企业版从第一天预留：SSO、RBAC、审计、数据隔离、私有化、模型可替换。

## 12. 停止条件与不确定性

本报告已覆盖用户要求的主流商业 Agent 产品/平台，并按产品提供官方来源链接。由于商业定价、套餐额度、模型可用性和地区能力在 2026 年持续变化，具体价格数字不作为长期固定事实；后续正式 PRD 或商业定价设计前，应逐项复核官方价格页和销售条款。

本报告没有把第三方排行榜、媒体评测或非官方传闻作为主要证据；因此对部分国内平台的“具体套餐额度/隐藏企业报价”只给出计费模式判断，不臆造金额。
