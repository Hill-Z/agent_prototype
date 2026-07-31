import {
  Activity, AlertTriangle, ArrowDownUp, ArrowUpRight, Bell, Bot, CheckCircle2,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Cpu, Database, Download, Eye,
  FileDown, Filter, Gauge, GitCompareArrows, Layers3, MessageSquareText, Network,
  Plus, RefreshCw, Route, Save, Search, Server, ShieldAlert, SlidersHorizontal,
  TrendingUp, UserRoundCheck, WalletCards, Workflow, Wrench, X
} from 'lucide-react';
import { useMemo, useState } from 'react';

type MonitorTab = '服务总览' | '实时运行' | '事件与事故' | '依赖与容量' | '告警配置';
type ReportTab = '经营总览' | '自动化漏斗' | '会话与转人工' | 'Agent能力' | '渠道表现' | '成本资源';

type Conversation = {
  id: string; agent: string; channel: string; stage: string; duration: string;
  useCase: string; status: string; runId: string; version: string;
};

const conversations: Conversation[] = [
  { id: 'conv_81A2', agent: '订单服务 Agent', channel: 'Udesk IM', stage: '调用订单工具', duration: '00:18', useCase: '订单物流', status: '运行中', runId: 'run_8f31', version: 'v1.8.2' },
  { id: 'conv_7F19', agent: '售后服务 Agent', channel: 'WhatsApp', stage: '生成回复', duration: '00:42', useCase: '退款进度', status: '运行中', runId: 'run_7a09', version: 'v2.1.0' },
  { id: 'conv_69C4', agent: '账号服务 Agent', channel: '网页插件', stage: '知识检索', duration: '01:06', useCase: '账号权限', status: '等待工具', runId: 'run_66d4', version: 'v1.4.6' },
  { id: 'conv_54E8', agent: '售后服务 Agent', channel: 'Udesk IM', stage: '模型规划', duration: '00:11', useCase: '退换货', status: '运行中', runId: 'run_542a', version: 'v2.1.0' },
  { id: 'conv_48B1', agent: '售前咨询 Agent', channel: '网页插件', stage: '等待发送', duration: '00:26', useCase: '产品咨询', status: '排队中', runId: 'run_481c', version: 'v1.2.3' }
];

const exceptionEvents = [
  ['INC-240731-03', '14:32', '模型服务', 'MODEL_RATE_LIMIT', '订单服务 Agent', '86 个会话', '徐立阳', '处理中'],
  ['INC-240731-02', '14:27', 'WhatsApp', 'TEMPLATE_REJECTED', 'WhatsApp', '18 个会话', '姚翔宇', '持续发生'],
  ['INC-240731-01', '14:05', 'order.query', 'TOOL_TIMEOUT', '订单物流查询', '31 个会话', '徐立阳', '已恢复']
];

const performanceRows = [
  ['LLM 调用', '1,986', '99.1%', '1.12s', '2.06s', '3.84s', '0.9%'],
  ['Tool 调用', '1,204', '97.8%', '420ms', '1.22s', '2.96s', '2.2%'],
  ['Skill 执行', '1,426', '98.6%', '680ms', '1.36s', '2.31s', '1.4%'],
  ['RAG 检索', '962', '99.4%', '188ms', '426ms', '760ms', '0.6%'],
  ['渠道发送', '1,812', '99.2%', '126ms', '340ms', '680ms', '0.8%']
];

const initialAlertRules = [
  ['Tool P95 耗时告警', 'Tool 调用 P95 > 3s', '连续 3 个窗口', '全部生产 Agent', '启用'],
  ['LLM 错误率告警', 'LLM 错误率 > 2%', '5 分钟', '订单服务 Agent', '启用'],
  ['渠道发送失败告警', '发送失败率 > 1%', '10 分钟', 'WhatsApp', '停用']
];

const reportTables: Record<ReportTab, { headers: string[]; rows: string[][] }> = {
  经营总览: { headers: ['Agent', '进线会话', '获得机会', '实际回答', '业务结果', '转人工'], rows: [['订单服务 Agent', '4,260', '3,982', '3,716', '2,946', '386'], ['售后服务 Agent', '3,840', '3,548', '3,210', '2,284', '612'], ['账号服务 Agent', '2,910', '2,686', '2,492', '1,912', '318'], ['售前咨询 Agent', '1,830', '1,604', '1,420', '986', '186']] },
  自动化漏斗: { headers: ['损失原因', '会话数', '占总会话', '主要来源', '可优化对象'], rows: [['不在服务范围', '1,200', '9.3%', 'Agent适用范围', '路由配置'], ['Agent受限', '900', '7.0%', '转人工规则/工作流', 'Guidance'], ['用户提前离开', '600', '4.7%', '渠道会话事件', '首响体验'], ['系统执行失败', '300', '2.3%', 'Run.failed', 'Tool与渠道'], ['回答后转人工', '1,100', '8.6%', 'Handoff.created', 'Skill与知识']] },
  '会话与转人工': { headers: ['转人工原因', '会话数', '占Agent参与', '平均等待', '转人工后处理', '来源事件'], rows: [['用户主动要求', '468', '4.0%', '18s', '已接入', 'Handoff.requested'], ['Agent无法回答', '386', '3.3%', '26s', '已接入', 'Handoff.unresolved'], ['Tool执行失败', '302', '2.6%', '42s', '已接入', 'Run.failed'], ['规则指定转人工', '218', '1.8%', '8s', '已接入', 'Handoff.rule'], ['用户提前离开', '128', '1.1%', '—', '未接入', 'Conversation.abandoned']] },
  'Agent能力': { headers: ['能力', '触发会话', '成功动作', '参数缺失', '超时', '业务完成率'], rows: [['订单物流查询', '3,280', '3,046', '84', '72', '92.9%'], ['退款进度查询', '2,146', '1,984', '46', '96', '92.5%'], ['账号权限处理', '1,682', '1,604', '22', '34', '95.4%'], ['退换货申请', '1,426', '1,218', '64', '118', '85.4%']] },
  '渠道表现': { headers: ['渠道', '会话量', '自动化率', '转人工率', '发送成功', '送达', '降级'], rows: [['Udesk IM', '4,879', '68.2%', '12.4%', '4,560', '4,552', '12'], ['网页插件', '3,980', '72.8%', '10.1%', '3,717', '3,714', '4'], ['WhatsApp', '3,467', '61.4%', '16.8%', '3,086', '3,012', '164'], ['X Direct Messages', '514', '58.9%', '20.4%', '452', '--', '28']] },
  成本资源: { headers: ['Agent', '会话数', 'LLM成本', 'Tool成本', 'ASR成本', '单会话成本', '预算使用'], rows: [['订单服务 Agent', '4,260', '¥1,486', '¥248', '¥0', '¥0.41', '68%'], ['售后服务 Agent', '3,840', '¥1,392', '¥306', '¥42', '¥0.45', '74%'], ['账号服务 Agent', '2,910', '¥986', '¥118', '¥0', '¥0.38', '52%'], ['售前咨询 Agent', '1,830', '¥612', '¥28', '¥0', '¥0.35', '46%']] }
};

export function RealtimeMonitorView() {
  const [tab, setTab] = useState<MonitorTab>('服务总览');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [handlingError, setHandlingError] = useState<string | null>(null);
  const [exceptionStatuses, setExceptionStatuses] = useState<Record<string, string>>({});
  const [alertRules, setAlertRules] = useState(initialAlertRules);
  const [alertModal, setAlertModal] = useState(false);
  const [dataStatus, setDataStatus] = useState(false);
  const [filters, setFilters] = useState({ environment: '生产环境', agent: '全部 Agent', version: '全部版本', channel: '全部渠道', capability: '全部 Skill / Tool' });

  const openRun = (runId: string) => { setSelectedConversation(null); setSelectedRun(runId); };

  return <div className="observability-page">
    <header className="observability-header">
      <div><h1>监控</h1></div>
      <div className="header-actions">
        <button className="data-freshness" onClick={() => setDataStatus(true)}><span className="live-indicator"><i />数据正常</span><time>刚刚更新</time></button>
        <select aria-label="刷新频率"><option>10 秒刷新</option><option>30 秒刷新</option><option>60 秒刷新</option></select>
        <button className={autoRefresh ? 'active' : ''} onClick={() => setAutoRefresh(value => !value)}><RefreshCw size={14} />自动刷新</button>
      </div>
    </header>

    <ObservabilityFilters value={filters} onChange={setFilters} />
    <nav className="report-tabs observability-tabs" aria-label="监控视图">
      {(['服务总览', '实时运行', '事件与事故', '依赖与容量', '告警配置'] as MonitorTab[]).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
    </nav>

    {tab === '服务总览' && <ServiceOverview onIncident={setHandlingError} onRun={openRun} onNavigate={setTab} />}
    {tab === '实时运行' && <RealtimeActivity onConversation={setSelectedConversation} onRun={openRun} />}
    {tab === '事件与事故' && <ExceptionEventView statuses={exceptionStatuses} onHandle={setHandlingError} onRun={openRun} />}
    {tab === '依赖与容量' && <DependencyCapacityView onRun={openRun} />}
    {tab === '告警配置' && <AlertRulesView rules={alertRules} onCreate={() => setAlertModal(true)} onToggle={(name) => setAlertRules(items => items.map(row => row[0] === name ? [...row.slice(0, 4), row[4] === '启用' ? '停用' : '启用'] : row))} />}

    {selectedConversation && <ConversationDrawer conversation={selectedConversation} onClose={() => setSelectedConversation(null)} onRun={() => openRun(selectedConversation.runId)} />}
    {selectedRun && <RunDrawer runId={selectedRun} onClose={() => setSelectedRun(null)} />}
    {handlingError && <ExceptionDialog errorCode={handlingError} onClose={() => setHandlingError(null)} onProcessing={() => { setExceptionStatuses(value => ({ ...value, [handlingError]: '处理中' })); setHandlingError(null); }} />}
    {alertModal && <AlertRuleDialog onClose={() => setAlertModal(false)} onSave={() => { setAlertRules(items => [['新建告警规则', 'Tool 错误率 > 2%', '连续 2 个窗口', '全部生产 Agent', '启用'], ...items]); setAlertModal(false); }} />}
    {dataStatus && <DataStatusDialog onClose={() => setDataStatus(false)} />}
  </div>;
}

function ServiceOverview({ onIncident, onRun, onNavigate }: { onIncident: (value: string) => void; onRun: (value: string) => void; onNavigate: (value: MonitorTab) => void }) {
  return <>
    <section className="service-health-band">
      <div className="service-health-main"><span className="health-orb warning"><AlertTriangle size={18} /></span><div><small>当前服务状态</small><h2>部分服务受影响</h2><p>模型限流影响订单服务，WhatsApp模板发送仍有失败。</p></div></div>
      <div className="health-facts"><span>进行中事故<strong>2</strong></span><span>受影响会话<strong>104</strong></span><span>受影响Agent<strong>2</strong></span><span>今日可用性<strong>99.82%</strong></span></div>
      <button onClick={() => onNavigate('事件与事故')}>查看全部事故 <ArrowUpRight size={14} /></button>
    </section>

    <div className="service-overview-grid">
      <section className="incident-focus">
        <div className="ops-section-heading"><div><h2>正在发生</h2><span className="section-range">按客户影响排序</span></div><StatusPill value="处理中" /></div>
        <button className="incident-focus-row" onClick={() => onIncident('INC-240731-03')}>
          <span className="severity-label">P1</span><div><strong>模型限流导致订单服务响应延迟</strong><small>INC-240731-03 · 已持续 18 分钟 · 负责人 徐立阳</small></div><span>86 个会话受影响</span><ArrowUpRight size={15} />
        </button>
        <button className="incident-focus-row" onClick={() => onIncident('INC-240731-02')}>
          <span className="severity-label p2">P2</span><div><strong>WhatsApp模板消息发送失败</strong><small>INC-240731-02 · 已持续 23 分钟 · 负责人 姚翔宇</small></div><span>18 个会话受影响</span><ArrowUpRight size={15} />
        </button>
      </section>

      <section className="release-watch">
        <div className="ops-section-heading"><div><h2>最近发布</h2><span className="section-range">发布后 72 小时观察</span></div><GitCompareArrows size={16} /></div>
        <div className="release-identity"><strong>v2.1.0</strong><span>订单服务 Agent</span><time>07-28 10:00</time></div>
        <dl><div><dt>回答成功率</dt><dd className="good">+2.2%</dd></div><div><dt>Tool成功率</dt><dd className="good">+1.2%</dd></div><div><dt>P95耗时</dt><dd className="danger">+180ms</dd></div><div><dt>单会话成本</dt><dd className="good">-¥0.04</dd></div></dl>
      </section>
    </div>

    <div className="service-overview-grid lower">
      <section className="ops-data-section compact-section">
        <div className="ops-section-heading"><div><h2>关键依赖</h2><span className="section-range">最近 15 分钟</span></div><button onClick={() => onNavigate('依赖与容量')}>查看容量</button></div>
        <div className="dependency-brief-list">{[['火山方舟 Doubao', '99.1%', 'P95 3.84s', '风险'], ['order.query', '97.8%', 'P95 2.96s', '风险'], ['知识检索', '99.4%', 'P95 760ms', '正常'], ['Udesk IM', '99.96%', 'P95 268ms', '正常']].map(row => <div key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><StatusPill value={row[3]} /></div>)}</div>
      </section>
      <section className="ops-data-section compact-section">
        <div className="ops-section-heading"><div><h2>运行趋势</h2><span className="section-range">发布与事故已标记</span></div><button onClick={() => onRun('run_8f31')}>查看慢Run</button></div>
        <MiniTrendChart label="近一小时Run耗时趋势" />
        <div className="chart-markers"><span className="release">14:08 发布 v2.1.0</span><span className="incident">14:22 发生限流</span></div>
      </section>
    </div>
  </>;
}

function DependencyCapacityView({ onRun }: { onRun: (value: string) => void }) {
  const rows = [
    ['模型', '火山方舟 Doubao', '风险', '99.1%', '3.84s', '限流 72%', '86'],
    ['Tool', 'order.query', '风险', '97.8%', '2.96s', '并发 83%', '31'],
    ['RAG', '知识检索', '正常', '99.4%', '760ms', '队列 12', '4'],
    ['Channel', 'WhatsApp', '风险', '98.7%', '1.16s', '模板额度 64%', '18'],
    ['Channel', 'Udesk IM', '正常', '99.96%', '268ms', '队列 0', '0']
  ];
  return <>
    <div className="capacity-strip"><span><Cpu size={16} />模型请求配额<strong>72%</strong></span><span><Workflow size={16} />Tool并发<strong>83%</strong></span><span><Layers3 size={16} />执行队列<strong>18</strong></span><span><WalletCards size={16} />本月预算<strong>68%</strong></span></div>
    <section className="ops-data-section"><div className="ops-section-heading"><div><h2>依赖与容量</h2><span className="section-range">成功率、延迟和配额来自各执行组件事件</span></div></div><DataTable className="dependency-table" headers={['类型', '依赖', '状态', '成功率', 'P95', '容量/配额', '影响会话']} rows={rows} renderCell={(cell, index, rowIndex) => index === 1 ? <button className="link-button" onClick={() => onRun(`run_dependency_${rowIndex}`)}>{cell}</button> : index === 2 ? <StatusPill value={cell} /> : cell} /></section>
    <section className="ops-data-section"><div className="ops-section-heading"><div><h2>容量风险</h2><span className="section-range">预计未来 30 分钟</span></div></div><div className="risk-callouts"><article><AlertTriangle size={16} /><div><strong>order.query接近并发阈值</strong><span>按当前增长速度预计 18 分钟后达到 90%</span></div><button>创建告警</button></article><article><Server size={16} /><div><strong>模型配额仍可支撑</strong><span>预计今日使用 81%，无需扩容</span></div></article></div></section>
  </>;
}

function ObservabilityFilters({ value, onChange }: { value: Record<string, string>; onChange: (value: any) => void }) {
  const fields = [
    ['environment', '环境筛选', ['生产环境', '测试环境']], ['agent', 'Agent 筛选', ['全部 Agent', '订单服务 Agent', '售后服务 Agent', '账号服务 Agent']],
    ['version', '版本筛选', ['全部版本', 'v2.1.0', 'v1.8.2']], ['channel', '渠道筛选', ['全部渠道', 'Udesk IM', '网页插件', 'WhatsApp']],
    ['capability', '能力筛选', ['全部 Skill / Tool', '订单物流查询', 'order.query', '知识检索']]
  ] as const;
  return <section className="global-filter-bar"><Filter size={15} />{fields.map(([key, label, options]) => <select key={key} aria-label={label} value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })}>{options.map(option => <option key={option}>{option}</option>)}</select>)}<button onClick={() => onChange({ environment: '生产环境', agent: '全部 Agent', version: '全部版本', channel: '全部渠道', capability: '全部 Skill / Tool' })}>重置</button></section>;
}

function RealtimeActivity({ onConversation, onRun }: { onConversation: (value: Conversation) => void; onRun: (value: string) => void }) {
  const [query, setQuery] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => conversations.filter(item => `${item.id}${item.agent}${item.channel}${item.useCase}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sortDesc ? b.duration.localeCompare(a.duration) : a.duration.localeCompare(b.duration)), [query, sortDesc]);
  return <>
    <section className="ops-data-section monitor-activity-section">
      <div className="ops-section-heading"><h2>活动会话</h2><div className="table-actions"><label className="compact-search"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索会话" /></label><button onClick={() => setSortDesc(value => !value)}><ArrowDownUp size={14} />持续时间</button></div></div>
      {filtered.length ? <DataTable className="active-conversation-table" headers={['会话 / Agent', '渠道', '当前阶段', '持续时间', 'Use Case', '状态']} rows={filtered.map(item => [`${item.id}|${item.agent}`, item.channel, item.stage, item.duration, item.useCase, item.status])} renderCell={(cell, index, rowIndex) => index === 0 ? <button className="table-primary-action" aria-label={`查看会话 ${filtered[rowIndex].id}`} onClick={() => onConversation(filtered[rowIndex])}><strong>{cell.split('|')[0]}</strong><small>{cell.split('|')[1]}</small></button> : index === 5 ? <StatusPill value={cell} /> : cell} /> : <EmptyState title="没有匹配的活动会话" onReset={() => setQuery('')} />}
      <TablePagination page={page} total={filtered.length} onPage={setPage} />
    </section>
    <div className="monitor-main-grid runtime-grid">
      <section className="runtime-service-strip"><div className="ops-section-heading"><h2>最近一次 Run 链路</h2><button onClick={() => onRun('run_8f31')}>打开 Trace <ArrowUpRight size={14} /></button></div><div className="run-identity"><strong>run_8f31</strong><span>conv_81A2</span><span>订单服务 Agent</span><span>2.42s</span></div><div className="service-nodes"><ServiceNode icon={MessageSquareText} name="接收消息" value="82ms" /><ServiceNode icon={Bot} name="模型规划" value="1.12s" /><ServiceNode icon={Wrench} name="工具调用" value="860ms" /><ServiceNode icon={Database} name="知识检索" value="246ms" /><ServiceNode icon={Route} name="发送回复" value="112ms" /></div></section>
      <section className="recent-exceptions"><div className="ops-section-heading"><h2>最近异常</h2></div>{exceptionEvents.slice(0, 3).map(row => <button key={row[3]} className="exception-brief" onClick={() => onRun(row[0])}><span>{row[1]}</span><strong>{row[3]}</strong><small>{row[0]}</small><em>{row[5]}</em></button>)}</section>
    </div>
  </>;
}

function ExceptionEventView({ statuses, onHandle, onRun }: { statuses: Record<string, string>; onHandle: (value: string) => void; onRun: (value: string) => void }) {
  const [component, setComponent] = useState('全部组件');
  const rows = exceptionEvents.filter(row => component === '全部组件' || row[2].includes(component));
  return <>
    <section className="incident-summary-line"><span><AlertTriangle size={16} /><strong>2</strong> 个事故正在发生</span><span><Clock3 size={16} />最长持续 <strong>23 分钟</strong></span><span><UserRoundCheck size={16} /><strong>2</strong> 人正在处理</span><button>设置维护窗口</button></section>
    <section className="ops-data-section">
      <div className="ops-section-heading"><div><h2>事件与事故</h2><span className="section-range">重复事件按错误指纹、对象和时间窗口自动归并</span></div><div className="inline-filters"><select aria-label="异常组件" value={component} onChange={event => setComponent(event.target.value)}><option>全部组件</option><option>模型</option><option>Tool</option><option>WhatsApp</option></select><select aria-label="异常状态"><option>全部状态</option><option>持续发生</option><option>处理中</option><option>已恢复</option></select></div></div>
      <DataTable className="incident-table" headers={['事故', '开始', '异常对象', '错误码', '影响范围', '影响会话', '负责人', '状态', '操作']} rows={rows.map(row => [...row.slice(0, 7), statuses[row[3]] || row[7], row[0]])} renderCell={(cell, index, rowIndex) => index === 0 ? <button className="link-button" onClick={() => onHandle(cell)}>{cell}</button> : index === 2 ? <button className="link-button" onClick={() => onRun(rows[rowIndex][0])}>{cell}</button> : index === 3 ? <code>{cell}</code> : index === 7 ? <StatusPill value={cell} /> : index === 8 ? <button className="row-action" aria-label={`处理 ${cell}`} onClick={() => onHandle(cell)}>处理</button> : cell} />
      <div className="incident-footer"><span>最近 24 小时共归并 126 个事件，形成 3 个事故</span><button><Bell size={14} />为当前筛选创建告警</button></div>
    </section>
  </>;
}

function ExecutionPerformanceView({ onRun }: { onRun: (value: string) => void }) {
  const [percentile, setPercentile] = useState('P95');
  return <>
    <div className="performance-grid">
      <section className="performance-trend ops-data-section"><div className="ops-section-heading"><h2>执行耗时趋势</h2><div className="segmented-control">{['P50', 'P90', 'P95', 'P99'].map(item => <button key={item} className={percentile === item ? 'active' : ''} onClick={() => setPercentile(item)}>{item}</button>)}</div></div><MiniTrendChart label={`${percentile} 执行耗时`} /></section>
      <section className="performance-rank ops-data-section"><div className="ops-section-heading"><h2>异常排行</h2></div><button onClick={() => onRun('run_3ad1')}><strong>order.query</strong><span>P95 3.82s</span><em>6 次失败</em></button><button onClick={() => onRun('run_91bf')}><strong>refund.create</strong><span>P95 3.16s</span><em>4 次失败</em></button><button onClick={() => onRun('run_a810')}><strong>WhatsApp Send</strong><span>P95 1.42s</span><em>18 次失败</em></button></section>
    </div>
    <section className="ops-data-section"><div className="ops-section-heading"><h2>组件性能</h2><span className="section-range">最近 15 分钟</span></div><DataTable className="performance-table" headers={['执行组件', '调用次数', '成功率', 'P50', 'P90', 'P95', '错误率']} rows={performanceRows} renderCell={(cell, index) => index === 0 ? <strong>{cell}</strong> : cell} /></section>
  </>;
}

function AlertRulesView({ rules, onCreate, onToggle }: { rules: string[][]; onCreate: () => void; onToggle: (name: string) => void }) {
  return <>
    <section className="ops-data-section"><div className="ops-section-heading"><h2>告警规则</h2><button className="primary-action" onClick={onCreate}><Plus size={14} />新建规则</button></div><DataTable className="alert-rule-table" headers={['规则', '触发条件', '统计窗口', '范围', '状态', '操作']} rows={rules.map(row => [...row, row[0]])} renderCell={(cell, index) => index === 0 ? <strong>{cell}</strong> : index === 4 ? <StatusPill value={cell} /> : index === 5 ? <button className="row-action" onClick={() => onToggle(cell)}>{rules.find(row => row[0] === cell)?.[4] === '启用' ? '停用' : '启用'}</button> : cell} /></section>
    <section className="ops-data-section"><div className="ops-section-heading"><h2>告警历史</h2></div><DataTable headers={['触发时间', '规则', '影响范围', '通知', '恢复时间']} rows={[["今天 14:30", 'Tool P95 耗时告警', '6 个 Run', '企业微信 · 已送达', '--'], ['昨天 18:42', '渠道发送失败告警', 'WhatsApp', '邮件 · 已送达', '昨天 18:58']]} /></section>
  </>;
}

export function ReportsView() {
  const [tab, setTab] = useState<ReportTab>('经营总览');
  const [range, setRange] = useState('近 30 天');
  const [granularity, setGranularity] = useState('按日');
  const [compare, setCompare] = useState('对比上期');
  const [metricDialog, setMetricDialog] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState(['默认视图']);
  const [activeSeries, setActiveSeries] = useState({ agent: true, handoff: true });
  const [selectedDay, setSelectedDay] = useState('07-20');
  const table = reportTables[tab];

  return <div className="reports-page">
    <header className="observability-header"><div><h1>报表</h1></div><div className="header-actions"><select aria-label="已保存视图">{savedViews.map(item => <option key={item}>{item}</option>)}</select><button onClick={() => setMetricDialog(true)}><CircleHelp size={14} />指标口径</button><button onClick={() => setSaveDialog(true)}><Save size={14} />保存视图</button><button className="primary-action" onClick={() => setExportDialog(true)}><Download size={14} />导出</button></div></header>
    <section className="report-filter-bar"><SlidersHorizontal size={15} /><select aria-label="报表时间范围" value={range} onChange={event => setRange(event.target.value)}><option>近 7 天</option><option>近 30 天</option><option>本季度</option><option>自定义范围</option></select><select aria-label="时间粒度" value={granularity} onChange={event => setGranularity(event.target.value)}><option>按日</option><option>按周</option><option>按月</option></select><select aria-label="对比范围" value={compare} onChange={event => setCompare(event.target.value)}><option>对比上期</option><option>对比上周</option><option>不对比</option></select><select aria-label="报表 Agent"><option>全部 Agent</option><option>订单服务 Agent</option><option>售后服务 Agent</option></select><select aria-label="报表渠道"><option>全部渠道</option><option>Udesk IM</option><option>WhatsApp</option></select></section>
    <nav className="report-tabs" aria-label="报表维度">{(Object.keys(reportTables) as ReportTab[]).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav>
    <section className="report-data-notice"><CheckCircle2 size={14} /><span>数据完整度 99.8%</span><span>统计截止 07-31 14:00</span><button onClick={() => setMetricDialog(true)}>查看口径与数据源</button></section>
    {tab === '经营总览' && <div className="report-kpis business-kpis"><ReportKpi label="总进线会话" value="12,840" delta="+18.6%" onInfo={() => setMetricDialog(true)} /><ReportKpi label="获得回答机会" value="11,820" delta="92.1%" onInfo={() => setMetricDialog(true)} /><ReportKpi label="Agent实际回答" value="10,838" delta="91.7%" onInfo={() => setMetricDialog(true)} /><ReportKpi label="产生业务结果" value="8,128" delta="75.0%" good onInfo={() => setMetricDialog(true)} /><ReportKpi label="转人工" value="1,502" delta="13.9%" onInfo={() => setMetricDialog(true)} /></div>}
    {tab === '经营总览' && <ReportOverview range={range} granularity={granularity} selectedDay={selectedDay} onDay={setSelectedDay} series={activeSeries} onSeries={(key) => setActiveSeries(value => ({ ...value, [key]: !value[key] }))} />}
    {tab === '自动化漏斗' && <AutomationFunnel />}
    {tab === '会话与转人工' && <ConversationOutcomeSummary />}
    {tab === 'Agent能力' && <AgentCapabilitySummary />}
    {tab === '成本资源' && <CostResourceSummary />}
    {tab === '渠道表现' && <ChannelDeliveryFunnel />}
    <ReportTableSection title={tab} headers={table.headers} rows={table.rows} onDetail={setDetail} />
    {metricDialog && <MetricDefinitionDialog onClose={() => setMetricDialog(false)} />}
    {saveDialog && <SaveViewDialog onClose={() => setSaveDialog(false)} onSave={() => { setSavedViews(items => [...items, '我的运营视图']); setSaveDialog(false); }} />}
    {exportDialog && <ExportDialog onClose={() => setExportDialog(false)} />}
    {detail && <ReportDetailDialog title={detail} onClose={() => setDetail(null)} />}
  </div>;
}

function ReportOverview({ range, granularity, selectedDay, onDay, series, onSeries }: { range: string; granularity: string; selectedDay: string; onDay: (value: string) => void; series: Record<string, boolean>; onSeries: (key: 'agent' | 'handoff') => void }) {
  const days = ['06-21', '06-28', '07-05', '07-12', '07-20'];
  return <div className="report-grid"><section className="trend-report"><div className="ops-section-heading"><div><h2>业务结果趋势</h2><span className="section-range">{range} · {granularity} · 07-28发布v2.1.0</span></div><span className="report-legend"><button aria-pressed={series.agent} onClick={() => onSeries('agent')}><i />实际回答</button><button aria-pressed={series.handoff} onClick={() => onSeries('handoff')}><i />转人工</button></span></div><div className="trend-chart"><div className="chart-y"><span>600</span><span>450</span><span>300</span><span>150</span><span>0</span></div><div className="chart-plot"><svg viewBox="0 0 640 190" preserveAspectRatio="none" aria-label={`${range}业务结果趋势图`}>{series.agent && <polyline points="0,92 80,78 160,84 240,58 320,66 400,42 480,50 560,28 640,34" />}{series.handoff && <polyline className="secondary" points="0,154 80,148 160,152 240,140 320,144 400,132 480,138 560,124 640,128" />}</svg><span className="release-marker" title="v2.1.0发布" /><div className="chart-x interactive">{days.map(day => <button key={day} className={selectedDay === day ? 'active' : ''} onClick={() => onDay(day)}>{day}</button>)}</div></div></div><div className="selected-chart-point"><strong>{selectedDay}</strong><span>实际回答 512</span><span>转人工 46</span><span>业务结果 384</span></div></section><section className="outcome-distribution"><div className="ops-section-heading"><div><h2>结果来源</h2><span className="section-range">仅统计有明确事件的结果</span></div></div><div className="outcome-bar" aria-label="业务结果来源分布"><i /><i /><i /><i /><i /></div><ul><li><i className="verified" />业务动作完成 <strong>34.2%</strong></li><li><i className="contained" />客户确认解决 <strong>18.8%</strong></li><li><i className="assisted" />回答后转人工 <strong>13.9%</strong></li><li><i className="unassisted" />Agent受限 <strong>7.0%</strong></li><li><i className="abandoned" />用户提前离开 <strong>4.7%</strong></li></ul></section></div>;
}

function AutomationFunnel() {
  const steps = [['总进线会话', '12,840', '100%'], ['符合服务范围', '11,640', '90.7%'], ['获得回答机会', '10,740', '83.6%'], ['Agent实际回答', '9,840', '76.6%'], ['产生业务结果', '8,128', '63.3%']];
  return <div className="automation-layout"><section className="automation-funnel"><div className="ops-section-heading"><div><h2>自动化漏斗</h2><span className="section-range">每一步均由明确事件计算</span></div></div>{steps.map((step, index) => <div key={step[0]} className="funnel-step"><span>{index + 1}</span><div><strong>{step[0]}</strong><small>{step[1]} 个会话</small></div><i style={{ width: step[2] }} /><em>{step[2]}</em></div>)}</section><section className="loss-reasons"><div className="ops-section-heading"><h2>损失原因</h2></div>{[['不在服务范围', '1,200', '路由配置'], ['Agent受限', '900', '转人工规则'], ['用户提前离开', '600', '首响体验'], ['执行失败', '300', 'Tool与渠道'], ['回答后转人工', '1,100', 'Skill与知识']].map(row => <button key={row[0]}><strong>{row[0]}</strong><span>{row[1]} 会话</span><em>{row[2]}</em><ArrowUpRight size={14} /></button>)}</section></div>;
}

function ConversationOutcomeSummary() {
  return <div className="conversation-report-layout"><section className="response-time-panel"><div className="ops-section-heading"><div><h2>会话响应效率</h2><span className="section-range">只统计真实消息和会话事件</span></div></div><div className="response-time-grid">{[['首响P50', '1.2s'], ['首响P95', '4.8s'], ['平均会话时长', '3m 42s'], ['长任务占比', '8.6%']].map(row => <article key={row[0]}><small>{row[0]}</small><strong>{row[1]}</strong></article>)}</div><MiniTrendChart label="会话响应时间趋势" /></section><section className="handoff-panel"><div className="ops-section-heading"><div><h2>转人工构成</h2><span className="section-range">按可追溯事件归类</span></div></div>{[['用户主动要求', '468', '31.2%'], ['Agent无法回答', '386', '25.7%'], ['Tool执行失败', '302', '20.1%'], ['规则指定', '218', '14.5%'], ['用户提前离开', '128', '8.5%']].map(row => <div className="handoff-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><em>{row[2]}</em></div>)}</section></div>;
}

function AgentCapabilitySummary() {
  return <div className="capability-summary"><section><div className="ops-section-heading"><div><h2>Skill效果</h2><span className="section-range">按业务能力聚合</span></div></div>{[['订单物流查询', '92.9%', '3,046 次成功动作'], ['退款进度查询', '92.5%', '1,984 次成功动作'], ['账号权限处理', '95.4%', '1,604 次成功动作'], ['退换货申请', '85.4%', '1,218 次成功动作']].map(row => <div className="capability-row" key={row[0]}><div><strong>{row[0]}</strong><small>{row[2]}</small></div><i><b style={{ width: row[1] }} /></i><em>{row[1]}</em></div>)}</section><section><div className="ops-section-heading"><div><h2>Tool执行</h2><span className="section-range">失败和耗时来自Tool事件</span></div></div>{[['order.query', '97.8%', '2.96s', '31 次失败'], ['refund.create', '96.4%', '3.16s', '18 次失败'], ['customer.update', '99.2%', '680ms', '6 次失败']].map(row => <div className="tool-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>P95 {row[2]}</span><em>{row[3]}</em></div>)}</section></div>;
}

function ChannelDeliveryFunnel() {
  return <section className="channel-stage-flow"><div className="ops-section-heading"><div><h2>渠道消息链路</h2><span className="section-range">区分接收、标准化、生成、发送与送达</span></div></div><div>{[['渠道收到', '12,840'], ['标准化成功', '12,804'], ['Agent生成回复', '11,868'], ['渠道发送成功', '11,815'], ['确认送达', '11,278']].map((row, index) => <span key={row[0]}><i>{index + 1}</i><strong>{row[0]}</strong><small>{row[1]}</small>{index < 4 && <ArrowUpRight size={15} />}</span>)}</div></section>;
}

function CostResourceSummary() {
  return <div className="cost-summary"><section><div className="ops-section-heading"><div><h2>预算使用</h2><span className="section-range">2026年7月</span></div></div><div className="budget-ring"><strong>68%</strong><span>¥5,218 / ¥7,700</span></div><dl><div><dt>预计月末</dt><dd>¥7,420</dd></div><div><dt>剩余预算</dt><dd>¥2,482</dd></div></dl></section><section><div className="ops-section-heading"><h2>成本构成</h2></div><div className="cost-bars"><span><strong>LLM</strong><i style={{ width: '78%' }} /><em>¥4,476</em></span><span><strong>Tool</strong><i style={{ width: '18%' }} /><em>¥700</em></span><span><strong>ASR</strong><i style={{ width: '4%' }} /><em>¥42</em></span></div></section></div>;
}

function ReportTableSection({ title, headers, rows, onDetail }: { title: string; headers: string[]; rows: string[][]; onDetail: (value: string) => void }) {
  const [query, setQuery] = useState(''); const [descending, setDescending] = useState(false); const [page, setPage] = useState(1);
  const visible = useMemo(() => rows.filter(row => row.join(' ').toLowerCase().includes(query.toLowerCase())).sort((a, b) => descending ? b[1].localeCompare(a[1]) : a[1].localeCompare(b[1])), [rows, query, descending]);
  return <section className="report-detail-table ops-data-section"><div className="ops-section-heading"><h2>{title}</h2><div className="table-actions"><label className="compact-search"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索明细" /></label><button onClick={() => setDescending(value => !value)}><ArrowDownUp size={14} />排序</button></div></div>{visible.length ? <DataTable headers={[...headers, '操作']} rows={visible.map(row => [...row, row[0]])} renderCell={(cell, index) => index === 0 ? <strong>{cell}</strong> : index === headers.length ? <button className="row-action" onClick={() => onDetail(cell)}>查看明细</button> : cell} /> : <EmptyState title="当前筛选下没有数据" onReset={() => setQuery('')} />}<TablePagination page={page} total={visible.length} onPage={setPage} /></section>;
}

function ConversationDrawer({ conversation, onClose, onRun }: { conversation: Conversation; onClose: () => void; onRun: () => void }) {
  return <Drawer title="会话详情" onClose={onClose}><div className="drawer-meta-grid"><span>会话 ID<strong>{conversation.id}</strong></span><span>渠道<strong>{conversation.channel}</strong></span><span>Agent<strong>{conversation.agent}</strong></span><span>版本<strong>{conversation.version}</strong></span></div><section className="conversation-progress"><h3>当前执行</h3><div><StatusPill value={conversation.status} /><strong>{conversation.stage}</strong><time>{conversation.duration}</time></div></section><section className="conversation-transcript"><h3>对话记录</h3><article className="customer"><span>客户</span><p>帮我查一下订单 A20260720001 什么时候送到。</p></article><article className="agent"><span>Agent</span><p>正在为您查询订单物流信息。</p></article></section><button className="primary-action full-width" onClick={onRun}>查看 Run 详情</button></Drawer>;
}

function RunDrawer({ runId, onClose }: { runId: string; onClose: () => void }) {
  const spans = [['接收消息', 'Channel', '82ms', '成功'], ['输入护栏', 'Guardrail', '24ms', '成功'], ['模型规划', 'LLM', '1.12s', '成功'], ['order.query', 'Tool', '860ms', '成功'], ['知识检索', 'RAG', '246ms', '成功'], ['发送回复', 'Channel', '112ms', '成功']];
  return <Drawer title="Run 详情" onClose={onClose} closeLabel="关闭 Run 详情"><div className="run-overview"><strong>{runId}</strong><StatusPill value="成功" /><span>总耗时 2.42s</span><span>4,286 Tokens</span><span>¥0.18</span></div><h3>Span 时间轴</h3><div className="span-timeline">{spans.map((row, index) => <article key={row[0]}><i /><div><strong>{row[0]}</strong><span>{row[1]}</span></div><time>{row[2]}</time><StatusPill value={row[3]} />{index === 3 && <details><summary>查看脱敏输入输出</summary><pre>{'{ "order_id": "A2026****001", "status": "in_transit" }'}</pre></details>}</article>)}</div><section className="run-diagnostics"><h3>执行统计</h3><div><span>重试次数<strong>0</strong></span><span>LLM 调用<strong>1</strong></span><span>Tool 调用<strong>1</strong></span><span>知识召回<strong>4</strong></span></div></section></Drawer>;
}

function ExceptionDialog({ errorCode, onClose, onProcessing }: { errorCode: string; onClose: () => void; onProcessing: () => void }) {
  return <Modal title="事故详情" onClose={onClose}><div className="exception-dialog-summary"><code>{errorCode}</code><strong>影响 86 个会话</strong><span>首次发生 14:14 · 最近发生 14:32 · 当前仍在持续</span></div><div className="incident-impact-grid"><span>受影响Agent<strong>订单服务 Agent</strong></span><span>受影响渠道<strong>Udesk IM、WhatsApp</strong></span><span>异常对象<strong>火山方舟 Doubao</strong></span><span>错误码<strong>MODEL_RATE_LIMIT</strong></span></div><div className="incident-timeline"><h3>处理时间线</h3><span><time>14:14</time>首次达到告警阈值</span><span><time>14:16</time>自动创建事故并通知值班人员</span><span><time>14:20</time>徐立阳开始处理</span><span><time>14:28</time>切换部分流量至备用模型</span></div><label className="stacked-field">负责人<select><option>徐立阳</option><option>姚翔宇</option></select></label><label className="stacked-field">处理备注<textarea defaultValue="已切换30%流量至备用模型，继续观察错误率和P95耗时。" /></label><div className="modal-actions"><button onClick={onClose}>关闭</button><button className="primary-action" onClick={onProcessing}>更新处理进度</button></div></Modal>;
}

function AlertRuleDialog({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return <Modal title="新建告警规则" onClose={onClose}><div className="form-grid"><label>规则名称<input defaultValue="新建告警规则" /></label><label>监控指标<select><option>Tool 错误率</option><option>Tool P95 耗时</option><option>LLM 错误率</option></select></label><label>判断条件<select><option>大于</option><option>小于</option></select></label><label>阈值<input defaultValue="2" /></label><label>统计窗口<select><option>5 分钟</option><option>10 分钟</option></select></label><label>连续触发<select><option>2 个窗口</option><option>3 个窗口</option></select></label><label>适用范围<select><option>全部生产 Agent</option><option>指定 Agent</option></select></label><label>通知方式<select><option>企业微信</option><option>邮件</option></select></label></div><div className="modal-actions"><button onClick={onClose}>取消</button><button className="primary-action" onClick={onSave}>保存规则</button></div></Modal>;
}

function DataStatusDialog({ onClose }: { onClose: () => void }) { return <Modal title="数据采集状态" onClose={onClose}><div className="data-status-list">{[['Conversation', '正常', '刚刚'], ['Run / Span', '正常', '刚刚'], ['渠道事件', '延迟', '延迟 46 秒'], ['成本数据', '正常', '2 分钟前']].map(row => <div key={row[0]}><strong>{row[0]}</strong><StatusPill value={row[1]} /><time>{row[2]}</time></div>)}</div><div className="modal-actions"><button className="primary-action" onClick={onClose}>关闭</button></div></Modal>; }

function MetricDefinitionDialog({ onClose }: { onClose: () => void }) { return <Modal title="指标口径与数据源" onClose={onClose} closeLabel="关闭指标口径"><div className="metric-definition-list">{[['总进线会话', '收到客户消息且产生Conversation的去重会话数', 'Conversation.created'], ['获得回答机会', '进入Agent执行且未被路由、规则或人工提前拦截', 'Agent.opportunity_created'], ['Agent实际回答', '至少有一条Agent消息获得渠道发送成功回执', 'Message.sent_success'], ['产生业务结果', 'Tool业务动作成功、客户确认解决或工单明确关闭', 'BusinessOutcome.created'], ['转人工', '产生Handoff事件且目标为人工队列', 'Handoff.created'], ['Agent受限', 'Agent激活但因规则、工作流、额度或人工介入未获得回答机会', 'Agent.constrained']].map(row => <article key={row[0]}><strong>{row[0]}</strong><p>{row[1]}</p><code>{row[2]}</code><span>每小时更新 · 数据保留180天</span></article>)}</div></Modal>; }

function SaveViewDialog({ onClose, onSave }: { onClose: () => void; onSave: () => void }) { return <Modal title="保存报表视图" onClose={onClose}><label className="stacked-field">视图名称<input defaultValue="我的运营视图" /></label><label className="check-row"><input type="checkbox" />设为默认视图</label><div className="modal-actions"><button onClick={onClose}>取消</button><button className="primary-action" onClick={onSave}>确认保存视图</button></div></Modal>; }

function ExportDialog({ onClose }: { onClose: () => void }) { return <Modal title="导出任务" onClose={onClose}><div className="export-current"><FileDown size={22} /><div><strong>报表明细_20260731.xlsx</strong><StatusPill value="生成中" /></div><span>正在生成 68%</span></div><h3>下载记录</h3><div className="download-history"><span>报表明细_20260724.xlsx<time>2026-07-24 10:32</time><button><Download size={14} />下载</button></span><span>Tool性能_20260718.xlsx<time>2026-07-18 16:08</time><button><Download size={14} />下载</button></span></div><div className="modal-actions"><button className="primary-action" onClick={onClose}>完成</button></div></Modal>; }

function ReportDetailDialog({ title, onClose }: { title: string; onClose: () => void }) { return <Drawer title="明细数据" onClose={onClose}><div className="detail-heading"><strong>{title}</strong><span>当前筛选范围内的关联会话</span></div><DataTable headers={['会话', '渠道', '结果', '发生时间']} rows={[["conv_81A2", 'Udesk IM', 'Contained', '07-20 14:28'], ['conv_7F19', 'WhatsApp', 'Assisted escalation', '07-20 13:46'], ['conv_54E8', 'Udesk IM', 'Verified', '07-20 11:08']]} /></Drawer>; }

function DataTable({ headers, rows, className = '', renderCell }: { headers: string[]; rows: string[][]; className?: string; renderCell?: (cell: string, index: number, rowIndex: number) => React.ReactNode }) { return <div className={`ops-data-table ${className}`} style={{ '--table-columns': headers.length } as React.CSSProperties}><div className="ops-data-row head">{headers.map(header => <span key={header}>{header}</span>)}</div>{rows.map((row, rowIndex) => <div className="ops-data-row" key={`${row[0]}-${rowIndex}`}>{row.map((cell, index) => <span key={`${row[0]}-${index}`}>{renderCell ? renderCell(cell, index, rowIndex) : cell}</span>)}</div>)}</div>; }

function TablePagination({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) { return <footer className="table-pagination"><span>共 {total} 条</span><button aria-label="上一页" disabled={page === 1} onClick={() => onPage(Math.max(1, page - 1))}><ChevronLeft size={14} /></button><strong>{page}</strong><button aria-label="下一页" disabled={total <= 10} onClick={() => onPage(page + 1)}><ChevronRight size={14} /></button></footer>; }
function EmptyState({ title, onReset }: { title: string; onReset: () => void }) { return <div className="ops-empty"><Search size={24} /><strong>{title}</strong><button onClick={onReset}>清除筛选</button></div>; }
function StatusPill({ value }: { value: string }) { const tone = ['运行中', '成功', '正常', '已恢复', '启用'].includes(value) ? 'success' : ['等待工具', '排队中', '自动重试', '处理中', '延迟', '生成中', '风险'].includes(value) ? 'warning' : ['持续发生', '停用', '事故'].includes(value) ? 'danger' : 'neutral'; return <em className={`status-pill ${tone}`}>{value}</em>; }
function MonitorMetric({ icon: Icon, label, value, delta, good, danger }: { icon: typeof Activity; label: string; value: string; delta: string; good?: boolean; danger?: boolean }) { return <section><span><Icon size={17} /></span><div><small>{label}</small><strong>{value}</strong></div><em className={good ? 'good' : danger ? 'danger' : ''}>{delta}</em></section>; }
function ServiceNode({ icon: Icon, name, value }: { icon: typeof Activity; name: string; value: string }) { return <div><span><Icon size={16} /></span><strong>{name}</strong><small>{value}</small><CheckCircle2 size={14} /></div>; }
function ReportKpi({ label, value, delta, good, onInfo }: { label: string; value: string; delta: string; good?: boolean; onInfo: () => void }) { return <section><button aria-label={`查看${label}口径`} onClick={onInfo}><CircleHelp size={13} /></button><small>{label}</small><strong>{value}</strong><span className={good ? 'good' : ''}>{delta} 较上期</span></section>; }
function MiniTrendChart({ label }: { label: string }) { return <div className="mini-trend"><svg viewBox="0 0 640 150" preserveAspectRatio="none" aria-label={label}><polyline points="0,110 80,92 160,96 240,70 320,78 400,50 480,62 560,36 640,42" /></svg><div><span>14:00</span><span>14:10</span><span>14:20</span><span>14:30</span></div></div>; }

function Drawer({ title, onClose, closeLabel = `关闭 ${title}`, children }: { title: string; onClose: () => void; closeLabel?: string; children: React.ReactNode }) { return <div className="drawer-backdrop"><aside className="product-drawer" role="dialog" aria-label={title}><header><h2>{title}</h2><button aria-label={closeLabel} onClick={onClose}><X size={17} /></button></header><div className="drawer-content">{children}</div></aside></div>; }
function Modal({ title, onClose, closeLabel = `关闭 ${title}`, children }: { title: string; onClose: () => void; closeLabel?: string; children: React.ReactNode }) { return <div className="modal-backdrop"><section className="product-modal" role="dialog" aria-label={title}><header><h2>{title}</h2><button aria-label={closeLabel} onClick={onClose}><X size={17} /></button></header><div className="product-modal-body">{children}</div></section></div>; }
