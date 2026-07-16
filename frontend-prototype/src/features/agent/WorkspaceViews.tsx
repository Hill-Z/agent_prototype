import { useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';

const logs = [
  ['请问用户咨询的具体问题是什么？', '101751675', '4', '已解决', '2026-07-14 20:11:34'],
  ['问候与回应', '102591409', '1', '已解决', '2026-07-11 10:06:51'],
  ['你好问候及回应', '102565984', '1', '已解决', '2026-07-10 20:49:42'],
  ['打除皱针的危害有哪些', '024858fd-9688', '1', '已解决', '2026-07-10 18:04:51']
];

export function ApiDocsView({ notify }: { notify: (message: string) => void }) {
  const snippets = ['POST /v1/agent/54/runs', 'GET /v1/agent/54/checkpoints/{thread_id}', 'Authorization: Bearer <API_KEY>'];
  return <div className="content-page docs-page"><aside><h2>目录</h2>{['高级智能体 API', '基础 URL', '鉴权', '启动/继续 Agent 对话', '查询 checkpoint 历史'].map(item => <a key={item}>{item}</a>)}</aside><article><h1>高级智能体 API</h1><p>通过 HTTP API 启动或继续高级智能体对话，并读取 checkpoint 历史。</p><button className="secondary-button">API 密钥</button>{snippets.map((code, index) => <section key={code}><h2>{index === 0 ? '启动/继续 Agent 对话' : index === 1 ? '查询 checkpoint 历史' : '鉴权'}</h2><div className="code-block"><code>{code}</code><button className="icon-button" onClick={() => notify('代码已复制')}><Copy size={15} /></button></div><h3>Request</h3><div className="code-block"><code>{`{ "message": "你好", "stream": true }`}</code></div></section>)}</article></div>;
}

export function LogsView() {
  const [selected, setSelected] = useState<string | null>(null);
  return <div className="content-page table-page"><p>运行日志实时捕获系统操作轨迹，详细记载用户请求与 AI 反馈的交互过程。</p><div className="data-table"><div className="data-row head"><span>标题</span><span>用户或账户</span><span>消息数</span><span>解决状态</span><span>更新时间</span></div>{logs.map(row => <button className="data-row" key={row[0]} onClick={() => setSelected(row[0])}>{row.map(cell => <span key={cell}>{cell}</span>)}</button>)}</div>{selected ? <aside className="log-detail"><h2>运行详情</h2><strong>{selected}</strong><p>Agent Run 已完成 · 4 个 Trace 事件</p><ol><li>输入护栏检查</li><li>模型推理</li><li>工具调用</li><li>输出护栏检查</li></ol><button className="secondary-button" onClick={() => setSelected(null)}>关闭</button></aside> : null}</div>;
}

function MetricChart({ title, value, tone }: { title: string; value: string; tone: string }) {
  return <section className="metric-chart"><h2>{title}</h2><strong>{value}</strong><div className={`chart-line ${tone}`}><i /><i /><i /><i /></div></section>;
}
export function MonitorView() {
  const [range, setRange] = useState(['2026-07-09', '2026-07-16']);
  return <div className="content-page monitor-page"><div className="monitor-filter"><strong>分析</strong><input type="date" value={range[0]} onChange={e => setRange([e.target.value, range[1]])} /><span>至</span><input type="date" value={range[1]} onChange={e => setRange([range[0], e.target.value])} /></div><div className="metric-grid"><MetricChart title="所有会话次数" value="22" tone="cyan" /><MetricChart title="活跃用户数" value="15" tone="orange" /><MetricChart title="平均会话互动次数" value="2.1" tone="cyan" /><MetricChart title="Token 输出速度" value="0 Token/秒" tone="gray" /></div></div>;
}

export function ReviewView() {
  const [status, setStatus] = useState('待审核'); const [query, setQuery] = useState('');
  return <div className="content-page review-page"><p>审核需要人工确认的工具调用请求，支持批准或拒绝操作。</p><div className="review-filters"><select value={status} onChange={e => setStatus(e.target.value)}><option>待审核</option><option>已批准</option><option>已拒绝</option></select><label className="search-field"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="请输入关键词" /></label></div><div className="empty-review"><Check size={26} /><p>{query ? `没有匹配“${query}”的记录` : `暂无${status}记录`}</p></div></div>;
}
