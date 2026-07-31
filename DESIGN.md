# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-07-31
- Primary product surfaces: 高级智能体配置、监控中心、运营报表
- Evidence reviewed: `src/App.tsx`, `src/features/observability/ObservabilityViews.tsx`, `src/styles.css`, 真实产品截图与本轮产品评审结论

## Brand
- Personality: 专业、克制、可信，面向企业客服运营与产研协作
- Trust signals: 明确的数据来源、更新时间、统计口径、影响范围和处理状态
- Avoid: 通用卡片墙、无法下钻的装饰图表、没有数据依据的“解决率”或“质量分”

## Product goals
- Goals: 让值班人员发现并闭环事故，让工程师定位Run/Span，让运营人员分析自动化漏斗，让管理者查看价值和成本
- Non-goals: 不在监控和报表中实现质检评分；不根据对话内容猜测“已解决”
- Success signals: 每个异常能定位到受影响对象和负责人；每个指标可查看事件来源；每个报表可下钻到明细

## Personas and jobs
- 值班人员: 判断当前服务是否健康、事故影响多大、是否恢复
- 前线工程师: 定位模型、Tool、RAG、渠道或容量问题
- Agent运营人员: 找出自动化损失原因、低效Skill和渠道差异
- 管理者: 查看业务结果、成本、版本变化和预算风险

## Information architecture
- 监控: 服务总览、实时运行、事件与事故、依赖与容量、告警配置
- 报表: 业务成效、自动化漏斗、Skill与Tool、渠道、成本资源、版本对比
- 数据治理入口: 指标口径、数据采集状态、业务结果定义

## Design principles
- 异常优先: 正常时安静，事故发生时影响范围和处理动作成为视觉中心
- 事实优先: 只展示可由事件、状态或回执获得的数据，推断值必须明确标注
- 下钻优先: 图表、指标、异常和表格均应连接到Conversation、Run或原始事件
- 角色分层: 技术监控与业务报表分开，不用一套指标服务所有角色

## Visual language
- Color: 继承现有Udesk蓝色；绿色仅表示健康，橙色表示风险，红色表示事故
- Typography: 继承系统字体；数字与状态优先于解释文案
- Spacing/layout rhythm: 8px基础节奏，宽表格与趋势图优先，减少无意义卡片边框
- Shape/radius/elevation: 4-7px圆角，抽屉与弹窗承担详情，不使用装饰阴影
- Motion: 仅用于Tab切换、抽屉和状态变化

## Components
- Existing components to reuse: Drawer、Modal、DataTable、StatusPill、筛选栏
- New/changed components: 服务健康条、事故焦点、自动化漏斗、版本发布标记、依赖容量表、指标口径列表
- Variants and states: 正常、风险、事故、延迟、回补中、无权限、无数据

## Accessibility
- Target standard: WCAG 2.1 AA基础可用性
- Keyboard/focus behavior: 所有切换、筛选、下钻和关闭动作使用原生button/select
- Contrast/readability: 状态不能只依赖颜色，必须同时显示文本
- Screen-reader semantics: 对话框、导航、图表和状态提供aria-label

## Responsive behavior
- Supported breakpoints/devices: 桌面端1280px及以上
- Layout adaptations: 1280px下不得产生页面级横向滚动；宽表格允许区域内滚动
- Touch/hover differences: 本期不设计移动端

## Interaction states
- Loading: 骨架或生成中状态
- Empty: 区分暂无接入、当前筛选无结果
- Error: 显示受影响数据源和最后成功时间
- Success: 显示恢复时间与验证状态
- Slow network: 标记数据延迟、回补中或查询超时

## Content voice
- Tone: 直接、运维化、避免营销语言
- Terminology: Conversation、Run、Span、Incident、Skill、Tool保持统一
- Microcopy rules: 不写无操作价值的小字；解释放在指标口径或详情层

## Implementation constraints
- Framework/styling system: React + TypeScript + 原生CSS
- Design-token constraints: 复用现有颜色和组件，不增加依赖
- Performance constraints: Mock数据规模可控，列表使用筛选和分页
- Test/screenshot expectations: Vitest全量通过；1280×720浏览器无页面级横向溢出和控制台错误

## Open questions
- [ ] 业务结果事件由IM、工单还是客户确认提供，后端需最终确定
- [ ] 生产环境是否允许Run重放，建议默认仅测试环境开放
- [ ] 告警通知渠道和事故协作系统需要后端确认
