import { useMemo, useState } from 'react';
import { ArrowRightCircle, PlusCircle, Search, Tag } from 'lucide-react';
import { ManagementSidebar, type ManagementArea } from '../management/ManagementSidebar';

type AgentKind = '导购智能体' | '通用智能体' | '聊天流程' | '工作流' | '客服智能体' | '高级智能体';
const agents: Array<{ id: number; name: string; kind: AgentKind; description?: string; tag?: string }> = [
  { id: 1, name: '小宝宝测试-RAG', kind: '高级智能体', description: '知识库检索与分类路由', tag: '知识库检索' },
  { id: 2, name: '多模态服务助手', kind: '聊天流程', description: '支持图像和语音咨询' },
  { id: 3, name: '商品导购助手', kind: '导购智能体', description: '商品推荐与购买咨询', tag: '商品' },
  { id: 4, name: '工单服务助手', kind: '客服智能体', description: '查询、创建和跟进工单', tag: '工单' },
  { id: 5, name: '退款进度查询', kind: '聊天流程', description: '查询退款状态及预计到账时间' },
  { id: 6, name: '知识库问答', kind: '通用智能体', description: '企业知识检索与回答' },
  { id: 7, name: '转人工意图识别', kind: '工作流', description: '识别高风险和转人工场景' },
  { id: 8, name: '订单售后助手', kind: '客服智能体', description: '订单售后与服务记录', tag: '订单' },
  { id: 9, name: '周大福门店查询智能体', kind: '高级智能体', description: '周大福珠宝 AI 客服助理，负责门店位置与服务咨询', tag: '门店' },
  { id: 10, name: 'FamilyMart Indonesia', kind: '高级智能体', description: '便利店客户服务智能体', tag: '海外' },
];
const tabs: Array<'全部' | AgentKind> = ['全部', '导购智能体', '通用智能体', '聊天流程', '工作流', '客服智能体', '高级智能体'];

export function ApplicationManagementPage({ openAgent, navigate }: { openAgent: () => void; navigate: (area: ManagementArea) => void }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('全部');
  const [query, setQuery] = useState('');
  const [advancedOnly, setAdvancedOnly] = useState(false);
  const visible = useMemo(() => agents.filter(agent => (tab === '全部' || agent.kind === tab) && (!advancedOnly || agent.kind === '高级智能体') && `${agent.name}${agent.description}${agent.tag}`.toLowerCase().includes(query.trim().toLowerCase())), [tab, query, advancedOnly]);
  return <div className="management-body applications-body">
    <ManagementSidebar active="我的应用" navigate={navigate} />
    <main className="applications-main">
      <header className="applications-toolbar">
        <nav aria-label="应用类型">{tabs.map(value => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value}</button>)}</nav>
        <label className="compact-switch">高级智能体<input type="checkbox" checked={advancedOnly} onChange={event => setAdvancedOnly(event.target.checked)} /><i /></label>
        <select aria-label="选择标签"><option>选择标签</option><option>工单</option><option>商品</option><option>售后服务</option><option>知识库检索</option></select>
        <label className="application-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="请输入" aria-label="搜索应用" /><Search size={15} /></label>
      </header>
      <section className="application-grid" aria-label="应用列表">
        <article className="create-agent-card"><h2>创建</h2><button onClick={openAgent}><PlusCircle size={19} />从空白开始创建</button><button><ArrowRightCircle size={19} />通过分享模板码导入</button></article>
        {visible.map(agent => <article className="agent-list-card" key={agent.id}>
          <div className="agent-card-head"><span className="agent-list-avatar">A</span><strong>{agent.name}</strong><span className={`agent-kind kind-${agent.kind}`}>{agent.kind}</span></div>
          <p>{agent.description}</p>
          <div className="agent-card-foot"><span><Tag size={13} />{agent.tag || '添加标签'}</span><button aria-label={`编辑 ${agent.name}`} onClick={openAgent}>编辑</button></div>
        </article>)}
      </section>
      {!visible.length ? <div className="applications-empty">没有找到符合条件的智能体</div> : null}
    </main>
  </div>;
}
