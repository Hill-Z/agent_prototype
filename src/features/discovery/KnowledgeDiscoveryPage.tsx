import { useMemo, useState } from 'react';
import { ArrowLeft, Bot, Check, ChevronLeft, ChevronRight, Clipboard, Database, MessageSquareText, Plus, Search, Settings2, Sparkles, Trash2, UserRound, X } from 'lucide-react';
import './knowledge-discovery.css';

type Status = '待处理' | '已入库' | '已放弃';
type Candidate = {
  id: string;
  question: string;
  answer: string;
  agent: string;
  account: string;
  date: string;
  status: Status;
  confidence: number;
  conversations: number;
  targetSpace?: string;
  conversationId: string;
  callId: string;
  similarQuestions: string[];
  messages: Array<{ role: 'user' | 'agent' | 'human'; time: string; text: string }>;
};

const seedCandidates: Candidate[] = [
  { id: 'KD-1028', question: '附近的服务网点周末营业吗？', answer: '北京朝阳服务中心周六 09:00–18:00 营业，周日休息；其他网点请以门店详情页为准。', agent: '售后服务助手', account: 'Udesk 在线客服·北京', date: '2026-09-16 14:32', status: '待处理', confidence: 96, conversations: 18, conversationId: 'c6e1542a-88fa-414d-881a-f156c148cf2b', callId: '4694324062', similarQuestions: ['周末线下网点开门吗？', '附近服务中心星期六上班吗？'], messages: [{ role: 'user', time: '14:22', text: '附近有没有可以周末办理业务的网点？' }, { role: 'agent', time: '14:22', text: '暂时无法确认具体网点营业时间，我为您转接人工客服。' }, { role: 'human', time: '14:25', text: '您好，请问您目前所在的位置是哪里？' }, { role: 'user', time: '14:26', text: '北京朝阳区，最好周六能去。' }, { role: 'human', time: '14:28', text: '您附近的朝阳服务中心周六 09:00–18:00 营业，周日休息。我把地址和预约入口发给您。' }, { role: 'user', time: '14:29', text: '好的，这个信息就够了，谢谢。' }] },
  { id: 'KD-1027', question: '退款到账后可以提现吗？', answer: '退款原路返回；使用账户余额支付的部分退回余额，完成实名认证后可提现至本人银行卡。', agent: '订单助手', account: 'Udesk IM·电商售后', date: '2026-09-16 11:06', status: '待处理', confidence: 93, conversations: 12, conversationId: '3a0e159c-2943-4c66-a42c-a58432e2ad71', callId: '4694311885', similarQuestions: ['退到余额的钱可以提现吗？', '退款余额怎么转银行卡？'], messages: [{ role: 'user', time: '10:51', text: '钱退到余额以后能不能直接提出来？' }, { role: 'agent', time: '10:51', text: '正在为您查询退款规则。' }, { role: 'user', time: '10:53', text: '还是帮我转人工吧。' }, { role: 'human', time: '10:56', text: '可以的，实名认证后在余额页面绑定本人银行卡即可提现，通常 1–3 个工作日到账。' }, { role: 'user', time: '10:57', text: '明白了。' }] },
  { id: 'KD-1025', question: '套餐办理后什么时候生效？', answer: '套餐办理成功后立即生效；若页面显示审核中，请等待审核完成后再办理其他变更。', agent: '业务办理助手', account: 'Udesk 在线客服·业务大厅', date: '2026-09-15 17:48', status: '待处理', confidence: 89, conversations: 9, conversationId: '3c60f660-4867-4a1d-aa85-c329d7b76142', callId: '4694278301', similarQuestions: ['新套餐当月生效吗？', '改套餐要等下个月吗？'], messages: [{ role: 'user', time: '17:36', text: '我现在办这个套餐，是立刻生效还是下个月？' }, { role: 'agent', time: '17:36', text: '套餐生效规则需要人工进一步确认。' }, { role: 'human', time: '17:39', text: '这个套餐审核通过后会立即生效，不需要等到次月。' }, { role: 'user', time: '17:40', text: '那现在帮我办吧。' }] },
  { id: 'KD-1021', question: '订单里的赠品可以单独退吗？', answer: '赠品不支持单独退换；退回主商品时，需按售后页面提示一并寄回赠品。', agent: '订单助手', account: 'Udesk IM·电商售后', date: '2026-09-14 09:20', status: '已入库', confidence: 95, conversations: 15, targetSpace: '订单与物流知识空间', conversationId: 'e1a7cf45-98bb-43c1-8f7e-5e72b2e04610', callId: '4694021377', similarQuestions: ['赠品坏了能单独换吗？'], messages: [{ role: 'user', time: '09:11', text: '赠品坏了但主商品没问题，能只换赠品吗？' }, { role: 'human', time: '09:14', text: '赠品不能单独申请售后，需要和主商品一起提交。' }, { role: 'user', time: '09:15', text: '好的。' }] },
  { id: 'KD-1018', question: '企业采购如何申请增值税专票？', answer: '下单时选择企业发票并填写完整开票资料；订单完成后可在订单详情中申请开具增值税专用发票。', agent: '售后服务助手', account: 'Udesk 在线客服·北京', date: '2026-09-13 15:14', status: '已放弃', confidence: 87, conversations: 6, conversationId: '7e1c35d0-7da8-4c62-aa92-81242d4a39e0', callId: '4693962004', similarQuestions: ['公司订单在哪里申请专票？'], messages: [{ role: 'user', time: '15:01', text: '公司采购要开专票，是下单前填还是付款以后申请？' }, { role: 'human', time: '15:05', text: '下单时先填写企业抬头和税号，订单完成后在详情页申请专票。' }] },
];

const statusOptions: Array<'全部状态' | Status> = ['全部状态', '待处理', '已入库', '已放弃'];

export function KnowledgeDiscoveryPage({ notify }: { notify: (message: string) => void }) {
  const [mode, setMode] = useState<'list' | 'settings'>('list');
  const [records, setRecords] = useState(seedCandidates);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [agent, setAgent] = useState('全部智能体');
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('全部状态');
  const [confidence, setConfidence] = useState('全部置信度');
  const [range, setRange] = useState('近30天');
  const [customStart, setCustomStart] = useState('2026-09-01');
  const [customEnd, setCustomEnd] = useState('2026-09-17');
  const [manualOpen, setManualOpen] = useState(false);
  const [page, setPage] = useState(1);

  const detail = records.find(item => item.id === detailId) ?? null;
  const filtered = useMemo(() => records.filter(item => {
    const hitSearch = !search || `${item.question}${item.answer}${item.conversationId}`.includes(search);
    const hitConfidence = confidence === '全部置信度' || (confidence === '90%以上' ? item.confidence >= 90 : confidence === '80%–89%' ? item.confidence >= 80 && item.confidence < 90 : item.confidence < 80);
    const itemDay = item.date.slice(0, 10);
    const hitDate = range !== '自定义时间' || (itemDay >= customStart && itemDay <= customEnd);
    return hitSearch && hitConfidence && hitDate && (agent === '全部智能体' || item.agent === agent) && (status === '全部状态' || item.status === status);
  }), [records, search, agent, status, confidence, range, customStart, customEnd]);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedRecords = records.filter(item => selected.includes(item.id));

  const resetFilters = () => { setSearch(''); setAgent('全部智能体'); setStatus('全部状态'); setConfidence('全部置信度'); setRange('近30天'); setPage(1); };
  const setResult = (ids: string[], result: Exclude<Status, '待处理'>, targetSpace?: string) => {
    setRecords(current => current.map(item => ids.includes(item.id) ? { ...item, status: result, targetSpace } : item));
    setSelected([]); setAddOpen(false); setDetailId(null);
    notify(result === '已入库' ? `已加入${targetSpace}` : `已放弃 ${ids.length} 条知识发现`);
  };
  const openAdd = (ids: string[]) => { setSelected(ids); setAddOpen(true); };
  const runManualExtraction = (sourceAgent: string, sourceAccount: string, endDate: string) => {
    const candidate: Candidate = { id: `KD-${1030 + records.length}`, question: '服务网点办理业务需要提前预约吗？', answer: '到店办理普通业务无需预约；如需设备检修或专人服务，建议提前在服务中心页面预约。', agent: sourceAgent, account: sourceAccount, date: `${endDate} 16:20`, status: '待处理', confidence: 91, conversations: 7, conversationId: 'f7239c92-2445-4ed8-83c8-52bf6bbd9cc4', callId: '4694388721', similarQuestions: ['去服务中心要预约吗？', '线下办理可以直接去吗？'], messages: [{ role: 'user', time: '15:42', text: '去服务网点办理业务需要预约吗？' }, { role: 'agent', time: '15:42', text: '暂时无法确认该网点的预约要求，为您转接人工客服。' }, { role: 'human', time: '15:45', text: '普通业务可以直接到店；设备检修建议提前预约，避免长时间等候。' }, { role: 'user', time: '15:46', text: '明白了，谢谢。' }] };
    setRecords(current => [candidate, ...current]);
    setStatus('待处理'); setPage(1); setManualOpen(false);
    notify('手动抽取完成，新增 1 条待处理知识');
  };

  if (mode === 'settings') return <DiscoverySettingsPage onBack={() => setMode('list')} notify={notify} />;
  if (detail) return <><KnowledgeDetailPage item={detail} onBack={() => setDetailId(null)} onAdd={() => openAdd([detail.id])} onAbandon={() => setResult([detail.id], '已放弃')} notify={notify} />{addOpen ? <ChooseKnowledgeSpace candidates={selectedRecords} close={() => setAddOpen(false)} confirm={space => setResult(selected, '已入库', space)} /> : null}</>;

  return <section className="discovery-page">
    <header className="discovery-heading"><div><h1>知识发现</h1><p>审核从人工服务对话中提取的高质量问答，并沉淀到知识空间。</p></div><div className="discovery-heading-actions"><button className="primary-button" onClick={() => setManualOpen(true)}><Sparkles size={15} />手动抽取</button><button className="secondary-button" onClick={() => setMode('settings')}><Settings2 size={15} />知识发现设置</button></div></header>
    <div className="discovery-status-tabs">{statusOptions.map(value => <button key={value} className={status === value ? 'active' : ''} onClick={() => { setStatus(value); setPage(1); }}>{value}<span>{value === '全部状态' ? records.length : records.filter(item => item.status === value).length}</span></button>)}</div>
    <section className="discovery-table-card">
      <div className="discovery-toolbar"><label className="discovery-search"><Search size={15} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="搜索问题或关联会话 ID" /></label><select aria-label="按智能体筛选" value={agent} onChange={event => { setAgent(event.target.value); setPage(1); }}><option>全部智能体</option><option>售后服务助手</option><option>订单助手</option><option>业务办理助手</option></select><select aria-label="按置信度筛选" value={confidence} onChange={event => { setConfidence(event.target.value); setPage(1); }}><option>全部置信度</option><option>90%以上</option><option>80%–89%</option><option>80%以下</option></select><select aria-label="按发现时间筛选" value={range} onChange={event => { setRange(event.target.value); setPage(1); }}><option>近7天</option><option>近30天</option><option>近90天</option><option>自定义时间</option></select>{range === '自定义时间' ? <div className="custom-date-range"><input aria-label="开始日期" type="date" value={customStart} max={customEnd} onChange={event => { setCustomStart(event.target.value); setPage(1); }} /><span>至</span><input aria-label="结束日期" type="date" value={customEnd} min={customStart} onChange={event => { setCustomEnd(event.target.value); setPage(1); }} /></div> : null}<button className="toolbar-reset" onClick={resetFilters}>重置</button></div>
      {selected.length ? <div className="selection-bar"><span>已选择 <b>{selected.length}</b> 条</span><button onClick={() => openAdd(selected)}><Plus size={14} />加入知识空间</button><button className="danger" onClick={() => setResult(selected, '已放弃')}>放弃</button></div> : null}
      <div className="knowledge-table" role="table" aria-label="知识发现列表">
        <div className="knowledge-table-head" role="row"><input className="compact-check" aria-label="选择当前页" type="checkbox" checked={rows.length > 0 && rows.every(item => selected.includes(item.id))} onChange={event => setSelected(event.target.checked ? Array.from(new Set([...selected, ...rows.map(item => item.id)])) : selected.filter(id => !rows.some(item => item.id === id)))} /><span>标准问题</span><span>推荐答案</span><span>置信度</span><span>智能体 / 发现时间</span><span>状态</span><span>操作</span></div>
        {rows.map(item => <div className="knowledge-table-row" role="row" key={item.id} onClick={() => setDetailId(item.id)}><input className="compact-check" aria-label={`选择 ${item.question}`} type="checkbox" checked={selected.includes(item.id)} onClick={event => event.stopPropagation()} onChange={() => setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])} /><strong className="question-cell">{item.question}<small>{item.conversations} 段相似人工对话</small></strong><p className="answer-cell">{item.answer}</p><span className="confidence-cell"><b>{item.confidence}%</b><i><u style={{ width: `${item.confidence}%` }} /></i></span><span className="source-cell">{item.agent}<small>{item.date}</small></span><span className={`simple-status status-${item.status}`}>{item.status}</span><div className="table-actions"><button onClick={event => { event.stopPropagation(); setDetailId(item.id); }}>详情</button>{item.status === '待处理' ? <button className="action-primary" onClick={event => { event.stopPropagation(); openAdd([item.id]); }}>入库</button> : null}</div></div>)}
        {!rows.length ? <div className="empty-discovery"><Search size={22} /><strong>没有符合条件的知识发现</strong><button onClick={resetFilters}>清除筛选</button></div> : null}
      </div>
      <footer className="discovery-pagination"><span>共 {filtered.length} 条，每页 {pageSize} 条</span><button disabled={currentPage === 1} onClick={() => setPage(value => Math.max(1, value - 1))} aria-label="上一页"><ChevronLeft size={16} /></button><b>{currentPage}</b><span>/ {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))} aria-label="下一页"><ChevronRight size={16} /></button></footer>
    </section>
    {addOpen ? <ChooseKnowledgeSpace candidates={selectedRecords} close={() => setAddOpen(false)} confirm={space => setResult(selected, '已入库', space)} /> : null}
    {manualOpen ? <ManualExtractionDialog close={() => setManualOpen(false)} start={runManualExtraction} /> : null}
  </section>;
}

function ManualExtractionDialog({ close, start }: { close: () => void; start: (agent: string, account: string, endDate: string) => void }) {
  const [agent, setAgent] = useState('售后服务助手');
  const [account, setAccount] = useState('Udesk 在线客服·北京');
  const [startDate, setStartDate] = useState('2026-09-10');
  const [endDate, setEndDate] = useState('2026-09-17');
  return <div className="discovery-backdrop" onMouseDown={close}><section className="manual-dialog" role="dialog" aria-modal="true" aria-label="手动抽取知识" onMouseDown={event => event.stopPropagation()}><header><div><h2>手动抽取知识</h2><p>选择数据范围，立即从已结束的转人工会话中发现候选知识。</p></div><button className="plain-icon" onClick={close} aria-label="关闭"><X size={18} /></button></header><div className="manual-form"><label>智能体<select aria-label="抽取智能体" value={agent} onChange={event => setAgent(event.target.value)}><option>售后服务助手</option><option>订单助手</option><option>业务办理助手</option></select></label><label>客服系统账号<select aria-label="抽取客服系统账号" value={account} onChange={event => setAccount(event.target.value)}><option>Udesk 在线客服·北京</option><option>Udesk IM·电商售后</option><option>Udesk 在线客服·业务大厅</option></select></label><fieldset><legend>会话时间</legend><div className="manual-date-range"><label>开始日期<input aria-label="手动抽取开始日期" type="date" value={startDate} max={endDate} onChange={event => setStartDate(event.target.value)} /></label><span>至</span><label>结束日期<input aria-label="手动抽取结束日期" type="date" value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} /></label></div></fieldset><div className="manual-note"><Sparkles size={16} /><span><strong>抽取结果不会直接入库</strong>候选知识将进入“待处理”，审核后可加入指定知识空间。</span></div></div><footer><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={() => start(agent, account, endDate)}>开始抽取</button></footer></section></div>;
}

function KnowledgeDetailPage({ item, onBack, onAdd, onAbandon, notify }: { item: Candidate; onBack: () => void; onAdd: () => void; onAbandon: () => void; notify: (message: string) => void }) {
  const [question, setQuestion] = useState(item.question);
  const [answer, setAnswer] = useState(item.answer);
  const copyId = () => { void navigator.clipboard?.writeText(item.conversationId); notify('关联会话 ID 已复制'); };
  return <section className="discovery-page detail-page">
    <header className="detail-page-header"><div><button className="back-link" onClick={onBack}><ArrowLeft size={16} />知识发现</button><h1>知识详情</h1><p>{item.id} · 发现于 {item.date}</p></div>{item.status === '待处理' ? <div><button className="secondary-button abandon-button" onClick={onAbandon}>放弃</button><button className="primary-button" onClick={onAdd}><Plus size={15} />加入知识空间</button></div> : <span className={`simple-status status-${item.status}`}>{item.status}{item.targetSpace ? ` · ${item.targetSpace}` : ''}</span>}</header>
    <div className="detail-page-grid"><main><section className="detail-card"><h2>提取的知识</h2><label>标准问题<input value={question} onChange={event => setQuestion(event.target.value)} /></label><label>相似问题<div className="similar-list">{item.similarQuestions.map(value => <span key={value}>{value}</span>)}</div></label><label>推荐答案<textarea value={answer} onChange={event => setAnswer(event.target.value)} /></label><div className="confidence-explain"><span>置信度 <b>{item.confidence}%</b></span><p>基于 {item.conversations} 段相似的人工服务对话生成。系统已过滤仅针对单一客户的处理结果。</p></div></section><section className="detail-card"><h2>关联信息</h2><div className="meta-grid"><span><small>关联会话 ID</small><b>{item.conversationId}</b><button onClick={copyId} aria-label="复制关联会话 ID"><Clipboard size={13} /></button></span><span><small>callid</small><b>{item.callId}</b></span><span><small>来源智能体</small><b>{item.agent}</b></span><span><small>客服系统账号</small><b>{item.account}</b></span></div></section></main><aside className="conversation-panel"><header><div><h2>关联对话历史</h2><p>完整展示转人工前后对话，用于核对知识是否准确。</p></div><MessageSquareText size={18} /></header><div className="conversation-history">{item.messages.map((message, index) => <div className={`conversation-message role-${message.role}`} key={`${message.time}-${index}`}><span>{message.role === 'user' ? '用户' : message.role === 'agent' ? '智能体' : '人工客服'} · {message.time}</span><p>{message.text}</p>{message.role === 'agent' && item.messages[index + 1]?.role === 'human' ? <em>转接人工</em> : null}</div>)}</div><footer><Check size={15} />用户在人工回复后确认问题已解决，可作为知识依据。</footer></aside></div>
  </section>;
}

function ChooseKnowledgeSpace({ candidates, close, confirm }: { candidates: Candidate[]; close: () => void; confirm: (space: string) => void }) {
  const spaces = [{ name: '售后服务知识空间', desc: '售后政策、服务网点与安装服务', count: 128 }, { name: '订单与物流知识空间', desc: '订单、支付、退款与物流规则', count: 246 }, { name: '业务办理知识空间', desc: '套餐、会员与业务办理流程', count: 86 }];
  const [selectedSpace, setSelectedSpace] = useState(spaces[0].name);
  return <div className="discovery-backdrop" onMouseDown={close}><section className="space-dialog" role="dialog" aria-modal="true" aria-label="选择知识空间" onMouseDown={event => event.stopPropagation()}><header><div><h2>选择知识空间</h2><p>将 {candidates.length} 条知识加入指定空间。</p></div><button className="plain-icon" onClick={close} aria-label="关闭"><X size={18} /></button></header><div className="space-list">{spaces.map(space => <button key={space.name} className={selectedSpace === space.name ? 'active' : ''} onClick={() => setSelectedSpace(space.name)}><span className="space-icon"><Database size={18} /></span><span><strong>{space.name}</strong><small>{space.desc} · {space.count} 条知识</small></span>{selectedSpace === space.name ? <Check size={17} /> : null}</button>)}</div><footer><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={() => confirm(selectedSpace)}>确认加入</button></footer></section></div>;
}

function DiscoverySettingsPage({ onBack, notify }: { onBack: () => void; notify: (message: string) => void }) {
  const [enabled, setEnabled] = useState(true);
  const [agents, setAgents] = useState(['售后服务助手', '订单助手']);
  const [accounts, setAccounts] = useState(['Udesk 在线客服·北京', 'Udesk IM·电商售后']);
  const [picker, setPicker] = useState<'agents' | 'accounts' | null>(null);
  const [promptAgent, setPromptAgent] = useState<string | null>(null);
  return <section className="discovery-page settings-page"><header className="detail-page-header"><div><button className="back-link" onClick={onBack}><ArrowLeft size={16} />知识发现</button><h1>知识发现设置</h1><p>配置知识发现的数据来源，并为每个智能体设置抽取要求。</p></div><button className="primary-button" onClick={() => notify('知识发现设置已保存')}>保存</button></header><div className="settings-content"><section className="settings-card"><header><div><h2>发现范围</h2><p>仅从所选智能体转入人工后的已结束会话中抽取知识。</p></div><label className="compact-switch">启用<input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /><i /></label></header><div className="settings-form-row"><div><strong>选择智能体</strong><p>只有所选智能体转出的人工会话会参与知识发现。</p></div><div className="selected-items">{agents.map(value => <span key={value}>{value}<button onClick={() => setAgents(current => current.filter(item => item !== value))}>×</button></span>)}<button className="outline-add" onClick={() => setPicker('agents')}><Plus size={14} />选择智能体</button></div></div><div className="settings-form-row"><div><strong>客服系统账号</strong><p>绑定接收转人工会话的 Udesk 系统账号。</p></div><div className="selected-items">{accounts.map(value => <span key={value}>{value}<button onClick={() => setAccounts(current => current.filter(item => item !== value))}>×</button></span>)}<button className="outline-add" onClick={() => setPicker('accounts')}><Plus size={14} />选择账号</button></div></div></section><section className="settings-card"><header><div><h2>智能体抽取要求</h2><p>每个智能体可配置不同的业务范围和抽取提示词。</p></div></header><div className="agent-prompt-table"><div className="agent-prompt-head"><span>智能体</span><span>抽取要求</span><span>状态</span><span>操作</span></div>{agents.map((name, index) => <div className="agent-prompt-row" key={name}><span><Bot size={16} />{name}</span><p>{index === 0 ? '抽取可复用的售后政策、服务网点和安装规则，排除单次补偿结果。' : '抽取订单、支付、退款和物流规则，保留适用条件与时效。'}</p><em>已配置</em><button onClick={() => setPromptAgent(name)}>配置提示词</button></div>)}</div></section><section className="settings-card"><header><div><h2>抽取条件</h2><p>控制何时生成一条待处理的知识发现。</p></div></header><div className="condition-grid"><label>抽取频率<select defaultValue="每日一次"><option>每日一次</option><option>每周一次</option><option>仅手动执行</option></select></label><label>最低置信度<input type="number" defaultValue="80" min="0" max="100" /></label><label>最低相似会话数<input type="number" defaultValue="2" min="1" /></label></div><label className="setting-check"><input type="checkbox" defaultChecked /><span><strong>仅使用人工已明确回答的会话</strong><small>排除排队取消、用户离开或人工没有给出有效答案的会话。</small></span></label><label className="setting-check"><input type="checkbox" defaultChecked /><span><strong>用户确认解决时提高置信度</strong><small>识别“好的、明白了、已解决”等正向确认，但仍需要人工审核后入库。</small></span></label></section></div>{picker ? <SelectionDialog kind={picker} selected={picker === 'agents' ? agents : accounts} close={() => setPicker(null)} confirm={values => { if (picker === 'agents') setAgents(values); else setAccounts(values); setPicker(null); }} /> : null}{promptAgent ? <PromptDialog agent={promptAgent} close={() => setPromptAgent(null)} save={() => { notify(`${promptAgent}的抽取提示词已保存`); setPromptAgent(null); }} /> : null}</section>;
}

function SelectionDialog({ kind, selected, close, confirm }: { kind: 'agents' | 'accounts'; selected: string[]; close: () => void; confirm: (values: string[]) => void }) {
  const options = kind === 'agents' ? ['售后服务助手', '订单助手', '业务办理助手', '会员服务助手'] : ['Udesk 在线客服·北京', 'Udesk IM·电商售后', 'Udesk 在线客服·华东', 'Udesk IM·会员中心'];
  const [draft, setDraft] = useState(selected);
  return <div className="discovery-backdrop" onMouseDown={close}><section className="selection-dialog" role="dialog" aria-modal="true" aria-label={kind === 'agents' ? '选择智能体' : '选择客服系统账号'} onMouseDown={event => event.stopPropagation()}><header><div><h2>{kind === 'agents' ? '选择智能体' : '选择客服系统账号'}</h2><p>{kind === 'agents' ? '选择需要进行知识发现的智能体。' : '选择用于获取转人工后对话的客服系统账号。'}</p></div><button className="plain-icon" onClick={close}><X size={18} /></button></header><div className="selection-options">{options.map(value => <label key={value}><input className="native-small-check" type="checkbox" checked={draft.includes(value)} onChange={() => setDraft(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} /><span>{kind === 'agents' ? <Bot size={16} /> : <UserRound size={16} />}<strong>{value}</strong></span></label>)}</div><footer><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={() => confirm(draft)}>确定</button></footer></section></div>;
}

function PromptDialog({ agent, close, save }: { agent: string; close: () => void; save: () => void }) {
  return <div className="discovery-backdrop" onMouseDown={close}><section className="prompt-dialog" role="dialog" aria-modal="true" aria-label={`配置${agent}抽取提示词`} onMouseDown={event => event.stopPropagation()}><header><div><h2>{agent} · 抽取提示词</h2><p>提示词只影响该智能体转人工后的知识抽取。</p></div><button className="plain-icon" onClick={close}><X size={18} /></button></header><div className="prompt-body"><label>智能体业务范围<textarea defaultValue={agent === '订单助手' ? '负责订单、支付、退款、发票与物流相关咨询。' : '负责售后政策、服务网点、安装与维修相关咨询。'} /></label><label>抽取要求<textarea className="prompt-main" defaultValue={'从转人工后的客服回复中提取可重复回答同类问题的稳定知识。\n\n只提取人工明确回答且用户已理解或确认的信息；保留适用条件、时间和例外情况；排除订单号、客户身份、一次性补偿和仅针对单个客户的处理结果。'} /></label><label>不抽取的内容<input defaultValue="客户隐私、单次补偿、投诉情绪、未确认结论" /></label></div><footer><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={save}>保存提示词</button></footer></section></div>;
}
