import { AlertTriangle, Check, Clock3, GitMerge, KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '../../components/Switch';
import memoryData from '../../../prototype-content/memory.mock.json';

export function MemoryWorkspace() {
  const [enabled, setEnabled] = useState(true);
  const [identityKey, setIdentityKey] = useState('统一客户 ID');
  const [conflictOpen, setConflictOpen] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [forgetPolicy, setForgetPolicy] = useState('按记忆类型');
  return <div className="memory-workspace">
    <header className="memory-page-header"><div><h1>长期记忆</h1><p>跨渠道识别同一客户，保留带时间和来源的事实，并管理冲突与遗忘。</p></div><div><span className="memory-status"><i />服务正常</span><Switch checked={enabled} onChange={setEnabled} label="启用长期记忆" /></div></header>
    <div className="memory-layout">
      <aside className="memory-config-panel">
        <section><div className="memory-section-title"><KeyRound size={17} /><div><strong>客户标识 Key</strong><small>始终附加 tenant_id 与 namespace</small></div></div><label>主标识<select value={identityKey} onChange={event => setIdentityKey(event.target.value)}>{memoryData.identityKeys.map(item => <option key={item}>{item}</option>)}</select></label><button className="memory-add-key"><Plus size={14} />添加备用标识</button><div className="identity-preview"><small>最终记忆主体</small><code>tenant_65 / customer / {'{{'}{identityKey}{'}}'}</code></div></section>
        <section><div className="memory-section-title"><Clock3 size={17} /><div><strong>抽取与遗忘</strong><small>按记忆类型独立管理生命周期</small></div></div><label>抽取时机<select><option>会话结束 + 业务事件</option><option>仅会话结束</option><option>实时抽取</option></select></label><label>遗忘策略<select value={forgetPolicy} onChange={event => setForgetPolicy(event.target.value)}><option>按记忆类型</option><option>统一有效期</option><option>仅手动删除</option></select></label><div className="memory-policy-list"><span><strong>偏好</strong><small>长期保留</small></span><span><strong>任务</strong><small>完成后 90 天</small></span><span><strong>临时上下文</strong><small>会话结束删除</small></span></div></section>
        <section><div className="memory-section-title"><ShieldCheck size={17} /><div><strong>写入限制</strong><small>敏感信息不由模型自动写入</small></div></div><label className="memory-check"><input type="checkbox" defaultChecked />仅写入高置信记忆</label><label className="memory-check"><input type="checkbox" defaultChecked />保留来源消息与渠道</label><label className="memory-check"><input type="checkbox" defaultChecked />高风险字段需要人工确认</label></section>
      </aside>
      <main className="memory-timeline-panel">
        <div className="memory-customer-header"><span className="customer-avatar">AM</span><div><strong>ABC Manufacturing</strong><small>统一客户 ID · C-PL-2001 · 3 个已绑定渠道</small></div><button className="secondary-button">查看身份映射</button></div>
        <div className="memory-filter-row"><div><button className="active">全部</button><button>事实</button><button>偏好</button><button>任务</button><button>状态</button></div><button className="secondary-button"><Plus size={14} />人工添加</button></div>
        <div className="memory-timeline">{memoryData.timeline.map(item => <article key={item.id} className={item.status === 'conflict' ? 'conflict' : ''}><span className="memory-node" /><div className="memory-time"><strong>{item.time.split(' ')[0]}</strong><small>{item.time.split(' ')[1]}</small></div><div className="memory-record"><header><span>{item.type}</span><code>{item.key}</code>{item.status === 'conflict' ? <em><AlertTriangle size={12} />待解决冲突</em> : <em className="active"><Check size={12} />生效中</em>}</header><strong>{item.value}</strong><footer><span>来源 · {item.channel}</span><span>置信度 · {(item.confidence * 100).toFixed(0)}%</span><button aria-label={`删除${item.key}`}><Trash2 size={14} /></button></footer></div></article>)}</div>
      </main>
      <aside className="memory-conflict-panel">
        <header><GitMerge size={17} /><div><strong>冲突处理</strong><small>1 条需要确认</small></div></header>{conflictOpen && !resolved ? <div className="memory-conflict-card"><span>字段 · <code>{memoryData.conflict.key}</code></span><div><small>当前值 · {memoryData.conflict.currentSource}</small><strong>{memoryData.conflict.current}</strong></div><div className="incoming"><small>新值 · {memoryData.conflict.incomingSource}</small><strong>{memoryData.conflict.incoming}</strong></div><p>推荐：{memoryData.conflict.recommended}</p><button className="primary-button" onClick={() => setResolved(true)}>采用推荐结果</button><button className="secondary-button" onClick={() => setConflictOpen(false)}>稍后处理</button></div> : <div className="conflict-empty"><Check size={22} /><strong>{resolved ? '冲突已解决' : '已暂时收起'}</strong><p>{resolved ? '保留杭州，并将上海标记为已取代。' : '可在记忆审计中重新打开。'}</p></div>}</aside>
    </div>
  </div>;
}
