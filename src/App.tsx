import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { Archive, ArrowLeft, Blocks, Bot, BrainCircuit, ChevronDown, CircleGauge, Clock3, Database, FileText, GalleryVerticalEnd, GripVertical, History, Layers3, ListChecks, MemoryStick, MessageSquareText, PanelLeftClose, PenLine, Play, Plus, RotateCcw, Save, Settings, SlidersHorizontal, Sparkles, TableProperties, Tags, UserRoundCheck, Variable, WandSparkles, Wrench } from 'lucide-react';
import { ConfigSection } from './components/ConfigSection';
import { Switch } from './components/Switch';
import { ConfigDialogs, type DialogKind } from './features/agent/ConfigDialogs';
import { loadAgentConfig, loadSavedSnapshot, persistAgentConfig, saveAgentSnapshot } from './features/agent/agent.storage';
import { createId, type AgentConfig, type WorkspaceTab } from './features/agent/agent.types';
import { ApiDocsView, LogsView, ReviewView } from './features/agent/WorkspaceViews';
import { GuardrailSection } from './features/guardrail/GuardrailSection';
import { guardrailReducer } from './features/guardrail/guardrail.reducer';
import { loadGuardrailConfig, saveGuardrailConfig } from './features/guardrail/guardrail.storage';
import { ResponseExperienceSection } from './features/runtime/ResponseExperienceSection';
import { ConversationBehaviorSection } from './features/runtime/ConversationBehaviorSection';
import { MultimodalInputSection } from './features/runtime/MultimodalInputSection';
import { ProactiveServiceSection } from './features/runtime/ProactiveServiceSection';
import { PlanningSection } from './features/runtime/PlanningSection';
import { RuntimePreviewPanel } from './features/runtime/RuntimePreviewPanel';
import { SkillManagementPage } from './features/skills/SkillManagementPage';
import { ToolManagementPage } from './features/tools/ToolManagementPage';
import { ChannelWorkspace } from './features/channels/ChannelWorkspace';
import { MemoryWorkspace } from './features/memory/MemoryWorkspace';
import { RealtimeMonitorView, ReportsView } from './features/observability/ObservabilityViews';
import { CardManagementPage } from './features/cards/CardManagementPage';
import './styles.css';
import './features/cards/cards-shell.css';

const navItems = [
  { icon: Layers3, label: '应用' }, { icon: CircleGauge, label: '高级智能体', area: 'agent' as const }, { icon: MessageSquareText, label: '渠道', area: 'channels' as const }, { icon: Database, label: '知识库' }, { icon: BrainCircuit, label: '记忆库', area: 'memory' as const }, { icon: Archive, label: '专业词库' }, { icon: ListChecks, label: '问答对' }, { icon: Play, label: '工作流' }, { icon: FileText, label: '文档' }, { icon: TableProperties, label: '数据表' }, { icon: Blocks, label: 'MCP' }, { icon: UserRoundCheck, label: '人工审核' }, { icon: Tags, label: '标签' }, { icon: Wrench, label: '工具', area: 'tools' as const }, { icon: WandSparkles, label: '技能', area: 'skills' as const }, { icon: TableProperties, label: '卡片', area: 'cards' as const }, { icon: GalleryVerticalEnd, label: '资源' }, { icon: Clock3, label: '历史' }, { icon: SlidersHorizontal, label: '设置' }
];
const tabLabels: Array<[WorkspaceTab, string]> = [['orchestration', '编排'], ['api', 'API 文档'], ['logs', '日志'], ['monitor', '监控'], ['reports', '报表'], ['review', '人工审核']];

function TopHeader() { return <header className="top-header"><div className="brand"><span className="brand-mark" /><strong>Udesk Agent</strong></div><div className="account-area"><Blocks size={18} /><span className="account-avatar" /><div><span>Alex</span><small>管理员</small></div><ChevronDown size={14} /></div></header>; }

function GlobalSidebar({ activeArea, notify, openArea }: { activeArea: 'agent' | 'memory' | 'channels'; notify: (message: string) => void; openArea: (area: 'agent' | 'memory' | 'channels' | 'skills' | 'tools' | 'cards') => void }) {
  const [expanded, setExpanded] = useState(false);
  return <aside className={`global-sidebar ${expanded ? 'expanded' : ''}`} aria-label="全局导航">{navItems.map(({ icon: Icon, label, area }) => <button key={label} className={`sidebar-icon ${area === activeArea ? 'active' : ''}`} aria-label={label} title={expanded ? undefined : label} onClick={() => { if (area) openArea(area); else notify(`已切换到${label}`); }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></button>)}<span className="sidebar-spacer" /><button className="sidebar-icon sidebar-toggle" aria-label={expanded ? '收起侧边栏' : '展开侧边栏'} title={expanded ? '收起侧边栏' : '展开侧边栏'} onClick={() => setExpanded(value => !value)}><PanelLeftClose size={17} /><span>{expanded ? '收起' : '展开'}</span></button></aside>;
}

function ModelPanel({ config, setConfig, close }: { config: AgentConfig; setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>; close: () => void }) {
  const update = (patch: Partial<AgentConfig['model']>) => setConfig(current => ({ ...current, model: { ...current.model, ...patch } }));
  const metrics: Array<[string, keyof AgentConfig['model'], keyof AgentConfig['model'], number, number, number]> = [['温度', 'temperatureEnabled', 'temperature', 0, 2, .1], ['Top P', 'topPEnabled', 'topP', 0, 1, .1], ['频率惩罚', 'frequencyEnabled', 'frequencyPenalty', -2, 2, .1], ['存在惩罚', 'presenceEnabled', 'presencePenalty', -2, 2, .1], ['最大标记', 'maxTokensEnabled', 'maxTokens', 1, 8192, 1]];
  return <div className="model-panel" role="dialog" aria-label="模型配置"><header><strong>模型</strong><button className="icon-button" onClick={close}>×</button></header><label>模型<select value={config.model.id} onChange={e => update({ id: e.target.value })}><option>Doubao-Seed-2.0-pro</option><option>gpt-4o-mini</option><option>DeepSeek-V3</option></select></label><div className="preset-control">{[['precise', '精准模式'], ['balanced', '平衡模式'], ['creative', '创意模式']].map(([value, label]) => <button className={config.model.preset === value ? 'active' : ''} key={value} onClick={() => update({ preset: value })}>{label}</button>)}</div>{metrics.map(([label, enabledKey, valueKey, min, max, step]) => <div className="model-metric" key={label}><span>{label}</span><Switch checked={Boolean(config.model[enabledKey])} onChange={value => update({ [enabledKey]: value })} label={`启用${label}`} /><input type="range" min={min} max={max} step={step} value={Number(config.model[valueKey])} onChange={e => update({ [valueKey]: Number(e.target.value) })} /><input type="number" min={min} max={max} step={step} value={Number(config.model[valueKey])} onChange={e => update({ [valueKey]: Number(e.target.value) })} /></div>)}<div className="model-metric"><span>思考模式</span><Switch checked={config.model.thinking} onChange={thinking => update({ thinking })} label="模型思考模式" /><div className="boolean-control"><button className={config.model.thinking ? 'active' : ''} onClick={() => update({ thinking: true })}>True</button><button className={!config.model.thinking ? 'active' : ''} onClick={() => update({ thinking: false })}>False</button></div></div></div>;
}

function AgentHeader({ tab, setTab, config, setConfig, notify, openPublish, restore }: { tab: WorkspaceTab; setTab: (tab: WorkspaceTab) => void; config: AgentConfig; setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>; notify: (message: string) => void; openPublish: () => void; restore: () => void }) {
  const [modelOpen, setModelOpen] = useState(false);
  return <header className="agent-header"><div className="agent-identity"><button className="icon-button" onClick={() => notify('已返回智能体列表')}><ArrowLeft size={19} /></button><div className="agent-chip"><span className="agent-avatar" /><div><strong>new高级智能体</strong><small>高级智能体</small></div><Settings size={15} /></div></div><nav className="agent-tabs">{tabLabels.map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}</nav><div className="agent-actions">{tab === 'orchestration' ? <><button className="model-selector" onClick={() => setModelOpen(value => !value)}><Bot size={16} /><span>{config.model.id}</span><em>CHAT</em><SlidersHorizontal size={14} /></button><button className="icon-button" onClick={restore} aria-label="恢复已保存配置"><History size={17} /></button><button className="secondary-button" onClick={() => { saveAgentSnapshot(config); notify('配置已保存'); }}><Save size={15} />保存</button><button className="primary-button" onClick={openPublish}>发布<ChevronDown size={14} /></button>{modelOpen ? <ModelPanel config={config} setConfig={setConfig} close={() => setModelOpen(false)} /> : null}</> : null}</div></header>;
}

function AddedItems({ items, empty, onRemove }: { items: string[]; empty: string; onRemove: (value: string) => void }) { return items.length ? <div className="added-items">{items.map(item => <span key={item}>{item}<button onClick={() => onRemove(item)}>×</button></span>)}</div> : <p className="empty-copy">{empty}</p>; }

function ConfigurationPane({ config, setConfig, dialog, guardrail, dispatch }: { config: AgentConfig; setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>; dialog: (kind: DialogKind) => void; guardrail: ReturnType<typeof loadGuardrailConfig>; dispatch: React.Dispatch<Parameters<typeof guardrailReducer>[1]> }) {
  const update = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => setConfig(current => ({ ...current, [key]: value }));
  return <div className="configuration-pane">
    <ConfigSection title="提示词" icon={PenLine} actions={<><button className="small-button" onClick={() => dialog('createPrompt')}><Plus size={13} />创建</button><button className="small-button" onClick={() => dialog('library')}><FileText size={13} />词库</button><button className="small-button" onClick={() => dialog('generator')}><WandSparkles size={13} />生成</button></>}><textarea className="prompt-editor" value={config.prompt} onChange={e => update('prompt', e.target.value)} /><span className="character-count">{config.prompt.length}</span></ConfigSection>
    <ConfigSection title="开场白" icon={MessageSquareText}><div className="setting-line"><strong>启用开场白</strong><Switch checked={config.openingEnabled} onChange={openingEnabled => update('openingEnabled', openingEnabled)} label="启用开场白" /></div>{config.openingEnabled ? <textarea value={config.openingText} onChange={e => update('openingText', e.target.value)} placeholder="在此输入开场白内容，支持 {{变量名}} 占位符" /> : null}</ConfigSection>
    <ConfigSection title="思考模式" icon={BrainCircuit}><div className="radio-line">{([['fast', '快速思考'], ['deep', '深度思考'], ['custom', '自定义']] as const).map(([value, label]) => <label key={value}><input type="radio" checked={config.thinkingMode === value} onChange={() => update('thinkingMode', value)} />{label}</label>)}</div><div className="form-grid"><label>最大思考步数<input type="number" min={1} max={10} value={config.maxThinkingSteps} onChange={e => update('maxThinkingSteps', Number(e.target.value))} /><small>范围 1-10，默认 3</small></label><label>最大重试次数<input type="number" min={0} max={10} value={config.maxRetries} onChange={e => update('maxRetries', Number(e.target.value))} /><small>单步执行失败后的最大重试次数</small></label></div></ConfigSection>
    <PlanningSection config={config} update={update} />
    <ResponseExperienceSection config={config} update={update} />
    <ConversationBehaviorSection config={config} update={update} />
    <ProactiveServiceSection config={config} update={update} />
    <MultimodalInputSection config={config} update={update} />
    <ConfigSection title="变量" icon={Variable} actions={<button className="small-button" onClick={() => dialog('variables')}><Settings size={13} />设置</button>}><div className="info-box">变量能使用户输入表单引入提示词或开场白，你可以试试在提示词中输入 {'{{input}}'}。已配置 {config.variables.length} 项。</div></ConfigSection>
    <ConfigSection title="技能" icon={Sparkles} actions={<button className="small-button" onClick={() => dialog('skills')}><Plus size={13} />添加</button>}><AddedItems items={config.skills} empty="您可以添加 skill 作为智能体的技能" onRemove={value => update('skills', config.skills.filter(x => x !== value))} />{config.skills.length ? <div className="skill-binding-summary">{config.skills.map(skill => <span key={skill}><strong>{skill}</strong><small>{config.skillBindings?.[skill]?.version ?? '最新发布版本'} · {config.skillBindings?.[skill]?.autoUpdate === false ? '固定版本' : '自动更新'}</small></span>)}</div> : null}</ConfigSection>
    <ConfigSection title="工具" icon={Wrench} actions={<button className="small-button" onClick={() => dialog('tools')}><Plus size={13} />添加</button>}><AddedItems items={config.tools} empty="为智能体添加内置工具或 MCP 服务" onRemove={value => update('tools', config.tools.filter(x => x !== value))} /></ConfigSection>
    <ConfigSection title="知识库" icon={Database} actions={<><button className="small-button" disabled={!config.knowledgeBases.length}>召回设置</button><button className="small-button" onClick={() => dialog('knowledge')}><Plus size={13} />添加</button></>}><AddedItems items={config.knowledgeBases} empty="您可以导入知识库作为上下文" onRemove={value => update('knowledgeBases', config.knowledgeBases.filter(x => x !== value))} /></ConfigSection>
    <ConfigSection title="长期记忆" icon={MemoryStick}><div className="setting-line"><strong>启用客户记忆</strong><Switch checked={config.longMemory.enabled} onChange={enabled => update('longMemory', { ...config.longMemory, enabled })} label="启用客户记忆" /></div>{config.longMemory.enabled ? <div className="memory-inline-summary"><span><strong>{config.longMemory.identityKey}</strong><small>客户主标识</small></span><span><strong>{config.longMemory.profileFields.filter(field => field.enabled).length}</strong><small>客户资料字段</small></span><span><strong>{config.longMemory.recallCount}</strong><small>历史小结召回</small></span></div> : null}</ConfigSection>
    <ConfigSection title="上下文压缩" icon={Archive}><div className="setting-line"><strong>启用上下文压缩</strong><Switch checked={config.compression.enabled} onChange={enabled => update('compression', { ...config.compression, enabled })} label="启用上下文压缩" /></div>{config.compression.enabled ? <div className="form-grid three"><label>压缩触发轮次<input type="number" value={config.compression.triggerTurns} onChange={e => update('compression', { ...config.compression, triggerTurns: Number(e.target.value) })} /></label><label>Token 阈值比例<input type="number" step={.1} value={config.compression.tokenRatio} onChange={e => update('compression', { ...config.compression, tokenRatio: Number(e.target.value) })} /></label><label>上下文窗口大小<input type="number" value={config.compression.windowSize} onChange={e => update('compression', { ...config.compression, windowSize: Number(e.target.value) })} /></label></div> : null}</ConfigSection>
    <SessionSection config={config} setConfig={setConfig} />
    <ReflectionSection config={config} update={update} />
    <ManualReviewSection config={config} update={update} />
    <GuardrailSection config={guardrail} dispatch={dispatch} />
  </div>;
}

function SessionSection({ config, setConfig }: { config: AgentConfig; setConfig: React.Dispatch<React.SetStateAction<AgentConfig>> }) {
  const setSession = (patch: Partial<AgentConfig['session']>) => setConfig(c => ({ ...c, session: { ...c.session, ...patch } }));
  return <ConfigSection title="会话变量" icon={TableProperties}><div className="setting-line"><strong>启用会话变量</strong><Switch checked={config.session.enabled} onChange={enabled => setSession({ enabled })} label="启用会话变量" /></div>{config.session.enabled ? <><div className="inline-config"><div className="subsection-heading"><strong>字段定义</strong><button className="text-button" onClick={() => setSession({ fields: [...config.session.fields, { id: createId('field'), name: '', description: '', aliases: '', type: '字符串', regex: '', confidence: .75, conflict: '覆盖', required: false }] })}><Plus size={13} />添加</button></div>{config.session.fields.map((field, index) => <div className="session-form" key={field.id}><strong>字段 {index + 1}</strong><div className="form-grid three"><label>变量名<input value={field.name} onChange={e => setSession({ fields: config.session.fields.map(x => x.id === field.id ? { ...x, name: e.target.value } : x) })} /></label><label>业务含义<input value={field.description} onChange={e => setSession({ fields: config.session.fields.map(x => x.id === field.id ? { ...x, description: e.target.value } : x) })} /></label><label>类型<select value={field.type} onChange={e => setSession({ fields: config.session.fields.map(x => x.id === field.id ? { ...x, type: e.target.value } : x) })}><option>字符串</option><option>数字</option><option>布尔</option></select></label><label>正则校验<input value={field.regex} onChange={e => setSession({ fields: config.session.fields.map(x => x.id === field.id ? { ...x, regex: e.target.value } : x) })} placeholder="如：^[A-Z0-9]+$" /></label><label>置信度阈值<input type="number" step={.05} value={field.confidence} onChange={e => setSession({ fields: config.session.fields.map(x => x.id === field.id ? { ...x, confidence: Number(e.target.value) } : x) })} /></label><label>冲突策略<select value={field.conflict} onChange={e => setSession({ fields: config.session.fields.map(x => x.id === field.id ? { ...x, conflict: e.target.value } : x) })}><option>覆盖</option><option>保留原值</option><option>人工确认</option></select></label></div></div>)}</div><div className="inline-config"><div className="subsection-heading"><strong>字段抽取</strong><button className="text-button" onClick={() => setSession({ extractors: [...config.session.extractors, { id: createId('extractor'), skill: '', fields: [] }] })}><Plus size={13} />添加</button></div>{config.session.extractors.map((item, index) => <div className="form-grid" key={item.id}><label>技能 {index + 1}<select value={item.skill} onChange={e => setSession({ extractors: config.session.extractors.map(x => x.id === item.id ? { ...x, skill: e.target.value } : x) })}><option value="">请选择技能</option>{config.skills.map(skill => <option key={skill}>{skill}</option>)}</select></label><label>抽取字段<select multiple value={item.fields} onChange={e => setSession({ extractors: config.session.extractors.map(x => x.id === item.id ? { ...x, fields: Array.from(e.target.selectedOptions).map(o => o.value) } : x) })}>{config.session.fields.map(field => <option key={field.id} value={field.name}>{field.name || '未命名字段'}</option>)}</select></label></div>)}</div></> : null}</ConfigSection>;
}

function ReflectionSection({ config, update }: { config: AgentConfig; update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void }) { const set = (patch: Partial<AgentConfig['reflection']>) => update('reflection', { ...config.reflection, ...patch }); return <ConfigSection title="反思机制" icon={RotateCcw}><div className="setting-line"><strong>启用反思</strong><Switch checked={config.reflection.enabled} onChange={enabled => set({ enabled })} label="启用反思" /></div>{config.reflection.enabled ? <><label className="stacked-field">最大反思次数<input type="number" value={config.reflection.maxCount} onChange={e => set({ maxCount: Number(e.target.value) })} /></label><div className="form-grid"><label>反思强度<select value={config.reflection.intensity} onChange={e => set({ intensity: e.target.value })}><option value="">请选择</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label><label>反思模式<select value={config.reflection.mode} onChange={e => set({ mode: e.target.value })}><option value="">请选择</option><option value="self_reflection">自我反思</option><option value="producer_critic">生产者-批评者</option></select></label></div><label className="stacked-field">自定义反思提示词<textarea value={config.reflection.prompt} onChange={e => set({ prompt: e.target.value })} placeholder="覆盖默认反思提示词，留空使用默认值" /></label></> : null}</ConfigSection>; }

function ManualReviewSection({ config, update }: { config: AgentConfig; update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void }) { const set = (patch: Partial<AgentConfig['manualReview']>) => update('manualReview', { ...config.manualReview, ...patch }); return <ConfigSection title="人工审核" icon={UserRoundCheck}><div className="setting-line"><strong>启用人工审核</strong><Switch checked={config.manualReview.enabled} onChange={enabled => set({ enabled })} label="启用人工审核" /></div>{config.manualReview.enabled ? <><div className="inline-config"><div className="subsection-heading"><strong>需人工审核的工具</strong><button className="text-button" onClick={() => set({ tools: [...config.manualReview.tools, { id: createId('review-tool'), tool: '', timeout: 60, strategy: '自动批准' }] })}>+ 添加</button></div>{config.manualReview.tools.map(item => <div className="form-grid three" key={item.id}><label>工具名称<select value={item.tool} onChange={e => set({ tools: config.manualReview.tools.map(x => x.id === item.id ? { ...x, tool: e.target.value } : x) })}><option value="">请选择</option>{config.tools.map(tool => <option key={tool}>{tool}</option>)}</select></label><label>超时时间（分钟）<input type="number" value={item.timeout} onChange={e => set({ tools: config.manualReview.tools.map(x => x.id === item.id ? { ...x, timeout: Number(e.target.value) } : x) })} /></label><label>超时策略<select value={item.strategy} onChange={e => set({ tools: config.manualReview.tools.map(x => x.id === item.id ? { ...x, strategy: e.target.value } : x) })}><option>自动批准</option><option>自动拒绝</option><option>保持等待</option></select></label></div>)}</div><div className="inline-config"><div className="subsection-heading"><strong>通知渠道</strong><button className="text-button" onClick={() => set({ channels: [...config.manualReview.channels, { id: createId('channel'), type: 'Webhook', endpoint: '' }] })}>+ 添加</button></div>{config.manualReview.channels.map(item => <div className="form-grid" key={item.id}><label>通知类型<select value={item.type} onChange={e => set({ channels: config.manualReview.channels.map(x => x.id === item.id ? { ...x, type: e.target.value } : x) })}><option>Webhook</option><option>邮件</option><option>企业微信</option></select></label><label>回调地址<input value={item.endpoint} onChange={e => set({ channels: config.manualReview.channels.map(x => x.id === item.id ? { ...x, endpoint: e.target.value } : x) })} placeholder="请输入 Webhook URL" /></label></div>)}</div></> : null}</ConfigSection>; }

function Toast({ children }: { children: ReactNode }) { return <div className="toast" role="status">{children}</div>; }

function ResizableWorkspace({ children }: { children: ReactNode }) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(440);
  const [resizing, setResizing] = useState(false);
  const clampWidth = (width: number) => {
    const measuredWidth = workspaceRef.current?.getBoundingClientRect().width ?? 0;
    const available = measuredWidth >= 820 ? measuredWidth : 1280;
    return Math.min(Math.max(300, width), Math.max(300, Math.min(760, available - 520)));
  };
  const resizeFromPointer = (clientX: number) => {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (bounds) setPreviewWidth(clampWidth(bounds.right - clientX));
  };
  return <div className={`workspace ${resizing ? 'is-resizing' : ''}`} ref={workspaceRef} style={{ gridTemplateColumns: `minmax(500px, 1fr) 8px ${previewWidth}px` }}>
    {Array.isArray(children) ? children[0] : children}
    <div
      className="workspace-resizer"
      role="separator"
      aria-label="调整配置区和预览区宽度"
      aria-orientation="vertical"
      aria-valuemin={300}
      aria-valuemax={760}
      aria-valuenow={previewWidth}
      tabIndex={0}
      title="拖拽调整宽度，双击恢复默认"
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setResizing(true); resizeFromPointer(event.clientX); }}
      onPointerMove={event => { if (resizing) resizeFromPointer(event.clientX); }}
      onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); setResizing(false); }}
      onPointerCancel={() => setResizing(false)}
      onDoubleClick={() => setPreviewWidth(440)}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          setPreviewWidth(width => clampWidth(width + (event.key === 'ArrowLeft' ? 20 : -20)));
        }
        if (event.key === 'Home') setPreviewWidth(440);
      }}
    ><GripVertical size={14} aria-hidden="true" /></div>
    {Array.isArray(children) ? children[1] : null}
  </div>;
}

export default function App() {
  const [agentConfig, setAgentConfig] = useState(loadAgentConfig);
  const [guardrail, dispatch] = useReducer(guardrailReducer, undefined, loadGuardrailConfig);
  const [tab, setTab] = useState<WorkspaceTab>('orchestration'); const [dialog, setDialog] = useState<DialogKind>(null); const [toast, setToast] = useState('');
  const [area, setArea] = useState<'agent' | 'memory' | 'channels' | 'skills' | 'tools' | 'cards'>(() => { const view = new URLSearchParams(window.location.search).get('view'); return view === 'cards' || view === 'skills' || view === 'tools' || view === 'memory' || view === 'channels' ? view : 'agent'; });
  useEffect(() => persistAgentConfig(agentConfig), [agentConfig]); useEffect(() => saveGuardrailConfig(guardrail), [guardrail]); useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 1800); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const url = new URL(window.location.href); url.searchParams.set('view', area); window.history.replaceState(null, '', url); }, [area]);
  const restore = () => { setAgentConfig(loadSavedSnapshot()); setToast('已恢复到最近保存状态'); };
  return <div className="app-shell"><TopHeader />{area === 'cards' ? <CardManagementPage onBack={() => setArea('agent')} onOpenSkills={() => setArea('skills')} onOpenTools={() => setArea('tools')} /> : area === 'skills' ? <SkillManagementPage onBack={() => setArea('agent')} onOpenTools={() => setArea('tools')} onOpenCards={() => setArea('cards')} /> : area === 'tools' ? <ToolManagementPage onBack={() => setArea('agent')} onOpenSkills={() => setArea('skills')} onOpenCards={() => setArea('cards')} /> : <><div className="app-body"><GlobalSidebar activeArea={area} notify={setToast} openArea={setArea} /><main className="workbench">{area === 'memory' ? <MemoryWorkspace config={agentConfig.longMemory} update={patch => setAgentConfig(current => ({ ...current, longMemory: { ...current.longMemory, ...patch } }))} notify={setToast} /> : area === 'channels' ? <ChannelWorkspace notify={setToast} /> : <><AgentHeader tab={tab} setTab={setTab} config={agentConfig} setConfig={setAgentConfig} notify={setToast} openPublish={() => setDialog('publish')} restore={restore} />{tab === 'orchestration' ? <ResizableWorkspace><ConfigurationPane config={agentConfig} setConfig={setAgentConfig} dialog={setDialog} guardrail={guardrail} dispatch={dispatch} /><RuntimePreviewPanel guardrail={guardrail} responseExperience={agentConfig.responseExperience} conversationBehavior={agentConfig.conversationBehavior} proactiveService={agentConfig.proactiveService} multimodal={agentConfig.multimodal} planning={agentConfig.planning} /></ResizableWorkspace> : tab === 'api' ? <ApiDocsView notify={setToast} /> : tab === 'logs' ? <LogsView /> : tab === 'monitor' ? <RealtimeMonitorView /> : tab === 'reports' ? <ReportsView /> : <ReviewView />}</>}</main></div><ConfigDialogs kind={dialog} config={agentConfig} setConfig={setAgentConfig} close={() => setDialog(null)} notify={setToast} /></>}{toast ? <Toast>{toast}</Toast> : null}</div>;
}
