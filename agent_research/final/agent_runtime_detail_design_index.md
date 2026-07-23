# Agent Runtime 细节设计规范：总目录与分工

> 文件：`C:\Users\13609\.codex\workbase\chat_agent\agent_research\final\agent_runtime_detail_design_index.md`  
> 目标：把 Agent 平台真正决定效果的运行时细节完整列出，并拆分给 5 个子研究/设计任务做深入方案。  
> 注意：这里讨论的不是“平台有哪些页面”，而是 Agent 每一次运行时每个决策点怎么设计。

---

## 0. 总原则

一个 Agent 平台能否做好，不只取决于有没有 Prompt、Skill、Tool、Knowledge、Workflow，而取决于运行时细节：

- 用户发来消息后的第一秒发生什么。
- 模型是否流式输出，什么时候输出。
- 工具调用慢的时候用户看到什么。
- 多工具是串行还是并行。
- 缺信息时是猜、问、查，还是转人工。
- 记忆什么时候抽取，什么能写入长期记忆。
- 反思什么时候触发，触发后怎么影响回复。
- Guardrail 在哪一步拦截，拦截后怎么修复。
- 上下文怎么拼，怎么防止塞太多。
- 渠道不支持流式/按钮/卡片时怎么降级。
- 线上失败如何变成回归用例。

---

## 1. 完整设计维度目录

### 01. Agent Loop 状态机
定义一次用户请求从进入系统到最终响应/中断/转人工/失败的完整状态流。

### 02. LLM 流式输出策略
定义首 token、分段输出、工具等待文案、最终答案拼接、流式被拦截后的处理。

### 03. Tool 调用等待与进度反馈
定义工具调用前、中、后用户看到什么，以及工具慢、失败、重试时怎么反馈。

### 04. 多工具串并行策略
定义什么时候串行、什么时候并行、依赖关系、先返回结果怎么处理、后返回结果是否补充。

### 05. Intent / Skill / Tool 路由策略
定义用户意图、场景、Skill、Tool 的选择机制、冲突处理、置信度、澄清和评测。

### 06. Planner / Executor 策略
定义复杂任务是否先规划、计划是否展示、计划执行中如何重规划、planner/executor 是否分模型。

### 07. 多模态输入处理策略
定义图片、语音、文件、视频、截图如何解析、OCR/视觉模型如何接入、结果如何进入 slot/context。

### 08. Prompt 拼装策略
定义 system/developer/agent/scenario/skill/tool/memory/knowledge/output prompt 如何动态拼装。

### 09. 上下文窗口管理策略
定义历史消息、工具结果、知识片段、长期记忆、压缩摘要如何进入上下文。

### 10. Knowledge / RAG 召回策略
定义何时检索、检索哪些知识库、rerank、冲突处理、引用、低置信答案策略。

### 11. Memory 抽取与写入时机
定义 turn/session/long-term/checkpoint memory 的抽取时机、写入条件、TTL、冲突处理。

### 12. Reflection 触发策略
定义是否配置反思、何时触发、反思模型、结构化输出、反思结果如何影响执行。

### 13. Guardrail 执行顺序
定义 input/tool input/tool output/output guardrail 的顺序、拦截、修复、转人工。

### 14. Permission / Identity 策略
定义身份来源、身份置信度、权限继承、跨渠道身份、工具鉴权、租户隔离。

### 15. 用户确认策略
定义哪些动作需要确认、确认卡片、确认后重校验、超时处理、确认写入 checkpoint。

### 16. Clarification 澄清策略
定义缺槽位、低置信、歧义、多选时如何提问，以及澄清几轮后转人工。

### 17. Handoff 中断/恢复体验
定义转人工、专家 Agent 转交、人审 pending、resume、上下文摘要、状态恢复。

### 18. Human-Agent 协作策略
定义人工客服如何使用 Agent 建议、如何纠错、Agent 是否旁路观察、反馈如何回流。

### 19. Long-running Task 体验
定义长任务进度、后台执行、用户离开、结果通知、取消、恢复、超时。

### 20. 错误重试与降级
定义模型错误、工具错误、知识错误、格式错误、渠道错误的重试和降级。

### 21. Fallback 分层策略
定义从模型重试、换模型、换 prompt、缓存、保守回答、创建工单到人工的多层 fallback。

### 22. Cache 策略
定义知识、工具结果、用户画像、prompt 编译、会话摘要、模型路由的缓存与 TTL。

### 23. 并发与取消策略
定义多请求、多工具、用户中途切意图、人工接管、旧任务取消、同用户多窗口处理。

### 24. Model Routing / Fallback 策略
定义不同任务用不同模型、升级/降级、模型失败 fallback、多模型不一致处理。

### 25. Output Rendering / UI Component 策略
定义文本、卡片、按钮、表格、表单、进度条、引用、商品/订单卡等组件输出。

### 26. Channel Adapter 策略
定义 Web、App、微信、企微、飞书、钉钉、电商 IM、邮件、语音等渠道差异。

### 27. Business Object / State Machine 策略
定义订单、退款、工单、优惠券等业务对象状态机，以及状态驱动回复/动作。

### 28. Feedback Learning 策略
定义用户反馈、人工纠错、质检、投诉、未解决问题如何进入知识/Skill/Eval/Policy。

### 29. Safety / Compliance Runtime 策略
定义 PII 脱敏、敏感承诺、行业合规、数据出境、审计采样、异常告警。

### 30. Trace 事件定义
定义运行时 event/span/schema，确保可调试、可审计、可 replay。

### 31. Observability Metrics 体系
定义 TTFT、工具耗时、路由置信度、转人工原因、记忆写入率、成本等指标。

### 32. Evaluation-in-Production 策略
定义线上抽样评测、shadow eval、A/B、canary、自动回滚、线上失败转 regression。

### 33. Simulator / Sandbox 策略
定义模拟用户、模拟工具、慢接口、错误码、渠道限制、恶意输入、人工审批。

### 34. Token / 延迟 / 成本控制
定义预算、上下文裁剪、模型路由、缓存、流式首响、成本降级。

### 35. Agent Version Compatibility 策略
定义 Agent/Skill/Tool/Knowledge/Workflow/Memory/Channel/Eval 版本兼容和旧会话迁移。

### 36. Data Contract 策略
定义 Tool、Knowledge、Memory、Trace、Eval、Handoff、UI Component 的数据契约。

### 37. Agent Tone / Personality Runtime 策略
定义语气如何按场景、用户情绪、渠道、风险动态调整。

### 38. Multi-agent 协作策略
定义主 Agent/子 Agent、仲裁、权限隔离、共享 memory、trace 展示。

### 39. Release / Canary / Rollback Runtime 策略
定义版本发布、灰度、实时指标门禁、自动回滚、运行中会话如何处理。

### 40. AgentOps 闭环策略
定义线上运营、失败分析、优化任务、Owner/SLA、周报和持续改进闭环。

---

## 2. 5 个子 agent 分工

### 子任务 A：输入、路由、上下文与 Prompt
覆盖：01、05、06、07、08、09、10、16、27、37。

重点回答：用户输入进来后，如何解析、理解、路由、拼上下文、决定问/答/查/规划。

### 子任务 B：工具、执行、并发、错误和成本
覆盖：02、03、04、19、20、21、22、23、24、34。

重点回答：LLM 与 Tool 如何协同，用户等待体验怎么做，多工具怎么调，失败如何降级，成本/延迟如何控制。

### 子任务 C：记忆、反思、安全、权限与合规
覆盖：11、12、13、14、15、29、36。

重点回答：记忆什么时候写，反思要不要配，Guardrail 顺序，身份权限，高风险确认，数据契约和合规。

### 子任务 D：输出体验、渠道、Handoff、人机协作和多 Agent
覆盖：17、18、25、26、38。

重点回答：不同渠道怎么输出，人工怎么接，Agent 与人工怎么协作，多 Agent 怎么不乱。

### 子任务 E：观测、评测、仿真、发布和 AgentOps
覆盖：28、30、31、32、33、35、39、40。

重点回答：Trace 怎么定义，指标怎么设计，线上评测怎么做，发布/回滚/运营闭环怎么跑。

---

## 3. 每个子任务交付格式要求

每个子 agent 必须输出一份 markdown 文档，包含：

1. 覆盖范围。
2. 设计目标。
3. 运行时状态/流程图。
4. 详细策略。
5. 至少 2-3 种可选方案及利弊。
6. 推荐方案。
7. 配置项设计。
8. 数据结构 / schema。
9. 用户体验表现。
10. 异常分支。
11. 评测/验收标准。
12. 可借鉴项目与具体机制。
13. UAgent 落地优先级。

---

## 4. 最终整合目标

子任务完成后，整合为：

`agent_runtime_detail_design_master.md`

它应该成为 UAgent Agent Runtime 的产品/架构共同设计规范。
