import { BarChart3, BookOpen, Boxes, CheckCircle2, Database, FileText, Image, Plus, Search, Settings2, Sparkles, Tag, Workflow } from 'lucide-react';
import type { ManagementArea } from './ManagementSidebar';
import './online-reference.css';

type PageDefinition = { title: string; intro: string; create: string; tabs?: string[]; rows: Array<[string, string, string]>; kind: 'grid' | 'table' | 'metrics' };

const pages: Partial<Record<ManagementArea, PageDefinition>> = {
  templates: { title: '模板中心', intro: '从已有模板开始创建智能体。', create: '从空白开始创建', tabs: ['全部', '通用智能体', '导购智能体', '聊天流程', '工作流'], kind: 'grid', rows: [['导购模板', '导购智能体', '商品咨询与推荐'], ['以图搜图', '聊天流程', '识别图片并检索图库'], ['售后工单', '聊天流程', '收集客户需求并创建工单'], ['外呼满意度', '客服智能体', '收集客户满意度情况'], ['阅读理解-模板', '聊天流程', '知识库文档问答']] },
  datasets: { title: '知识库', intro: '管理智能体可检索的知识与数据资产。', create: '创建知识库', tabs: ['全部', 'AI 知识库', 'IA 知识库', 'KM 知识库', '商品数据集'], kind: 'grid', rows: [['汇川知识库', 'AI 知识库', '0 个关联应用'], ['商品数据集', '商品数据集', '商品信息与属性字段'], ['KM 知识库', 'KM 知识库', '知识库机器人同步数据'], ['用户行为数据集', '用户行为数据集', '浏览、搜索与下单行为']] },
  lightMemory: { title: '轻量记忆库', intro: '保存可由智能体在会话中调用的客户记忆。', create: '创建记忆库', kind: 'grid', rows: [['小宝宝测试-轻量记忆', '客户记忆', '0 个关联应用'], ['会员服务记忆', '客户记忆', '用于客户等级与偏好识别']] },
  terms: { title: '专业词库', intro: '在知识检索时结合专业术语，提升业务匹配准确性。', create: '创建术语库', kind: 'grid', rows: [['周大福专业词', '术语：36', '珠宝品类与系列名称'], ['维谛专业词库', '术语：28', '变频器和产品型号'], ['火星人厨具', '术语：12', '厨电产品术语']] },
  qa: { title: '问答对', intro: '沉淀并维护可直接回答客户的高质量问答。', create: '创建', tabs: ['全部', 'AI 知识库', '手动创建'], kind: 'grid', rows: [['售后服务问答对', '问答对：128', '售后政策与服务网点'], ['订单与物流问答对', '问答对：246', '订单、退款与物流规则'], ['业务办理问答对', '问答对：86', '套餐、会员与办理流程']] },
  gallery: { title: '图库', intro: '创建图库，供以图搜图节点检索图片。', create: '创建图库', kind: 'grid', rows: [['珠宝图片', '8 张图片', '珠宝造型与样式检索'], ['Lexus 车型', '15 张图片', '车型图片检索'], ['商品示例图库', '24 张图片', '商品相似图召回']] },
  plugins: { title: '扩展', intro: '安装模型、工具和智能体策略扩展。', create: '扩展市场', kind: 'table', rows: [['udesk_query_optimization', '工具', '已安装'], ['udesk_agent_call_v2', '工具', '可安装'], ['agent3', '智能体策略', '可安装'], ['volcengine_mass_0.0.51', '模型', '可安装']] },
  workflow: { title: '工作流', intro: '将工作流封装为可供高级智能体调用的能力。', create: '创建工作流', tabs: ['全部', '客户服务', '即时通讯', '工单', 'CRM', 'ERP'], kind: 'grid', rows: [['查询工单条件', '作者 Alex', '工单字段查询与筛选'], ['以图搜图', '作者 Alex', '用于以图搜图和内容召回'], ['行业知识生成', '作者 Alex', '生成可供人工审核的行业知识']] },
  mcp: { title: 'MCP', intro: '接入 MCP 服务器，为高级智能体提供外部工具。', create: '添加 MCP 服务器（HTTP）', kind: 'grid', rows: [['高德地图', 'amap', '工具：15 个 · 1 个月前更新']] },
  integrations: { title: '第三方集成', intro: '授权业务系统，为智能体提供数据与操作能力。', create: '添加系统集成', kind: 'grid', rows: [['UDESK', 'udesk', '已授权'], ['快递查询 Udesk', '快递100', '已授权'], ['华北交付中心', 'udesk', '已授权'], ['订单服务', '业务系统', '已授权']] },
  evaluation: { title: '自动测评', intro: '创建评测任务，检查智能体的回答与运行表现。', create: '创建评测任务', tabs: ['全部', '待评测', '评测中', '已完成'], kind: 'table', rows: [['测试一下', '小宝宝测试-后台错误信息统一使用英文', '已完成'], ['小宝宝测试-记忆', '小宝宝测试-场景ID-知识检索', '已完成'], ['企查查 v1', '企查查 v2', '已完成']] },
  variables: { title: '变量管理', intro: '系统变量来自已授权的第三方集成，可在智能体编排中使用。', create: '查看已授权系统', kind: 'table', rows: [['udesk_customer_name', '客户名称 · 文本', '可编辑'], ['udesk_customer_tags', '客户标签 · 文本', '可编辑'], ['udesk_customer_organization', '公司 · 文本', '可编辑'], ['udesk_customer_language', '语言 · 文本', '可编辑']] },
  tags: { title: '标签管理', intro: '管理智能体、知识和运营对象的标签。', create: '创建', tabs: ['全部', '已启用', '未启用'], kind: 'grid', rows: [['售后服务', '标签：12', '已启用'], ['商品推荐', '标签：8', '已启用'], ['测试标签', '标签：2', '已启用']] },
};

export function OnlineReferencePage({ area }: { area: ManagementArea }) {
  const page = pages[area] ?? pages.templates!;
  const icon = page.kind === 'metrics' ? <BarChart3 /> : page.title.includes('图') ? <Image /> : page.title.includes('知识') ? <BookOpen /> : page.title.includes('集成') ? <Boxes /> : <Database />;
  return <section className="online-reference-page">
    <header className="online-page-header"><div><div className="online-title-line">{icon}<h1>{page.title}</h1></div><p>{page.intro}</p></div><button className="primary-button"><Plus size={15} />{page.create}</button></header>
    <div className="online-filter-bar">{page.tabs ? <nav>{page.tabs.map((tab, index) => <button key={tab} className={index === 0 ? 'active' : ''}>{tab}</button>)}</nav> : <span />}{page.kind !== 'table' ? <label><Search size={14} /><input placeholder={page.title === '模板中心' ? '搜索模板名称' : '搜索名称'} /></label> : <button className="subtle-action"><Settings2 size={14} />筛选</button>}</div>
    {page.kind === 'table' ? <section className="online-table"><div className="online-table-head"><span>名称</span><span>关联对象</span><span>状态</span><span>操作</span></div>{page.rows.map(([name, relation, state]) => <div className="online-table-row" key={name}><strong>{name}</strong><span>{relation}</span><span className={state.includes('完成') || state.includes('授权') || state.includes('编辑') ? 'online-success' : ''}>{state}</span><button>查看</button></div>)}</section> : <section className="online-card-grid"><article className="online-create-card"><span><Sparkles size={19} /></span><div><strong>{page.create}</strong><small>快速开始配置</small></div></article>{page.rows.map(([name, type, description]) => <article className="online-asset-card" key={name}><header><span className="online-asset-icon">{page.title.includes('图') ? <Image size={18} /> : page.title.includes('工作') ? <Workflow size={18} /> : <FileText size={18} />}</span><em>{type}</em></header><strong>{name}</strong><p>{description}</p><footer><span><Tag size={13} />添加标签</span><button>查看</button></footer></article>)}</section>}
    <footer className="online-pagination"><span>共 {page.rows.length} 条</span><button disabled>上一页</button><b>1</b><button disabled>下一页</button></footer>
  </section>;
}
