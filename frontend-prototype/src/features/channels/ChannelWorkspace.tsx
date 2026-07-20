import { Braces, Check, ChevronRight, CircleAlert, Copy, Image, Link2, MessageSquareText, Plus, RefreshCw, Send, Settings2, ShieldCheck, Smartphone, Webhook } from 'lucide-react';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Switch } from '../../components/Switch';
import channelData from '../../../prototype-content/channels.mock.json';

type Channel = typeof channelData.channels[number];
type WorkspaceMode = 'capabilities' | 'rules' | 'context';

const statusText: Record<Channel['status'], string> = { connected: '已连接', authorization: '待授权' };

export function ChannelWorkspace() {
  const [selectedId, setSelectedId] = useState('whatsapp');
  const [mode, setMode] = useState<WorkspaceMode>('capabilities');
  const [previewMode, setPreviewMode] = useState<'native' | 'fallback'>('native');
  const [rules, setRules] = useState(channelData.rules);
  const selected = useMemo(() => channelData.channels.find(item => item.id === selectedId) ?? channelData.channels[0], [selectedId]);

  return <div className="channel-workspace">
    <aside className="channel-list-panel">
      <header><div><strong>渠道</strong><small>{channelData.channels.filter(item => item.status === 'connected').length} 个已连接</small></div><button aria-label="添加渠道"><Plus size={16} /></button></header>
      <div className="channel-list">{channelData.channels.map(channel => <button key={channel.id} className={channel.id === selected.id ? 'active' : ''} onClick={() => setSelectedId(channel.id)}>
        <span className={`channel-logo ${channel.id}`}><ChannelIcon id={channel.id} /></span>
        <span><strong>{channel.name}</strong><small>{channel.account}</small></span>
        <em className={channel.status}>{statusText[channel.status]}</em><ChevronRight size={14} />
      </button>)}</div>
      <div className="channel-model-note"><Braces size={16} /><span><strong>统一消息模型</strong><small>渠道原始消息先转换为文本、资产和动作，再进入 Agent。</small></span></div>
    </aside>

    <main className="channel-detail-panel">
      <header className="channel-detail-header"><div><span className={`channel-logo ${selected.id}`}><ChannelIcon id={selected.id} /></span><div><h1>{selected.name}</h1><p>{selected.account} · {statusText[selected.status]}</p></div></div><div className="channel-header-actions"><button className="secondary-button"><RefreshCw size={14} />测试连接</button><button className="primary-button"><Settings2 size={14} />渠道设置</button></div></header>
      <nav className="channel-subnav">{([['capabilities', '消息能力'], ['rules', '行为规则'], ['context', '上下文变量']] as const).map(([value, label]) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}</nav>
      <div className="channel-detail-scroll">
        {mode === 'capabilities' ? <CapabilityView channel={selected} previewMode={previewMode} setPreviewMode={setPreviewMode} /> : null}
        {mode === 'rules' ? <RulesView rules={rules} setRules={setRules} channelName={selected.name} /> : null}
        {mode === 'context' ? <ContextView channelName={selected.name} /> : null}
      </div>
    </main>
  </div>;
}

function ChannelIcon({ id }: { id: string }) {
  if (id === 'udesk_web') return <Smartphone size={17} />;
  if (id === 'whatsapp') return <MessageSquareText size={17} />;
  if (id === 'x_dm') return <strong>𝕏</strong>;
  return <Webhook size={17} />;
}

function CapabilityView({ channel, previewMode, setPreviewMode }: { channel: Channel; previewMode: 'native' | 'fallback'; setPreviewMode: (value: 'native' | 'fallback') => void }) {
  return <div className="channel-capability-layout">
    <section className="channel-capability-main">
      <div className="channel-section-heading"><div><h2>消息能力</h2><p>由渠道原生接口决定，不支持的内容按当前降级策略发送。</p></div><span className="capability-source">能力档案 · 2026-07-20</span></div>
      <CapabilityGroup title="接收" items={channel.inbound} />
      <CapabilityGroup title="发送" items={channel.outbound} />
      <CapabilityGroup title="原生结构" items={channel.nativeFormats} tone="native" />
      <div className="channel-contract-row"><div><Image size={17} /><span><strong>媒体进入 Agent</strong><small>{channel.assetInput}</small></span></div><div><ShieldCheck size={17} /><span><strong>不支持</strong><small>{channel.unsupported.join('、')}</small></span></div></div>
      <div className="fallback-policy"><div><strong>降级策略</strong><p>原生结构发送失败或渠道不支持时执行。</p></div><span>{channel.fallback}</span><button>编辑</button></div>
    </section>
    <aside className="channel-message-preview">
      <header><strong>消息预览</strong><div><button className={previewMode === 'native' ? 'active' : ''} onClick={() => setPreviewMode('native')}>原生</button><button className={previewMode === 'fallback' ? 'active' : ''} onClick={() => setPreviewMode('fallback')}>降级</button></div></header>
      <div className="channel-preview-body"><div className="preview-customer-message">查询订单 A20260720001 的物流</div>{previewMode === 'native' ? <NativePreview channel={channel} /> : <FallbackPreview channel={channel} />}</div>
      <footer><span><Check size={13} />预计可发送</span><button aria-label="复制消息 JSON"><Copy size={15} /></button><button aria-label="发送测试消息"><Send size={15} /></button></footer>
    </aside>
  </div>;
}

function CapabilityGroup({ title, items, tone = 'default' }: { title: string; items: string[]; tone?: string }) {
  return <div className="capability-matrix-row"><strong>{title}</strong><div>{items.map(item => <span className={tone} key={item}>{item}</span>)}</div></div>;
}

function NativePreview({ channel }: { channel: Channel }) {
  if (channel.id === 'whatsapp') return <div className="wa-order-preview"><small>订单状态</small><strong>A20260720001</strong><p>您的包裹已到达本地配送站，预计今天 18:00 前送达。</p><button>查看物流</button><button>联系人工</button></div>;
  if (channel.id === 'udesk_web') return <div className="web-order-preview"><div><small>配送中</small><strong>订单 A20260720001</strong></div><p>预计今天 18:00 前送达</p><div><button>查看物流</button><button>申请售后</button></div></div>;
  return <div className="plain-channel-preview"><p>订单 A20260720001 正在配送中。</p><p>预计今天 18:00 前送达。</p><a>查看物流详情</a></div>;
}

function FallbackPreview({ channel }: { channel: Channel }) {
  return <div className="plain-channel-preview fallback"><span><CircleAlert size={14} />已从结构化消息降级</span><p>订单号：A20260720001<br />状态：配送中<br />预计送达：今天 18:00</p><a><Link2 size={13} />查看物流详情</a><small>{channel.fallback}</small></div>;
}

function RulesView({ rules, setRules, channelName }: { rules: typeof channelData.rules; setRules: Dispatch<SetStateAction<typeof channelData.rules>>; channelName: string }) {
  return <section className="channel-rules-view"><div className="channel-section-heading"><div><h2>渠道行为规则</h2><p>按渠道、账号、客户和会话状态改变 Prompt、Skill、Tool 与消息格式。</p></div><button className="primary-button"><Plus size={14} />新建规则</button></div><div className="channel-rule-table"><div className="channel-rule-head"><span>规则</span><span>条件</span><span>执行动作</span><span>状态</span></div>{rules.map(rule => <div className="channel-rule-row" key={rule.id}><span><strong>{rule.name}</strong><small>{rule.id}</small></span><span>{rule.condition}</span><span>{rule.action}</span><Switch checked={rule.enabled} onChange={enabled => setRules(current => current.map(item => item.id === rule.id ? { ...item, enabled } : item))} label={`启用${rule.name}`} /></div>)}</div><div className="rule-test-strip"><span><Braces size={16} /><strong>当前渠道测试上下文</strong><small>{channelName} · 首次会话 · 中文 · 未转人工</small></span><button className="secondary-button">运行规则测试</button></div></section>;
}

function ContextView({ channelName }: { channelName: string }) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({ 'channel.type': true, 'channel.capabilities': true, 'user.channel_user_id': false, 'conversation.consent_status': true });
  const rows = [
    ['channel.type', '渠道类型', 'Prompt、Tool'],
    ['channel.capabilities', '渠道消息能力', 'Prompt'],
    ['user.channel_user_id', '渠道用户标识', 'Tool、Memory'],
    ['conversation.consent_status', '隐私授权状态', 'Prompt、Tool']
  ];
  return <section className="channel-context-view"><div className="channel-section-heading"><div><h2>上下文变量</h2><p>只注入业务使用的变量，避免渠道原始 Payload 和用户标识无条件进入 Prompt。</p></div><span className="capability-source">当前渠道 · {channelName}</span></div><div className="context-variable-table"><div className="context-variable-head"><span>变量</span><span>业务含义</span><span>允许使用范围</span><span>启用</span></div>{rows.map(([key, meaning, scope]) => <div className="context-variable-row" key={key}><code>{key}</code><span>{meaning}</span><span>{scope}</span><Switch checked={visibility[key]} onChange={enabled => setVisibility(current => ({ ...current, [key]: enabled }))} label={`启用${key}`} /></div>)}</div><div className="context-security-note"><ShieldCheck size={17} /><span><strong>字段级可见性</strong><p>每个变量还需分别控制 Prompt、Tool、Memory、日志和脱敏策略；Demo 展示启用入口。</p></span></div></section>;
}
