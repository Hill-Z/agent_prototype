import { AlertTriangle, Check, Clock3, GitMerge, KeyRound, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '../../components/Modal';
import memoryData from '../../../prototype-content/memory.mock.json';

type MemoryFilter = '全部' | '事实' | '偏好' | '任务' | '状态';
type MemoryStatus = 'active' | 'conflict';

interface MemoryRecord {
  id: string;
  type: string;
  key: string;
  value: string;
  channel: string;
  time: string;
  status: MemoryStatus;
  confidence: number;
}

export function MemoryWorkspace({ notify }: { notify: (message: string) => void }) {
  const [identityKey, setIdentityKey] = useState('统一客户 ID');
  const [backupKeys, setBackupKeys] = useState<string[]>(['手机号']);
  const [records, setRecords] = useState<MemoryRecord[]>(() => memoryData.timeline as MemoryRecord[]);
  const [filter, setFilter] = useState<MemoryFilter>('全部');
  const [dialog, setDialog] = useState<'backup' | 'mapping' | 'add' | null>(null);
  const [conflictOpen, setConflictOpen] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [forgetPolicy, setForgetPolicy] = useState('按记忆类型');
  const visibleRecords = useMemo(() => records.filter(item => filter === '全部' || item.type === filter || (filter === '状态' && item.status === 'conflict')), [filter, records]);

  const resolveConflict = () => {
    setRecords(current => current.map(item => item.key === memoryData.conflict.key ? { ...item, value: memoryData.conflict.current, status: 'active', confidence: 1 } : item));
    setResolved(true);
    notify('记忆冲突已处理');
  };

  return <div className="memory-workspace">
    <header className="memory-page-header"><h1>长期记忆</h1></header>
    <div className="memory-layout">
      <aside className="memory-config-panel">
        <section>
          <div className="memory-section-title"><KeyRound size={17} /><strong>客户标识 Key</strong></div>
          <label>主标识<select value={identityKey} onChange={event => setIdentityKey(event.target.value)}>{memoryData.identityKeys.map(item => <option key={item}>{item}</option>)}</select></label>
          {backupKeys.length ? <div className="backup-key-list"><strong>备用标识</strong>{backupKeys.map(key => <span key={key}>{key}<button aria-label={`删除备用标识${key}`} onClick={() => setBackupKeys(current => current.filter(item => item !== key))}><X size={13} /></button></span>)}</div> : null}
          <button className="memory-add-key" onClick={() => setDialog('backup')}><Plus size={14} />添加备用标识</button>
        </section>
        <section>
          <div className="memory-section-title"><Clock3 size={17} /><strong>抽取与遗忘</strong></div>
          <label>抽取时机<select aria-label="记忆抽取时机"><option>会话结束 + 业务事件</option><option>仅会话结束</option><option>实时抽取</option></select></label>
          <label>遗忘策略<select value={forgetPolicy} onChange={event => setForgetPolicy(event.target.value)}><option>按记忆类型</option><option>统一有效期</option><option>仅手动删除</option></select></label>
        </section>
        <section>
          <div className="memory-section-title"><ShieldCheck size={17} /><strong>写入限制</strong></div>
          <label className="memory-check"><input type="checkbox" defaultChecked />仅写入高置信记忆</label>
          <label className="memory-check"><input type="checkbox" defaultChecked />保留来源消息与渠道</label>
          <label className="memory-check"><input type="checkbox" defaultChecked />高风险字段需要人工确认</label>
        </section>
      </aside>
      <main className="memory-timeline-panel">
        <div className="memory-customer-header"><span className="customer-avatar">AM</span><div><strong>ABC Manufacturing</strong></div><button className="secondary-button" onClick={() => setDialog('mapping')}>身份映射</button></div>
        <div className="memory-filter-row"><div>{(['全部', '事实', '偏好', '任务', '状态'] as MemoryFilter[]).map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="secondary-button" onClick={() => setDialog('add')}><Plus size={14} />人工添加</button></div>
        <div className="memory-timeline">{visibleRecords.length ? visibleRecords.map(item => <article key={item.id} className={item.status === 'conflict' ? 'conflict' : ''}><span className="memory-node" /><div className="memory-time"><strong>{item.time.split(' ')[0]}</strong><small>{item.time.split(' ')[1]}</small></div><div className="memory-record"><header><span>{item.type}</span><code>{item.key}</code>{item.status === 'conflict' ? <em><AlertTriangle size={12} />待解决冲突</em> : <em className="active"><Check size={12} />生效中</em>}</header><strong>{item.value}</strong><footer><span>{item.channel}</span><span>{(item.confidence * 100).toFixed(0)}%</span><button aria-label={`删除${item.key}`} onClick={() => { setRecords(current => current.filter(record => record.id !== item.id)); notify('记忆已删除'); }}><Trash2 size={14} /></button></footer></div></article>) : <div className="memory-empty">暂无{filter}记忆</div>}</div>
      </main>
      <aside className="memory-conflict-panel">
        <header><GitMerge size={17} /><strong>冲突处理</strong></header>{conflictOpen && !resolved ? <div className="memory-conflict-card"><span>字段 · <code>{memoryData.conflict.key}</code></span><div><small>当前值 · {memoryData.conflict.currentSource}</small><strong>{memoryData.conflict.current}</strong></div><div className="incoming"><small>新值 · {memoryData.conflict.incomingSource}</small><strong>{memoryData.conflict.incoming}</strong></div><p>推荐：{memoryData.conflict.recommended}</p><button className="primary-button" onClick={resolveConflict}>采用推荐结果</button><button className="secondary-button" onClick={() => setConflictOpen(false)}>稍后处理</button></div> : <div className="conflict-empty"><Check size={22} /><strong>{resolved ? '冲突已解决' : '已暂时收起'}</strong></div>}
      </aside>
    </div>

    {dialog === 'backup' ? <BackupKeyDialog current={[identityKey, ...backupKeys]} close={() => setDialog(null)} add={key => { setBackupKeys(current => [...current, key]); setDialog(null); notify('备用标识已添加'); }} /> : null}
    {dialog === 'mapping' ? <IdentityMappingDialog close={() => setDialog(null)} /> : null}
    {dialog === 'add' ? <AddMemoryDialog close={() => setDialog(null)} add={record => { setRecords(current => [record, ...current]); setDialog(null); notify('记忆已添加'); }} /> : null}
  </div>;
}

function BackupKeyDialog({ current, close, add }: { current: string[]; close: () => void; add: (key: string) => void }) {
  const options = memoryData.identityKeys.filter(item => !current.includes(item));
  const [key, setKey] = useState(options[0] ?? '');
  return <Modal title="添加备用标识" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!key} onClick={() => add(key)}>添加</button></>}><label className="stacked-field">标识字段<select aria-label="备用标识字段" value={key} onChange={event => setKey(event.target.value)}>{options.map(item => <option key={item}>{item}</option>)}</select></label></Modal>;
}

function IdentityMappingDialog({ close }: { close: () => void }) {
  const mappings = [['Udesk IM', 'udesk_981273'], ['网页插件', 'web_88201'], ['WhatsApp', 'wa_6580002026']];
  return <Modal title="身份映射" onClose={close} footer={<button className="primary-button" onClick={close}>完成</button>}><div className="identity-mapping-list">{mappings.map(([channel, id]) => <div key={channel}><strong>{channel}</strong><code>{id}</code><Check size={15} /></div>)}</div></Modal>;
}

function AddMemoryDialog({ close, add }: { close: () => void; add: (record: MemoryRecord) => void }) {
  const [type, setType] = useState('事实');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [channel, setChannel] = useState('人工录入');
  return <Modal title="人工添加记忆" onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!key.trim() || !value.trim()} onClick={() => add({ id: `memory-${Date.now()}`, type, key: key.trim(), value: value.trim(), channel, time: '2026-07-20 17:30', status: 'active', confidence: 1 })}>添加</button></>}><div className="form-grid"><label>记忆类型<select aria-label="记忆类型" value={type} onChange={event => setType(event.target.value)}><option>事实</option><option>偏好</option><option>任务</option><option>状态</option></select></label><label>来源<select aria-label="记忆来源" value={channel} onChange={event => setChannel(event.target.value)}><option>人工录入</option><option>Udesk IM</option><option>网页插件</option><option>WhatsApp</option></select></label><label>Key<input aria-label="记忆 Key" value={key} onChange={event => setKey(event.target.value)} /></label><label>值<input aria-label="记忆值" value={value} onChange={event => setValue(event.target.value)} /></label></div></Modal>;
}
