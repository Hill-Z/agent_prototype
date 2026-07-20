import { ChevronRight, CircleAlert, Copy, Link2, MessageSquareText, Plus, RefreshCw, Send, Settings2, Smartphone, Webhook } from 'lucide-react';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Modal } from '../../components/Modal';
import { Switch } from '../../components/Switch';
import channelData from '../../../prototype-content/channels.mock.json';
import connectorData from '../../../prototype-content/overseas-channels.mock.json';

type ChannelStatus = 'connected' | 'authorization';
type WorkspaceMode = 'capabilities' | 'rules' | 'context';
type DialogKind = 'add' | 'settings' | 'fallback' | 'rule' | null;

interface Channel {
  id: string;
  name: string;
  status: ChannelStatus;
  account: string;
  inbound: string[];
  outbound: string[];
  nativeFormats: string[];
  unsupported: string[];
  assetInput: string;
  fallback: string;
}

interface ChannelRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

interface Connector {
  id: string;
  name: string;
  authType: string;
  inboundMode: string;
  outboundMode: string;
  identityKey: string;
  inbound: string[];
  outbound: string[];
  nativeFormats: string[];
  fallback: string;
}

const statusText: Record<ChannelStatus, string> = { connected: '已连接', authorization: '待授权' };
const connectorCatalog = connectorData as Connector[];

export function ChannelWorkspace({ notify }: { notify: (message: string) => void }) {
  const [channels, setChannels] = useState<Channel[]>(() => channelData.channels as Channel[]);
  const [selectedId, setSelectedId] = useState('whatsapp');
  const [mode, setMode] = useState<WorkspaceMode>('capabilities');
  const [previewMode, setPreviewMode] = useState<'native' | 'fallback'>('native');
  const [rules, setRules] = useState<ChannelRule[]>(() => channelData.rules as ChannelRule[]);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [testing, setTesting] = useState(false);
  const selected = useMemo(() => channels.find(item => item.id === selectedId) ?? channels[0], [channels, selectedId]);

  const updateSelected = (patch: Partial<Channel>) => setChannels(current => current.map(channel => channel.id === selected.id ? { ...channel, ...patch } : channel));
  const testConnection = () => {
    setTesting(true);
    window.setTimeout(() => {
      setTesting(false);
      notify(selected.status === 'connected' ? `${selected.name} 连接正常` : `${selected.name} 尚未完成授权`);
    }, 350);
  };

  return <div className="channel-workspace">
    <aside className="channel-list-panel">
      <header><strong>渠道</strong><button aria-label="添加渠道" onClick={() => setDialog('add')}><Plus size={16} /></button></header>
      <div className="channel-list">{channels.map(channel => <button key={channel.id} className={channel.id === selected.id ? 'active' : ''} onClick={() => setSelectedId(channel.id)}>
        <span className={`channel-logo ${channel.id}`}><ChannelIcon id={channel.id} /></span>
        <span><strong>{channel.name}</strong><small>{channel.account}</small></span>
        <em className={channel.status}>{statusText[channel.status]}</em><ChevronRight size={14} />
      </button>)}</div>
    </aside>

    <main className="channel-detail-panel">
      <header className="channel-detail-header"><div><span className={`channel-logo ${selected.id}`}><ChannelIcon id={selected.id} /></span><div><h1>{selected.name}</h1><p>{selected.account}</p></div></div><div className="channel-header-actions"><button className="secondary-button" onClick={testConnection} disabled={testing}><RefreshCw size={14} className={testing ? 'spin' : ''} />{testing ? '检测中' : '测试连接'}</button><button className="primary-button" onClick={() => setDialog('settings')}><Settings2 size={14} />渠道设置</button></div></header>
      <nav className="channel-subnav">{([['capabilities', '消息能力'], ['rules', '行为规则'], ['context', '上下文变量']] as const).map(([value, label]) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}</nav>
      <div className="channel-detail-scroll">
        {mode === 'capabilities' ? <CapabilityView channel={selected} previewMode={previewMode} setPreviewMode={setPreviewMode} editFallback={() => setDialog('fallback')} notify={notify} /> : null}
        {mode === 'rules' ? <RulesView rules={rules} setRules={setRules} createRule={() => setDialog('rule')} notify={notify} /> : null}
        {mode === 'context' ? <ContextView /> : null}
      </div>
    </main>

    {dialog === 'add' ? <AddChannelDialog connectors={connectorCatalog} close={() => setDialog(null)} add={channel => { setChannels(current => [...current, channel]); setSelectedId(channel.id); setDialog(null); notify('渠道已添加，等待授权'); }} /> : null}
    {dialog === 'settings' ? <ChannelSettingsDialog channel={selected} close={() => setDialog(null)} save={patch => { updateSelected(patch); setDialog(null); notify('渠道设置已保存'); }} /> : null}
    {dialog === 'fallback' ? <FallbackDialog value={selected.fallback} close={() => setDialog(null)} save={fallback => { updateSelected({ fallback }); setDialog(null); notify('降级策略已保存'); }} /> : null}
    {dialog === 'rule' ? <RuleDialog close={() => setDialog(null)} save={rule => { setRules(current => [...current, rule]); setDialog(null); notify('渠道规则已创建'); }} /> : null}
  </div>;
}

function ChannelIcon({ id }: { id: string }) {
  if (id === 'udesk_web') return <Smartphone size={17} />;
  if (id === 'whatsapp') return <MessageSquareText size={17} />;
  if (id === 'x_dm') return <strong>𝕏</strong>;
  return <Webhook size={17} />;
}

function CapabilityView({ channel, previewMode, setPreviewMode, editFallback, notify }: { channel: Channel; previewMode: 'native' | 'fallback'; setPreviewMode: (value: 'native' | 'fallback') => void; editFallback: () => void; notify: (message: string) => void }) {
  const copyPreview = () => {
    const payload = JSON.stringify({ channel: channel.id, mode: previewMode, message: '订单 A20260720001 正在配送中' }, null, 2);
    void navigator.clipboard?.writeText(payload).catch(() => undefined);
    notify('消息 JSON 已复制');
  };
  return <div className="channel-capability-layout">
    <section className="channel-capability-main">
      <div className="channel-section-heading"><h2>消息能力</h2></div>
      <CapabilityGroup title="接收" items={channel.inbound} />
      <CapabilityGroup title="发送" items={channel.outbound} />
      <CapabilityGroup title="原生结构" items={channel.nativeFormats} tone="native" />
      <div className="fallback-policy"><strong>结构化消息降级</strong><span>{channel.fallback}</span><button onClick={editFallback}>编辑</button></div>
    </section>
    <aside className="channel-message-preview">
      <header><strong>消息预览</strong><div><button className={previewMode === 'native' ? 'active' : ''} onClick={() => setPreviewMode('native')}>原生</button><button className={previewMode === 'fallback' ? 'active' : ''} onClick={() => setPreviewMode('fallback')}>降级</button></div></header>
      <div className="channel-preview-body"><div className="preview-customer-message">查询订单 A20260720001 的物流</div>{previewMode === 'native' ? <NativePreview channel={channel} notify={notify} /> : <FallbackPreview notify={notify} />}</div>
      <footer><button aria-label="复制消息 JSON" onClick={copyPreview}><Copy size={15} /></button><button aria-label="发送测试消息" onClick={() => notify(`测试消息已发送到 ${channel.name}`)}><Send size={15} /></button></footer>
    </aside>
  </div>;
}

function CapabilityGroup({ title, items, tone = 'default' }: { title: string; items: string[]; tone?: string }) {
  return <div className="capability-matrix-row"><strong>{title}</strong><div>{items.map(item => <span className={tone} key={item}>{item}</span>)}</div></div>;
}

function NativePreview({ channel, notify }: { channel: Channel; notify: (message: string) => void }) {
  if (channel.id === 'whatsapp') return <div className="wa-order-preview"><small>订单状态</small><strong>A20260720001</strong><p>您的包裹已到达本地配送站，预计今天 18:00 前送达。</p><button onClick={() => notify('已打开物流详情')}>查看物流</button><button onClick={() => notify('已发起人工服务')}>联系人工</button></div>;
  if (channel.id === 'udesk_web') return <div className="web-order-preview"><div><small>配送中</small><strong>订单 A20260720001</strong></div><p>预计今天 18:00 前送达</p><div><button onClick={() => notify('已打开物流详情')}>查看物流</button><button onClick={() => notify('已进入售后申请')}>申请售后</button></div></div>;
  return <div className="plain-channel-preview"><p>订单 A20260720001 正在配送中。</p><p>预计今天 18:00 前送达。</p><button className="text-link" onClick={() => notify('已打开物流详情')}>查看物流详情</button></div>;
}

function FallbackPreview({ notify }: { notify: (message: string) => void }) {
  return <div className="plain-channel-preview fallback"><span><CircleAlert size={14} />已降级为文本消息</span><p>订单号：A20260720001<br />状态：配送中<br />预计送达：今天 18:00</p><button className="text-link" onClick={() => notify('已打开物流详情')}><Link2 size={13} />查看物流详情</button></div>;
}

function RulesView({ rules, setRules, createRule, notify }: { rules: ChannelRule[]; setRules: Dispatch<SetStateAction<ChannelRule[]>>; createRule: () => void; notify: (message: string) => void }) {
  return <section className="channel-rules-view"><div className="channel-section-heading"><h2>渠道行为规则</h2><button className="primary-button" onClick={createRule}><Plus size={14} />新建规则</button></div><div className="channel-rule-table"><div className="channel-rule-head"><span>规则</span><span>条件</span><span>执行动作</span><span>状态</span></div>{rules.map(rule => <div className="channel-rule-row" key={rule.id}><span><strong>{rule.name}</strong></span><span>{rule.condition}</span><span>{rule.action}</span><Switch checked={rule.enabled} onChange={enabled => setRules(current => current.map(item => item.id === rule.id ? { ...item, enabled } : item))} label={`启用${rule.name}`} /></div>)}</div><div className="rule-test-strip"><strong>规则测试</strong><button className="secondary-button" onClick={() => notify('规则测试通过')}>运行测试</button></div></section>;
}

function ContextView() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({ 'channel.type': true, 'channel.capabilities': true, 'user.channel_user_id': false, 'conversation.consent_status': true });
  const rows = [
    ['channel.type', '渠道类型', 'Prompt、Tool'],
    ['channel.capabilities', '渠道消息能力', 'Prompt'],
    ['user.channel_user_id', '渠道用户标识', 'Tool、Memory'],
    ['conversation.consent_status', '隐私授权状态', 'Prompt、Tool']
  ];
  return <section className="channel-context-view"><div className="channel-section-heading"><h2>上下文变量</h2></div><div className="context-variable-table"><div className="context-variable-head"><span>变量</span><span>业务含义</span><span>允许使用范围</span><span>启用</span></div>{rows.map(([key, meaning, scope]) => <div className="context-variable-row" key={key}><code>{key}</code><span>{meaning}</span><span>{scope}</span><Switch checked={visibility[key]} onChange={enabled => setVisibility(current => ({ ...current, [key]: enabled }))} label={`启用${key}`} /></div>)}</div></section>;
}

function AddChannelDialog({ connectors, close, add }: { connectors: Connector[]; close: () => void; add: (channel: Channel) => void }) {
  const [connectorId, setConnectorId] = useState(connectors[0]?.id ?? '');
  const [account, setAccount] = useState('');
  const connector = connectors.find(item => item.id === connectorId) ?? connectors[0];
  return <Modal title="添加渠道" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!connector || !account.trim()} onClick={() => add({ id: `${connector.id}_${Date.now()}`, name: connector.name, account: account.trim(), status: 'authorization', inbound: connector.inbound, outbound: connector.outbound, nativeFormats: connector.nativeFormats, unsupported: [], assetInput: connector.identityKey, fallback: connector.fallback })}>添加</button></>}><div className="form-grid"><label>渠道类型<select aria-label="渠道类型" value={connectorId} onChange={event => setConnectorId(event.target.value)}>{connectors.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>账号<input aria-label="渠道账号" value={account} onChange={event => setAccount(event.target.value)} /></label></div></Modal>;
}

function ChannelSettingsDialog({ channel, close, save }: { channel: Channel; close: () => void; save: (patch: Partial<Channel>) => void }) {
  const [account, setAccount] = useState(channel.account);
  const authType = connectorCatalog.find(connector => channel.id.startsWith(connector.id))?.authType ?? (channel.id.startsWith('udesk_web') ? 'Webhook Secret' : 'API Token');
  return <Modal title="渠道设置" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={() => save({ account })}>保存</button></>}><div className="form-grid"><label>账号<input aria-label="渠道设置账号" value={account} onChange={event => setAccount(event.target.value)} /></label><label>鉴权方式<input aria-label="渠道鉴权方式" value={authType} readOnly /></label></div></Modal>;
}

function FallbackDialog({ value, close, save }: { value: string; close: () => void; save: (value: string) => void }) {
  const [fallback, setFallback] = useState(value);
  return <Modal title="编辑降级策略" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!fallback.trim()} onClick={() => save(fallback.trim())}>保存</button></>}><label className="stacked-field">降级格式<select aria-label="降级格式" value={fallback} onChange={event => setFallback(event.target.value)}><option>纯文本 + 链接</option><option>纯文本字段 + 操作链接</option><option>编号选项或模板文本</option><option>仅纯文本</option></select></label></Modal>;
}

function RuleDialog({ close, save }: { close: () => void; save: (rule: ChannelRule) => void }) {
  const [name, setName] = useState('');
  const [condition, setCondition] = useState('首次会话');
  const [action, setAction] = useState('发送隐私模板');
  return <Modal title="新建渠道规则" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!name.trim()} onClick={() => save({ id: `rule-${Date.now()}`, name: name.trim(), condition, action, enabled: true })}>创建</button></>}><div className="form-grid"><label>规则名称<input aria-label="规则名称" value={name} onChange={event => setName(event.target.value)} /></label><label>生效条件<select aria-label="规则生效条件" value={condition} onChange={event => setCondition(event.target.value)}><option>首次会话</option><option>收到图片</option><option>结构化消息不受支持</option><option>消息发送失败</option></select></label></div><label className="stacked-field">执行动作<select aria-label="规则执行动作" value={action} onChange={event => setAction(event.target.value)}><option>发送隐私模板</option><option>优先使用短文本</option><option>降级为文本消息</option><option>转人工处理</option></select></label></Modal>;
}
