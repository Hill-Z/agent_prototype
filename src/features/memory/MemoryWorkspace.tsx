import { Check, FileText, KeyRound, Link2, MessageSquareText, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '../../components/Modal';
import { Switch } from '../../components/Switch';
import memoryData from '../../../prototype-content/memory.mock.json';
import type { LongMemoryConfig, MemoryProfileField } from '../agent/agent.types';

type WorkspaceView = 'rules' | 'customers';
type CustomerView = 'profile' | 'summaries';

interface ChannelIdentity {
  id: string;
  name: string;
  account: string;
  status: string;
  source: string;
}

interface ProfileValue {
  key: string;
  name: string;
  value: string;
  source: string;
  channel: string;
  updatedAt: string;
}

interface ConversationSummary {
  id: string;
  conversationId: string;
  channel: string;
  time: string;
  issue: string;
  actions: string[];
  result: string;
  pending: string;
  request: string;
}

interface MemoryCustomer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  updatedAt: string;
  channels: ChannelIdentity[];
  profile: ProfileValue[];
  summaries: ConversationSummary[];
}

export function MemoryWorkspace({ config, update, notify }: { config: LongMemoryConfig; update: (patch: Partial<LongMemoryConfig>) => void; notify: (message: string) => void }) {
  const [view, setView] = useState<WorkspaceView>('rules');
  const [customerView, setCustomerView] = useState<CustomerView>('profile');
  const [customers, setCustomers] = useState<MemoryCustomer[]>(() => structuredClone(memoryData.customers) as MemoryCustomer[]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(memoryData.customers[0].id);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<'backup' | 'field' | 'mapping' | 'profile' | null>(null);
  const selectedCustomer = customers.find(customer => customer.id === selectedCustomerId) ?? customers[0];
  const visibleCustomers = useMemo(() => customers.filter(customer => `${customer.name}${customer.company}${customer.phone}${customer.email}`.toLowerCase().includes(query.trim().toLowerCase())), [customers, query]);

  const updateField = (id: string, patch: Partial<MemoryProfileField>) => update({ profileFields: config.profileFields.map(field => field.id === id ? { ...field, ...patch } : field) });
  const removeField = (id: string) => update({ profileFields: config.profileFields.filter(field => field.id !== id) });
  const updateCustomer = (patch: Partial<MemoryCustomer>) => setCustomers(current => current.map(customer => customer.id === selectedCustomer.id ? { ...customer, ...patch } : customer));

  return <div className="memory-workspace memory-workspace-v2">
    <header className="memory-page-header">
      <div><h1>长期记忆</h1></div>
      <div><strong>{config.enabled ? '已启用' : '未启用'}</strong><Switch checked={config.enabled} onChange={enabled => update({ enabled })} label="启用客户记忆" /></div>
    </header>
    <nav className="memory-view-tabs">
      <button className={view === 'rules' ? 'active' : ''} onClick={() => setView('rules')}>规则配置</button>
      <button className={view === 'customers' ? 'active' : ''} onClick={() => setView('customers')}>客户记忆</button>
    </nav>

    {view === 'rules' ? <div className="memory-rules-layout">
      <aside className="memory-rule-sidebar">
        <section>
          <div className="memory-section-title"><KeyRound size={17} /><strong>客户标识</strong></div>
          <label>主标识<select aria-label="主标识" value={config.identityKey} onChange={event => update({ identityKey: event.target.value })}>{memoryData.identityKeys.map(item => <option key={item}>{item}</option>)}</select></label>
          <div className="backup-key-list"><strong>备用标识</strong>{config.backupKeys.map(key => <span key={key}>{key}<button aria-label={`删除备用标识${key}`} onClick={() => update({ backupKeys: config.backupKeys.filter(item => item !== key) })}><X size={13} /></button></span>)}</div>
          <button className="memory-add-key" onClick={() => setDialog('backup')}><Plus size={14} />添加备用标识</button>
        </section>
        <section>
          <div className="memory-section-title"><MessageSquareText size={17} /><strong>召回设置</strong></div>
          <label>历史小结数量<input aria-label="历史小结数量" type="number" min={1} max={10} value={config.recallCount} onChange={event => update({ recallCount: Number(event.target.value) })} /></label>
          <label>历史记录保留天数<input aria-label="历史记录保留天数" type="number" min={1} value={config.retentionDays} onChange={event => update({ retentionDays: Number(event.target.value) })} /></label>
        </section>
      </aside>

      <main className="memory-rule-main">
        <section className="memory-rule-section">
          <header><div><UserRound size={17} /><strong>客户资料 Profile</strong></div><button className="secondary-button" onClick={() => setDialog('field')}><Plus size={14} />自定义字段</button></header>
          <div className="memory-field-table">
            <div className="memory-field-head"><span>启用</span><span>字段</span><span>Key</span><span>类型</span><span>来源</span><span /></div>
            {config.profileFields.map(field => <div className="memory-field-row" key={field.id}>
              <input aria-label={`启用字段${field.name}`} type="checkbox" checked={field.enabled} onChange={event => updateField(field.id, { enabled: event.target.checked })} />
              <input aria-label={`字段名称${field.key}`} value={field.name} onChange={event => updateField(field.id, { name: event.target.value })} />
              <code>{field.key}</code>
              <select aria-label={`字段类型${field.name}`} value={field.type} onChange={event => updateField(field.id, { type: event.target.value as MemoryProfileField['type'] })}><option>文本</option><option>数字</option><option>日期</option></select>
              <span>{field.source}</span>
              {field.custom ? <button aria-label={`删除字段${field.name}`} onClick={() => removeField(field.id)}><Trash2 size={14} /></button> : <span />}
            </div>)}
          </div>
          <label className="memory-prompt-field">客户资料抽取提示词<textarea aria-label="客户资料抽取提示词" value={config.profilePrompt} onChange={event => update({ profilePrompt: event.target.value })} /></label>
        </section>

        <section className="memory-rule-section">
          <header><div><FileText size={17} /><strong>会话摘要 Summary</strong></div></header>
          <label className="memory-prompt-field">会话摘要提示词<textarea aria-label="会话摘要提示词" value={config.summaryPrompt} onChange={event => update({ summaryPrompt: event.target.value })} /></label>
          <div className="summary-output-schema"><span>客户问题</span><span>已执行操作</span><span>处理结果</span><span>未解决事项</span><span>客户诉求</span><span>下一步动作</span></div>
        </section>
      </main>
    </div> : <div className="customer-memory-layout">
      <aside className="memory-customer-list">
        <div className="memory-search"><Search size={15} /><input aria-label="搜索客户" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索客户" /></div>
        <div>{visibleCustomers.map(customer => <button key={customer.id} className={selectedCustomer.id === customer.id ? 'active' : ''} onClick={() => setSelectedCustomerId(customer.id)}><span>{customer.name.slice(0, 1)}</span><div><strong>{customer.name}</strong><small>{customer.company}</small></div><em>{customer.channels.length}</em></button>)}</div>
      </aside>
      <main className="customer-memory-detail">
        <header className="customer-memory-header"><span className="customer-avatar">{selectedCustomer.name.slice(0, 1)}</span><div><h2>{selectedCustomer.name}</h2><code>{selectedCustomer.id}</code></div><button className="secondary-button" onClick={() => setDialog('mapping')}><Link2 size={14} />身份绑定</button></header>
        <div className="customer-identity-strip">{selectedCustomer.channels.map(identity => <span key={identity.id}><strong>{identity.name}</strong><code>{identity.account}</code><em><Check size={11} />{identity.status}</em></span>)}</div>
        <nav className="customer-memory-tabs"><button className={customerView === 'profile' ? 'active' : ''} onClick={() => setCustomerView('profile')}>客户资料</button><button className={customerView === 'summaries' ? 'active' : ''} onClick={() => setCustomerView('summaries')}>会话摘要</button></nav>
        {customerView === 'profile' ? <section className="customer-profile-panel">
          <header><strong>客户资料</strong><button className="secondary-button" onClick={() => setDialog('profile')}><Plus size={14} />添加资料</button></header>
          <div className="customer-profile-table"><div className="customer-profile-head"><span>字段</span><span>值</span><span>来源</span><span>更新时间</span><span /></div>{selectedCustomer.profile.map(item => <div className="customer-profile-row" key={item.key}><strong>{item.name}</strong><span>{item.value}</span><span>{item.source} · {item.channel}</span><time>{item.updatedAt}</time><button aria-label={`删除资料${item.name}`} onClick={() => { updateCustomer({ profile: selectedCustomer.profile.filter(profile => profile.key !== item.key) }); notify('客户资料已删除'); }}><Trash2 size={14} /></button></div>)}</div>
        </section> : <section className="customer-summary-list">{selectedCustomer.summaries.map(summary => <article key={summary.id}><header><span>{summary.channel}</span><time>{summary.time}</time><button onClick={() => notify(`打开原始会话 ${summary.conversationId}`)}>查看对话</button></header><h3>{summary.issue}</h3><dl><div><dt>已执行</dt><dd>{summary.actions.join('、')}</dd></div><div><dt>处理结果</dt><dd>{summary.result}</dd></div>{summary.pending ? <div className="pending"><dt>未解决</dt><dd>{summary.pending}</dd></div> : null}<div><dt>客户诉求</dt><dd>{summary.request}</dd></div></dl></article>)}</section>}
      </main>
    </div>}

    {dialog === 'backup' ? <BackupKeyDialog current={[config.identityKey, ...config.backupKeys]} close={() => setDialog(null)} add={key => { update({ backupKeys: [...config.backupKeys, key] }); setDialog(null); notify('备用标识已添加'); }} /> : null}
    {dialog === 'field' ? <ProfileFieldDialog close={() => setDialog(null)} add={field => { update({ profileFields: [...config.profileFields, field] }); setDialog(null); notify('自定义字段已添加'); }} /> : null}
    {dialog === 'mapping' ? <IdentityMappingDialog customer={selectedCustomer} close={() => setDialog(null)} update={channels => updateCustomer({ channels })} notify={notify} /> : null}
    {dialog === 'profile' ? <AddProfileDialog fields={config.profileFields} close={() => setDialog(null)} add={item => { updateCustomer({ profile: [...selectedCustomer.profile.filter(profile => profile.key !== item.key), item] }); setDialog(null); notify('客户资料已保存'); }} /> : null}
  </div>;
}

function BackupKeyDialog({ current, close, add }: { current: string[]; close: () => void; add: (key: string) => void }) {
  const options = memoryData.identityKeys.filter(item => !current.includes(item));
  const [key, setKey] = useState(options[0] ?? '');
  return <Modal title="添加备用标识" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!key} onClick={() => add(key)}>添加</button></>}><label className="stacked-field">标识字段<select aria-label="备用标识字段" value={key} onChange={event => setKey(event.target.value)}>{options.map(item => <option key={item}>{item}</option>)}</select></label></Modal>;
}

function ProfileFieldDialog({ close, add }: { close: () => void; add: (field: MemoryProfileField) => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState<MemoryProfileField['type']>('文本');
  return <Modal title="添加自定义字段" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!name.trim() || !key.trim()} onClick={() => add({ id: `memory-field-${Date.now()}`, name: name.trim(), key: key.trim(), type, source: '提示词抽取', enabled: true, custom: true })}>添加</button></>}><div className="form-grid"><label>字段名称<input aria-label="自定义字段名称" value={name} onChange={event => setName(event.target.value)} /></label><label>字段 Key<input aria-label="自定义字段 Key" value={key} onChange={event => setKey(event.target.value)} /></label><label>字段类型<select aria-label="自定义字段类型" value={type} onChange={event => setType(event.target.value as MemoryProfileField['type'])}><option>文本</option><option>数字</option><option>日期</option></select></label></div></Modal>;
}

function IdentityMappingDialog({ customer, close, update, notify }: { customer: MemoryCustomer; close: () => void; update: (channels: ChannelIdentity[]) => void; notify: (message: string) => void }) {
  const [channel, setChannel] = useState('Udesk IM');
  const [account, setAccount] = useState('');
  const bind = () => {
    update([...customer.channels, { id: `identity-${Date.now()}`, name: channel, account: account.trim(), status: '待验证', source: '人工绑定' }]);
    setAccount('');
    notify('渠道身份已绑定');
  };
  return <Modal wide title="身份绑定" onClose={close} footer={<button className="primary-button" onClick={close}>完成</button>}><div className="identity-binding-list">{customer.channels.map(identity => <div key={identity.id}><strong>{identity.name}</strong><code>{identity.account}</code><span>{identity.status}</span><small>{identity.source}</small><button aria-label={`解除绑定${identity.name}`} onClick={() => update(customer.channels.filter(item => item.id !== identity.id))}><Trash2 size={14} /></button></div>)}</div><div className="identity-bind-form"><label>渠道<select aria-label="绑定渠道" value={channel} onChange={event => setChannel(event.target.value)}><option>Udesk IM</option><option>网页插件</option><option>WhatsApp</option><option>X Direct Messages</option><option>Telegram</option></select></label><label>渠道用户标识<input aria-label="渠道用户标识" value={account} onChange={event => setAccount(event.target.value)} /></label><button className="secondary-button" disabled={!account.trim()} onClick={bind}><Link2 size={14} />绑定</button></div></Modal>;
}

function AddProfileDialog({ fields, close, add }: { fields: MemoryProfileField[]; close: () => void; add: (item: ProfileValue) => void }) {
  const enabledFields = fields.filter(field => field.enabled);
  const [key, setKey] = useState(enabledFields[0]?.key ?? '');
  const [value, setValue] = useState('');
  const [channel, setChannel] = useState('人工录入');
  const field = enabledFields.find(item => item.key === key);
  return <Modal title="添加客户资料" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!field || !value.trim()} onClick={() => add({ key, name: field?.name ?? key, value: value.trim(), source: '人工录入', channel, updatedAt: '2026-07-22 12:30' })}>保存</button></>}><div className="form-grid"><label>字段<select aria-label="客户资料字段" value={key} onChange={event => setKey(event.target.value)}>{enabledFields.map(item => <option key={item.id} value={item.key}>{item.name}</option>)}</select></label><label>值<input aria-label="客户资料值" value={value} onChange={event => setValue(event.target.value)} /></label><label>来源渠道<select aria-label="资料来源渠道" value={channel} onChange={event => setChannel(event.target.value)}><option>人工录入</option><option>Udesk IM</option><option>网页插件</option><option>WhatsApp</option></select></label></div></Modal>;
}
