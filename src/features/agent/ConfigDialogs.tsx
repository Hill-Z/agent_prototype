import { useMemo, useState } from 'react';
import { Copy, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { createId, type AgentConfig, type VariableDefinition } from './agent.types';
import { skillVersionOptions } from '../skills/skill.types';

export type DialogKind = null | 'createPrompt' | 'library' | 'generator' | 'variables' | 'skills' | 'tools' | 'knowledge' | 'publish';

const skillOptions = ['客户意图识别', '退款协商', '工单总结', '多语言客服'];
const toolOptions = ['knowledge_search', 'extract_session_variables', 'order_query', 'customer_profile', 'refund_request'];
const knowledgeOptions = ['产品帮助中心', '售后政策库', '客服 SOP', '合同与报价资料'];

function DialogButtons({ close, save, disabled = false }: { close: () => void; save: () => void; disabled?: boolean }) {
  return <><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={save} disabled={disabled}>确认</button></>;
}

function SelectionDialog({ title, options, selected, onClose, onSave, tabs }: { title: string; options: string[]; selected: string[]; onClose: () => void; onSave: (values: string[]) => void; tabs?: string[] }) {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(selected);
  const [tab, setTab] = useState(tabs?.[0] ?? '全部');
  const filtered = options.filter(item => item.toLowerCase().includes(query.toLowerCase()));
  return <Modal title={title} onClose={onClose} footer={<DialogButtons close={onClose} save={() => onSave(draft)} />}>
    {tabs ? <div className="modal-tabs">{tabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div> : null}
    <label className="search-field"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`搜索${title.replace('选择', '')}名称`} /></label>
    <div className="selection-list">{filtered.map(item => <label key={item}><input type="checkbox" checked={draft.includes(item)} onChange={() => setDraft(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item])} /><span><strong>{item}</strong><small>{title === '选择工具' ? (item.includes('search') ? '内置工具' : 'MCP 服务') : '团队可用'}</small></span></label>)}</div>
  </Modal>;
}

function SkillSelectionDialog({ config, onClose, onSave }: { config: AgentConfig; onClose: () => void; onSave: (skills: string[], bindings: AgentConfig['skillBindings']) => void }) {
  const [query, setQuery] = useState(''); const [selected, setSelected] = useState(config.skills); const [bindings, setBindings] = useState(config.skillBindings);
  const toggle = (skill: string) => { const exists = selected.includes(skill); setSelected(current => exists ? current.filter(item => item !== skill) : [...current, skill]); if (!exists && !bindings[skill]) setBindings(current => ({ ...current, [skill]: { version: skillVersionOptions[skill][0], autoUpdate: true } })); };
  return <Modal title="选择技能" description="选择发布版本；自动更新只影响新的 Agent Run，不中断正在执行的技能。" wide onClose={onClose} footer={<DialogButtons close={onClose} save={() => onSave(selected, bindings)} />}><label className="search-field"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索技能名称" /></label><div className="skill-binding-list">{skillOptions.filter(skill => skill.includes(query)).map(skill => { const active = selected.includes(skill); const binding = bindings[skill] ?? { version: skillVersionOptions[skill][0], autoUpdate: true }; return <div className={active ? 'active' : ''} key={skill}><label><input type="checkbox" checked={active} onChange={() => toggle(skill)} /><span><strong>{skill}</strong><small>{skillVersionOptions[skill].length} 个可用版本</small></span></label><select disabled={!active} value={binding.version} onChange={e => setBindings(current => ({ ...current, [skill]: { ...binding, version: e.target.value } }))}>{skillVersionOptions[skill].map(version => <option key={version}>{version}</option>)}</select><label className="auto-update"><input type="checkbox" disabled={!active} checked={binding.autoUpdate} onChange={e => setBindings(current => ({ ...current, [skill]: { ...binding, autoUpdate: e.target.checked } }))} />自动更新</label></div>; })}</div></Modal>;
}

export function ConfigDialogs({ kind, config, setConfig, close, notify }: { kind: DialogKind; config: AgentConfig; setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>; close: () => void; notify: (message: string) => void }) {
  const [promptName, setPromptName] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptContent, setPromptContent] = useState(config.prompt);
  const [libraryTab, setLibraryTab] = useState('推荐');
  const [generatorMode, setGeneratorMode] = useState('提示词生成');
  const [useCase, setUseCase] = useState('');
  const [generated, setGenerated] = useState('');
  const [variables, setVariables] = useState<VariableDefinition[]>(config.variables);
  const templates = useMemo(() => ['专业客服问答', '售后问题处理', '线索信息收集'], []);

  if (!kind) return null;
  if (kind === 'skills') return <SkillSelectionDialog config={config} onClose={close} onSave={(skills, skillBindings) => { setConfig(c => ({ ...c, skills, skillBindings })); close(); }} />;
  if (kind === 'tools') return <SelectionDialog title="选择工具" tabs={['内置工具', 'MCP 服务']} options={toolOptions} selected={config.tools} onClose={close} onSave={tools => { setConfig(c => ({ ...c, tools })); close(); }} />;
  if (kind === 'knowledge') return <SelectionDialog title="添加知识库" options={knowledgeOptions} selected={config.knowledgeBases} onClose={close} onSave={knowledgeBases => { setConfig(c => ({ ...c, knowledgeBases })); close(); }} />;

  if (kind === 'createPrompt') return <Modal title="创建提示词" onClose={close} footer={<DialogButtons close={close} save={() => { notify(`提示词“${promptName}”已保存到我的词库`); close(); }} disabled={!promptName || !promptDescription || !promptContent} />}>
    <div className="form-section"><label>提示词名称*<input value={promptName} onChange={e => setPromptName(e.target.value)} placeholder="请输入提示词名称" /></label></div>
    <div className="form-section"><label>提示词描述*<textarea value={promptDescription} onChange={e => setPromptDescription(e.target.value)} placeholder="请输入提示词描述" /></label></div>
    <div className="form-section"><label>提示词内容*<textarea className="large-textarea" value={promptContent} onChange={e => setPromptContent(e.target.value)} /></label></div>
  </Modal>;

  if (kind === 'library') return <Modal title="提示词库" wide onClose={close} footer={<><button className="secondary-button" onClick={() => notify('提示词已复制')}><Copy size={14} />复制提示词</button><button className="primary-button" onClick={() => { setConfig(c => ({ ...c, prompt: templates[0] + '：' + c.prompt })); close(); }}>插入提示词</button></>}>
    <div className="modal-tabs">{['推荐', '团队', '我的'].map(item => <button key={item} className={libraryTab === item ? 'active' : ''} onClick={() => setLibraryTab(item)}>{item}</button>)}<button className="small-button"><Plus size={13} />新建提示词</button></div>
    <label className="search-field"><Search size={15} /><input placeholder="搜索提示词标题" /></label>
    <div className="template-grid">{templates.map((item, index) => <button key={item} className={index === 0 ? 'selected' : ''}><strong>{item}</strong><small>{libraryTab}模板 · 适用于客户服务场景</small></button>)}</div>
  </Modal>;

  if (kind === 'generator') return <Modal title="提示词助手" wide onClose={close} footer={<><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" disabled={!generated} onClick={() => { setConfig(c => ({ ...c, prompt: generated })); close(); }}>应用到提示词</button></>}>
    <div className="assistant-layout"><div><div className="modal-tabs">{['提示词生成', '提示词优化'].map(item => <button key={item} className={generatorMode === item ? 'active' : ''} onClick={() => setGeneratorMode(item)}>{item}</button>)}</div><label>模型<select><option>gpt-4o-mini</option><option>Doubao-Seed-2.0-pro</option></select></label><div className="usecase-chips">{['问答客服', '售前导购', '售后问题', '外呼机器人', '工单智能体', '信息收集'].map(item => <button key={item} onClick={() => setUseCase(item)}>{item}</button>)}</div><textarea className="large-textarea" value={useCase} onChange={e => setUseCase(e.target.value)} placeholder="写下清晰、具体的说明。" /><button className="primary-button" onClick={() => setGenerated(`你是一名专业的${useCase || '智能客服'}。请先识别用户意图，再基于已授权知识和工具给出准确、简洁的答复；信息不足时主动澄清，不得编造。`)}><Sparkles size={14} />生成</button></div><div className="generated-preview">{generated || '在左侧描述您的用例，编排预览将在此处显示。'}</div></div>
  </Modal>;

  if (kind === 'variables') return <Modal title="管理变量" wide onClose={close} footer={<DialogButtons close={close} save={() => { setConfig(c => ({ ...c, variables })); close(); }} />}>
    <div className="modal-tabs"><button className="active">自定义变量</button><button>系统变量</button><button className="small-button" onClick={() => setVariables(v => [...v, { id: createId('var'), key: '', name: '', type: '文本', required: false }])}><Plus size={13} />添加变量</button></div>
    <div className="variable-table"><div className="variable-head"><span>变量 KEY</span><span>字段名称</span><span>字段类型</span><span>必填</span><span /></div>{variables.length === 0 ? <p className="empty-state">自定义增加记忆变量，在应用使用中调用。</p> : variables.map(variable => <div className="variable-row" key={variable.id}><input value={variable.key} onChange={e => setVariables(v => v.map(x => x.id === variable.id ? { ...x, key: e.target.value } : x))} placeholder="key" /><input value={variable.name} onChange={e => setVariables(v => v.map(x => x.id === variable.id ? { ...x, name: e.target.value } : x))} placeholder="字段名称" /><select value={variable.type} onChange={e => setVariables(v => v.map(x => x.id === variable.id ? { ...x, type: e.target.value as VariableDefinition['type'] } : x))}><option>文本</option><option>段落</option><option>下拉选项</option><option>数字</option></select><input type="checkbox" checked={variable.required} onChange={e => setVariables(v => v.map(x => x.id === variable.id ? { ...x, required: e.target.checked } : x))} /><button className="icon-button" onClick={() => setVariables(v => v.filter(x => x.id !== variable.id))}><Trash2 size={15} /></button></div>)}</div>
  </Modal>;

  return <Modal title="发布高级智能体" onClose={close} footer={<DialogButtons close={close} save={() => { notify('版本 v1.0.1 已发布'); close(); }} />}><div className="info-box">发布后，新会话将使用当前模型、提示词、技能、工具、记忆和护栏配置。</div><label className="stacked-field">版本说明<textarea placeholder="请输入本次发布说明" /></label></Modal>;
}
