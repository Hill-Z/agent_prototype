# AI 查报表 Agent：自然语言构建和查询数据报表通用实现方案

> 工作中：本文整合子 agent 调研与主流 AI BI / NL2SQL / 语义层产品资料，目标是回答：如何用 Agent 通用实现“通过自然语言构建和查询数据报表”。

## 0. 初步结论

成熟形态不是“用户问一句 -> LLM 直接生成 SQL”，而是：

```text
选择可信数据域
-> 自然语言提问
-> 意图/指标/维度/时间/过滤条件解析
-> 歧义澄清
-> 语义层 / 指标层约束
-> SQL / 查询计划生成
-> 权限与安全改写
-> SQL 校验与成本预估
-> 查询执行
-> 结果解释与图表推荐
-> 证据展示 SQL/口径/来源
-> 保存为报表/图表/指标
-> 多轮追问
-> 反馈、评测、治理闭环
```

核心产品原则：

> 用户可以用自然语言发起分析，但系统必须用语义层、权限层、校验层、证据层和评测层来约束结果。

---

## 1. 为什么不能只做 Text-to-SQL

单纯 NL2SQL 的问题：

- 指标口径不稳定：GMV、收入、销售额、订单数可能有多种定义。
- Schema 太复杂：真实企业库表多、字段脏、命名不统一。
- 权限风险高：用户可能越权查询行级/列级敏感数据。
- SQL 正确但业务错：能跑不代表符合业务口径。
- 用户不信任：看不到计算逻辑、数据来源和过滤条件。
- 多轮追问困难：上下文里的时间、维度、过滤条件需要稳定继承。
- 报表资产无法沉淀：一次性答案不能变成可复用 dashboard。

所以正确路线是：

```text
NL2SQL Agent + Semantic Layer + Metric Layer + Governance + BI UX
```

---

## 2. 目标用户与使用场景

### 2.1 业务用户

- 问经营问题。
- 生成简单图表。
- 保存常用问题。
- 订阅指标变化。
- 追问原因。

示例：

```text
上周华东区退款率为什么升高？
按城市看一下本月新增客户数。
把近 12 周 GMV 趋势生成折线图。
```

### 2.2 分析师 / 报表作者

- 查看 SQL。
- 修改查询逻辑。
- 固化为报表。
- 定义指标口径。
- 审核 AI 生成结果。

### 2.3 数据管理员 / 建模者

- 建语义层。
- 维护指标、维度、同义词、示例问答。
- 管权限。
- 监控失败问题。
- 做评测集。

### 2.4 管理者

- 看自动总结。
- 看异常洞察。
- 追问趋势变化。
- 订阅日报/周报。

---

## 3. 通用技术架构

```text
用户问题
  ↓
Question Understanding
  - 意图识别
  - 指标/维度/时间/过滤条件抽取
  - 歧义识别
  - 上下文继承
  ↓
Data Scope Selection
  - 数据域选择
  - Dashboard / Metric Group / Semantic Model 限定
  - 权限可见范围过滤
  ↓
Semantic Retrieval
  - 表/字段/指标/维度召回
  - 同义词召回
  - 示例问答召回
  - 历史 SQL 召回
  ↓
Clarification
  - 指标歧义澄清
  - 时间粒度澄清
  - 维度歧义澄清
  - 权限不可见说明
  ↓
Query Planning
  - 生成逻辑查询计划
  - 绑定指标定义
  - 绑定维度和过滤条件
  ↓
SQL Generation / BI Query Generation
  - 生成 SQL / LookML / DAX / DSL
  - 参数化
  - 防注入
  ↓
Validation & Governance
  - SQL 语法校验
  - 只读校验
  - 行列级权限改写
  - 成本预估
  - 慢查询拦截
  - 敏感字段脱敏
  ↓
Execution
  - 同步/异步查询
  - 缓存
  - 分页/采样
  - 任务状态
  ↓
Result Reasoning & Visualization
  - 结果摘要
  - 图表推荐
  - 异常点解释
  - 置信度/不确定性
  ↓
Evidence Layer
  - SQL
  - 指标定义
  - 数据来源
  - 过滤条件
  - 权限说明
  - 查询时间
  ↓
Asset Save
  - 保存为问题
  - 保存为图表
  - 保存为报表
  - 加入 dashboard
  - 设置订阅
  ↓
Feedback / Eval / Governance
```

---

## 4. 产品交互设计调研摘要

成熟产品大多收敛到：

```text
先选可信数据域
-> 自然语言提问
-> 歧义澄清
-> 自动出图/可改图
-> 显示证据/SQL/计算过程
-> 保存为可复用资产
-> 多轮追问
-> 反馈/监控/治理
```

### 4.1 入口页

不应该是空白输入框，而应该展示：

- 最近问题。
- 推荐问题。
- 常用指标组。
- 可信数据域。
- 最近报表。
- 异常指标提示。

### 4.2 提问页

输入框旁边要有范围选择器：

```text
数据域 / 语义模型 / Dashboard / Metric Group / App / Report
```

先限定上下文，准确率会明显更高。

### 4.3 澄清页

当“销售额/收入/营收”有歧义时，不要硬猜。应该展示候选指标卡：

```text
指标名称
业务定义
计算公式
时间粒度
默认聚合方式
负责人
示例值
```

### 4.4 结果页

推荐三段式：

```text
图表
一句话结论
证据抽屉
```

证据抽屉包含：

```text
SQL / 查询 tokens / filters / 时间范围 / 数据来源 / 指标定义 / lineage
```

### 4.5 追问体验

Follow-up 应该是主操作：

```text
继续当前问题
换个维度看
改时间范围
只看某地区
保存成报表
解释为什么变化
```

### 4.6 保存为资产

保存不是导出图片，而是保存为：

```text
问题
图表
指标
报表
Dashboard
Answer
Liveboard
Document
```

---

## 5. 参考产品信号

- Tableau：Ask Data 已退役，当前主线是 Tableau Agent + Tableau Pulse。重点是建议问题、时间序列、计算解释、source references、Einstein Trust Layer。
- Power BI：Q&A 会在 2026 年 12 月退役，Copilot 是主线；强调 suggestions、autocomplete、未识别词提示、DAX 解释与报表总结。
- Looker：Conversational Analytics 依赖 LookML source of truth；歧义时主动澄清，展示 reasoning / how calculated。
- ThoughtSpot：Spotter 强调 search tokens、query visualizer、精确 SQL、reference questions、Answer 保存到 Liveboard。
- Hex：Threads / Chat with App，将自然语言问数和分析工作台结合，依赖 Guides 和 semantic projects。
- Mode：AI Assist 偏作者提效，生成 SQL 后可对比再插入。
- Metabase：Metabot 支持创建问题、生成 SQL、解释图表、修复 query errors，并有 system prompts / glossary / AI usage controls。
- Superset：通过 MCP 接入外部 AI，偏 preview-first，可审阅后保存。
- Databricks：Genie Spaces / Genie One / Genie Code，强调 Unity Catalog、示例 SQL、业务语义说明、review SQL/visualization、benchmark/monitor。


---

## 6. 技术实现细节

### 6.1 最重要的架构判断

最稳妥的实现不是：

```text
用户自然语言 -> LLM 直接生成 SQL -> 查库
```

而是：

```text
用户自然语言
-> 语义对象解析
-> 查询意图/指标/维度/过滤条件结构化
-> 语义查询 IR
-> 受控 SQL 编译器
-> 权限/成本/安全校验
-> 查询执行
-> 图表与解释生成
```

LLM 适合做：

```text
意图理解
业务术语匹配
schema linking 候选召回
澄清问题生成
结果解释
错误修复建议
```

不应该完全交给 LLM 的部分：

```text
权限裁剪
SQL 安全校验
最终 SQL 拼接
行列级权限
成本上限
敏感字段脱敏
指标口径定义
```

这些应该尽量确定性化、配置化、可审计。

### 6.2 推荐技术分层

| 层 | 责任 | 关键数据结构 | 落地要点 |
|---|---|---|---|
| 数据目录 / 治理层 | 资产发现、schema、owner、tag、glossary、lineage、权限、freshness | `CatalogAsset`, `LineageEdge`, `GlossaryTerm`, `AccessPolicy` | 先建统一目录，不要让 LLM 直接面对裸表 |
| 语义层 / 指标层 | metric、dimension、entity、join、grain、filter、rollup、certified question | `SemanticModel`, `MetricDef`, `DimensionDef`, `JoinPath`, `RollupDef` | 语义层是事实源，必须版本化 |
| NL 编排层 | 意图识别、槽位填充、追问、上下文管理 | `ConversationState`, `Intent`, `ResolvedSlot` | 多轮对话要显式存状态，不能全靠 prompt |
| Schema Linking / Retrieval | 把自然语言映射到语义对象和候选表/列 | `CandidateSet`, `SchemaMatch`, `EvidenceSpan` | 同义词、描述、样例值、使用频率、golden query 都要进检索 |
| 查询规划层 | 自然语言问题转成逻辑查询计划 | `SemanticQueryIR`, `QueryPlan` | 先生成 IR，不直接生成 SQL |
| SQL 编译与校验层 | IR -> SQL AST -> SQL，做语法、类型、group-by、join、权限校验 | `SqlAst`, `ValidationReport` | SQL 应由编译器产出，不由 LLM 直接拼字符串 |
| 执行层 | 同步/异步执行、队列、重试、取消、流式返回 | `QueryJob`, `ExecutionTrace`, `RetryPolicy` | 长查询必须异步化，保留进度和可取消能力 |
| 缓存/加速层 | 结果缓存、预聚合、物化视图、查询复用 | `CacheKey`, `FreshnessWatermark`, `PreAggMatch` | 缓存键要带语义版本和权限版本 |
| 展示/反馈/评测层 | 表格、图表、解释、追问、人工纠错、benchmark | `Answer`, `ChartSpec`, `FeedbackRecord`, `EvalCase` | 输出要带 provenance，反馈要能回灌 |

### 6.3 语义查询 IR

建议先设计一个平台自己的语义查询中间表示，而不是直接让模型写 SQL。

```json
{
  "question": "上周华东区退款率为什么升高？",
  "data_domain": "after_sales",
  "metric_refs": ["refund_rate"],
  "dimension_refs": ["region", "refund_reason"],
  "filters": [
    {"field": "region", "op": "=", "value": "华东"},
    {"field": "date", "op": "between", "value": ["last_week_start", "last_week_end"]}
  ],
  "time_grain": "day",
  "compare_with": "previous_week",
  "sort": [{"field": "refund_rate_delta", "direction": "desc"}],
  "limit": 20,
  "policy_version": "policy_v3",
  "semantic_model_version": "after_sales_v12"
}
```

IR 的价值：

- 让 LLM 输出结构化意图，而不是直接输出不可控 SQL。
- 方便权限裁剪、查询重写、缓存命中。
- 方便做多轮追问继承。
- 方便做评测和回放。

### 6.4 Schema Linking 设计

Schema linking 要单独成模块，不要和 SQL 生成混在一个 Prompt 里。

召回信号：

```text
表名 / 字段名
字段 label / description
业务术语 glossary
同义词 synonyms
指标定义
样例值
历史查询
高频报表
用户权限
golden questions
使用频率
数据新鲜度
```

输出：

```json
{
  "matches": [
    {
      "nl_phrase": "退款率",
      "candidate_type": "metric",
      "candidate_id": "metric.refund_rate",
      "confidence": 0.94,
      "evidence": ["glossary", "certified_metric", "golden_query"]
    }
  ],
  "ambiguous_terms": [
    {
      "term": "销售额",
      "candidates": ["gmv", "paid_amount", "net_revenue"],
      "need_clarification": true
    }
  ]
}
```

### 6.5 SQL 生成与校验

推荐链路：

```text
SemanticQueryIR
-> LogicalPlan
-> SqlAst
-> SQL
-> Parse validate
-> Policy rewrite
-> Dry run / Explain
-> Execute
```

校验项：

```text
语法合法
表/字段存在
指标维度兼容
聚合粒度正确
join path 合法
where 条件合法
权限合法
成本可接受
只读
强制 limit
```

错误修复分层：

```text
语法错 -> parser / constrained decoding 修复
schema 错 -> 重新检索 schema
权限错 -> 解释不可见，不继续硬查
空结果 -> 改写过滤条件或追问
聚合异常 -> 回到语义层重写
成本过高 -> 降粒度、加时间范围、加 limit
```

### 6.6 图表生成

不要让 LLM 自由生成任意图表配置。应该先根据结果集形态和用户意图生成受控 `ChartSpec`。

```json
{
  "chart_type": "line",
  "x": "date",
  "y": "refund_rate",
  "series": "region",
  "title": "华东区近 7 日退款率趋势",
  "filters": ["region=华东"],
  "reason": "用户询问上周升高趋势，时间序列适合折线图"
}
```

推荐规则：

```text
时间趋势 -> 折线图
类别对比 -> 柱状图
占比结构 -> 饼图/堆叠条形图
Top N -> 横向柱状图
明细列表 -> 表格
单指标 -> KPI 卡
异常解释 -> 图表 + 驱动因素表
```

### 6.7 多轮追问状态

必须显式保存：

```text
已确认指标
已确认时间范围
已确认维度
已确认过滤条件
当前数据域
当前图表类型
当前 SQL / IR
用户刚才改了什么
```

否则用户说“那按城市看一下”时，系统很容易丢失上一轮的指标和时间范围。

### 6.8 缓存设计

三层缓存：

```text
语义解析缓存：自然语言 -> IR 候选
查询结果缓存：SQL + 权限 + 参数 -> ResultSet
预聚合缓存：常用指标、常用粒度、常用时间窗口
```

缓存 key 必须包含：

```text
tenant_id
user_permission_hash
semantic_model_version
metric_version
query_ir_hash
time_watermark
data_freshness
policy_version
```

### 6.9 可参考实现路线

如果已有 dbt 体系：

```text
DataHub + dbt Semantic Layer / MetricFlow + 自定义 NL 编排层
```

如果更偏嵌入式分析或多租户 BI：

```text
DataHub + Cube Semantic Layer + 自定义 NL 编排层
```

如果客户已经在成熟 BI 生态：

```text
Looker / Power BI / Databricks 原生语义模型 + Agent 接入层
```

不要重复造一套平行语义层。

### 6.10 研究与开源参考

- Spider：跨域、多表、多 schema Text-to-SQL 基准，适合离线评测。
- PICARD：通过增量解析拒绝不合法 token，适合 constrained decoding / SQL 语法门控。
- Execution-Guided Decoding：用执行结果过滤坏候选，适合 SQL 生成后修复。
- LinkAlign：强调 schema linking 是大规模 Text-to-SQL 的关键瓶颈。
- dbt MetricFlow：展示 semantic model 如何转换成数据集和 SQL plan。
- Cube：展示语义层、访问控制、缓存、预聚合和查询编排。
---

## 7. 企业治理、安全与落地设计

企业级 AI 报表 Agent 不应该被设计成“会写 SQL 的聊天机器人”，而应该是“受控查询编排器”。推荐四层分离：

```text
数据层强制控制
  - RBAC / ABAC
  - 行级权限 RLS
  - 列级权限 CLS
  - 脱敏 / secure view / authorized view
  ↓
语义层统一口径
  - 指标定义
  - 维度定义
  - 时间口径
  - 过滤规则
  - 业务术语
  ↓
Agent 层受限执行
  - 只读 SQL
  - 表/列白名单
  - AST 校验
  - 禁止 DDL/DML
  - 强制 LIMIT
  - dry run
  - cost cap
  ↓
运行层闭环治理
  - 审计日志
  - 查询历史
  - 数据血缘
  - 成本监控
  - 离线/在线评测
  - 人审发布
  - 回滚机制
```

### 7.1 权限原则

权限必须优先在数据平台和语义层强制，而不是只靠 Agent prompt。

必须支持：

```text
租户隔离
角色权限
行级权限
列级权限
字段脱敏
数据域可见范围
报表资产权限
查询结果权限继承
```

关键原则：

- Agent 使用用户身份或代理身份查询时，权限必须可审计。
- 用户不可见的数据，Agent 也不可见。
- 用户不可查询的字段，不能因为自然语言换个说法就被查出。
- 高敏字段即使查询到，也要按策略脱敏或聚合展示。

### 7.2 SQL 安全控制

Agent 生成的 SQL 必须经过安全网关。

校验项：

```text
是否只读
是否包含 DDL/DML
是否访问白名单外表
是否访问敏感字段
是否缺少租户过滤
是否缺少权限过滤
是否存在笛卡尔积风险
是否超出扫描成本
是否超出行数限制
是否存在注入风险
```

推荐流程：

```text
LLM 生成逻辑查询计划
-> 生成 SQL
-> SQL AST parse
-> policy rewrite
-> dry run / explain
-> cost estimate
-> approval / block / execute
```

### 7.3 成本与慢查询治理

报表 Agent 很容易被自然语言诱导出大查询。

必须配置：

```text
最大扫描量
最大执行时间
最大返回行数
默认 LIMIT
并发限制
查询队列
缓存策略
慢查询告警
大查询审批
```

对用户体验：

```text
这个问题需要扫描大量数据，预计耗时较久。是否改为最近 30 天 / 按周聚合 / 只看 Top 20？
```

### 7.4 审计日志

每次问数必须记录：

```text
用户是谁
问了什么
Agent 理解成什么
使用哪个语义模型
生成了什么 SQL
访问了哪些表/字段
命中了哪些权限策略
扫描多少数据
返回多少行
展示了什么图表
是否保存为资产
是否被用户反馈错误
```

### 7.5 数据血缘与口径治理

结果页必须能展示：

```text
指标来自哪里
字段来自哪里
计算公式是什么
过滤条件是什么
数据更新时间
负责人是谁
是否为认证指标
```

指标变更时，要知道影响：

```text
哪些问题
哪些报表
哪些 dashboard
哪些订阅
哪些 Agent 示例问答
哪些评测用例
```

### 7.6 评测体系

离线评测：

```text
金标自然语言问题
标准 SQL / 标准结果
指标口径题
歧义澄清题
权限越权题
敏感字段题
慢查询题
异常数据题
```

在线评测：

```text
shadow query
canary 用户
人工抽检
用户反馈
失败聚类
自动回归
```

验收指标：

```text
SQL 可执行率
结果正确率
口径命中率
澄清准确率
越权拦截率
敏感泄露率
平均查询时延
每次查询成本
用户采纳率
保存为报表率
```

### 7.7 客户接入 SOP

```text
1. 数据盘点：数据源、核心表、指标、敏感字段、租户边界
2. 权限矩阵：角色、行列规则、脱敏规则、共享边界
3. 语义建模：指标、维度、时间口径、同义词、示例问答
4. 工具接入：查询执行器、元数据服务、权限服务、图表服务
5. 评测准备：金标问答、危险问法、成本样例、异常样例
6. 沙箱测试：SQL 正确性、权限、成本、图表、解释
7. 灰度上线：shadow/canary，观察 trace、成本、反馈
8. 持续治理：指标变更审批、权限复核、回归评测、审计抽检
```

### 7.8 MVP 到成熟版

| 阶段 | 范围 | 必配控制 | 发布标准 |
|---|---|---|---|
| MVP | 单业务域，少量核心指标 | 只读 SQL、语义层、RLS/CLS、脱敏、dry run、成本上限、审计日志 | 沙箱金标集通过，零越权，成本可控 |
| 扩展版 | 多业务域，多租户 | ABAC、分类标签、血缘、指标注册表、离线/在线评测、shadow/canary、慢查询治理 | 新指标和新数据源可灰度上线 |
| 成熟版 | 平台化、跨组织共享 | policy-as-code、租户强隔离、自动回滚、定期权限复核、持续评测、外部血缘标准化 | 稳定 SLA/SLO，审计可追溯，合规可证明 |

### 7.9 官方能力参考

- BigQuery：row-level security、column-level access control、data masking、authorized views、dry run、cost controls、audit logs、VPC Service Controls。
- Databricks：Unity Catalog、row filters、column masks、ABAC、data classification、audit logs、system tables、lineage、SQL warehouse sizing/queuing。
- Snowflake：RBAC、row access policies、column-level security、secure views、object tagging、sensitive data classification、access history、query history、resource monitors、PrivateLink。
- Looker / dbt：LookML / Semantic Layer / metrics / data tests / freshness。
- NIST AI RMF、Azure Foundry evaluation、Google Agent Platform evaluation：用于 AI 风险、评测、人审、上线治理。

