import { Activity, ArrowUpRight, CheckCircle2, Clock3, Gauge, MessageSquareText, Route, ShieldAlert, Wrench } from 'lucide-react';
import { useState } from 'react';

const channelHealth = [
  ['Udesk IM', '正常', '99.98%', '420ms', '0.02%'],
  ['网页插件', '正常', '99.99%', '380ms', '0.01%'],
  ['WhatsApp', '波动', '98.72%', '1.2s', '1.28%'],
  ['X Direct Messages', '待授权', '--', '--', '--']
];

export function RealtimeMonitorView() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  return <div className="observability-page"><header className="observability-header"><div><h1>监控</h1><p>实时查看运行健康度、渠道异常与 Agent 链路。</p></div><div><span className="live-indicator"><i />实时</span><button className={autoRefresh ? 'active' : ''} onClick={() => setAutoRefresh(value => !value)}>自动刷新</button></div></header>
    <div className="monitor-summary"><MonitorMetric icon={Activity} label="运行中 Run" value="18" delta="+4" /><MonitorMetric icon={Clock3} label="P95 完整耗时" value="4.8s" delta="-0.6s" good /><MonitorMetric icon={ShieldAlert} label="待处理告警" value="3" delta="1 个高优" danger /><MonitorMetric icon={Route} label="渠道降级率" value="2.4%" delta="+0.8%" danger /></div>
    <div className="monitor-main-grid"><section className="channel-health-section"><div className="ops-section-heading"><div><h2>渠道健康度</h2><p>最近 15 分钟</p></div><button>查看全部</button></div><div className="health-table"><div><span>渠道</span><span>状态</span><span>发送成功率</span><span>P95 延迟</span><span>失败率</span></div>{channelHealth.map(row => <button key={row[0]}>{row.map((cell, index) => <span key={`${row[0]}-${index}`} className={index === 1 ? `health-${cell}` : ''}>{cell}</span>)}</button>)}</div></section><section className="alert-feed"><div className="ops-section-heading"><div><h2>告警</h2><p>按影响范围排序</p></div></div><AlertItem level="高" title="WhatsApp 模板发送失败率升高" detail="账号 +65 8000 2026 · 过去 10 分钟 18 次" /><AlertItem level="中" title="订单工具 P95 超过 3 秒" detail="order.query · 影响 6 个 Run" /><AlertItem level="低" title="记忆冲突数量上升" detail="city 字段 · 4 条待确认" /></section></div>
    <section className="runtime-service-strip"><div className="ops-section-heading"><div><h2>Agent 运行链路</h2><p>最近一次成功运行 · run_8f31</p></div><button>打开 Trace <ArrowUpRight size={14} /></button></div><div className="service-nodes"><ServiceNode icon={MessageSquareText} name="渠道接入" value="82ms" /><ServiceNode icon={ShieldAlert} name="输入护栏" value="24ms" /><ServiceNode icon={Gauge} name="模型规划" value="1.2s" /><ServiceNode icon={Wrench} name="工具调用" value="860ms" /><ServiceNode icon={Route} name="渠道渲染" value="38ms" /></div></section>
  </div>;
}

function MonitorMetric({ icon: Icon, label, value, delta, good, danger }: { icon: typeof Activity; label: string; value: string; delta: string; good?: boolean; danger?: boolean }) { return <section><span><Icon size={17} /></span><div><small>{label}</small><strong>{value}</strong></div><em className={good ? 'good' : danger ? 'danger' : ''}>{delta}</em></section>; }
function AlertItem({ level, title, detail }: { level: string; title: string; detail: string }) { return <button className="alert-item"><span className={`alert-level level-${level}`}>{level}</span><div><strong>{title}</strong><small>{detail}</small></div><ArrowUpRight size={14} /></button>; }
function ServiceNode({ icon: Icon, name, value }: { icon: typeof Activity; name: string; value: string }) { return <div><span><Icon size={16} /></span><strong>{name}</strong><small>{value}</small><CheckCircle2 size={14} /></div>; }

export function ReportsView() {
  const [dimension, setDimension] = useState('渠道效果');
  const [range, setRange] = useState('近 30 天');
  return <div className="reports-page"><header className="observability-header"><div><h1>报表</h1><p>分析运营效果、Agent 表现、渠道质量和成本变化。</p></div><div><select value={range} onChange={event => setRange(event.target.value)}><option>近 7 天</option><option>近 30 天</option><option>本季度</option></select><button className="secondary-button">导出报表</button></div></header>
    <nav className="report-tabs">{['运营效果', 'Agent 效果', '渠道效果', '成本', '版本对比'].map(item => <button key={item} className={dimension === item ? 'active' : ''} onClick={() => setDimension(item)}>{item}</button>)}</nav>
    <div className="report-kpis"><ReportKpi label="会话数" value="12,840" delta="+18.6%" /><ReportKpi label="Agent 解决率" value="76.4%" delta="+4.2%" /><ReportKpi label="渠道发送成功率" value="99.12%" delta="-0.3%" down /><ReportKpi label="单解决成本" value="¥0.84" delta="-12.1%" /></div>
    <div className="report-grid"><section className="trend-report"><div className="ops-section-heading"><div><h2>{dimension}趋势</h2><p>{range} · 按日</p></div><span className="report-legend"><i />发送成功率 <i />解决率</span></div><div className="trend-chart"><div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div><div className="chart-plot"><svg viewBox="0 0 640 190" preserveAspectRatio="none" aria-label="渠道效果趋势图"><polyline points="0,38 80,32 160,40 240,25 320,30 400,20 480,24 560,15 640,18" /><polyline className="secondary" points="0,92 80,84 160,88 240,72 320,70 400,60 480,64 560,48 640,44" /></svg><div className="chart-x"><span>06-21</span><span>06-28</span><span>07-05</span><span>07-12</span><span>07-20</span></div></div></div></section><section className="channel-distribution"><div className="ops-section-heading"><div><h2>渠道分布</h2><p>按会话数</p></div></div><div className="distribution-donut"><div><strong>12,840</strong><small>总会话</small></div></div><ul><li><i className="udesk" />Udesk IM <strong>38%</strong></li><li><i className="web" />网页插件 <strong>31%</strong></li><li><i className="wa" />WhatsApp <strong>27%</strong></li><li><i className="x" />X <strong>4%</strong></li></ul></section></div>
    <section className="report-detail-table"><div className="ops-section-heading"><div><h2>渠道明细</h2><p>用于定位渠道体验和适配问题</p></div></div><div className="report-table-row head"><span>渠道</span><span>会话数</span><span>解决率</span><span>发送成功率</span><span>结构化消息率</span><span>降级率</span></div>{[['Udesk IM','4,879','78.2%','99.96%','12.4%','0.3%'],['网页插件','3,980','81.6%','99.98%','44.8%','0.1%'],['WhatsApp','3,467','70.8%','98.72%','36.2%','4.7%'],['X Direct Messages','514','62.1%','--','0%','100%']].map(row => <div className="report-table-row" key={row[0]}>{row.map((cell, index) => <span key={`${row[0]}-${index}`}>{cell}</span>)}</div>)}</section>
  </div>;
}

function ReportKpi({ label, value, delta, down }: { label: string; value: string; delta: string; down?: boolean }) { return <section><small>{label}</small><strong>{value}</strong><span className={down ? 'down' : ''}>{delta} 较上期</span></section>; }
