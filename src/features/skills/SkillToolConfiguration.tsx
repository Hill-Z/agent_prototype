import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Play, Wrench } from 'lucide-react';
import { Switch } from '../../components/Switch';
import type { SkillToolBinding, SkillToolDeclaration, ToolFallbackAction } from '../tools/tool.types';

const fallbackLabels: Record<ToolFallbackAction, string> = {
  failure_message: '发送失败话术',
  handoff: '转人工处理',
  agent_reply: '由 Agent 继续回答'
};

function defaultBinding(toolId: string): SkillToolBinding {
  return { id: `binding-${toolId}`, toolId, enabled: true, timeoutSeconds: 30, fallbackAction: 'failure_message', startMessage: '我来帮您处理。', runningMessage: '正在处理中，请稍等。', progressAfterSeconds: 10, progressMessage: '还需要一点时间，我继续帮您处理。', successMessage: '已经处理完成。', failureMessage: '暂时没有处理成功，我可以继续为您处理。' };
}

export function SkillToolConfiguration({ tools, bindings, update }: { tools: SkillToolDeclaration[]; bindings: SkillToolBinding[]; update: (bindings: SkillToolBinding[]) => void }) {
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id ?? ''); const [testingId, setTestingId] = useState('');
  useEffect(() => { if (!tools.some(tool => tool.id === selectedToolId)) setSelectedToolId(tools[0]?.id ?? ''); }, [tools, selectedToolId]);
  const selectedTool = tools.find(tool => tool.id === selectedToolId); const savedBinding = bindings.find(binding => binding.toolId === selectedToolId); const selected = savedBinding ?? defaultBinding(selectedToolId);
  const patch = (value: Partial<SkillToolBinding>) => {
    const next = { ...selected, ...value };
    update(savedBinding ? bindings.map(binding => binding.toolId === selectedToolId ? next : binding) : [...bindings, next]);
  };
  const test = () => { if (!selectedTool) return; setTestingId(selectedTool.id); setTimeout(() => setTestingId(''), 1200); };
  return <div className="skill-tools-page"><aside className="skill-tools-list"><header><strong>已解析工具</strong><span>{tools.length}</span></header>{tools.map(tool => <button className={tool.id === selectedToolId ? 'active' : ''} key={tool.id} onClick={() => setSelectedToolId(tool.id)}><i><Wrench size={16} /></i><span><strong>{tool.name}</strong><small>{tool.sourcePath}</small></span></button>)}{!tools.length ? <div className="skill-tools-empty"><Wrench size={22} /><span>未解析到工具函数</span></div> : null}</aside>{selectedTool ? <section className="skill-tool-config"><header><div><h2>{selectedTool.name}</h2><span>{selectedTool.entrypoint}</span></div><button className="secondary-button" onClick={test}>{testingId === selectedTool.id ? <CheckCircle2 size={15} /> : <Play size={15} />}{testingId === selectedTool.id ? '测试通过' : '测试调用'}</button></header><div className="skill-tool-contract"><section><strong>输入参数</strong>{selectedTool.inputFields.length ? selectedTool.inputFields.map(field => <span key={field.id}>{field.name}<small>{field.type}{field.required ? ' · 必填' : ''}</small></span>) : <span>无</span>}</section><section><strong>输出参数</strong>{selectedTool.outputFields.map(field => <span key={field.id}>{field.name}<small>{field.type}</small></span>)}</section></div><div className="skill-tool-form"><div className="skill-tool-enabled"><span>启用工具</span><Switch checked={selected.enabled} onChange={enabled => patch({ enabled })} label="启用当前工具" /></div><label>兜底处理<select aria-label="兜底处理" value={selected.fallbackAction} onChange={event => patch({ fallbackAction: event.target.value as ToolFallbackAction })}>{Object.entries(fallbackLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>超时时间<input aria-label="工具超时时间" type="number" min="1" value={selected.timeoutSeconds || ''} onChange={event => patch({ timeoutSeconds: event.target.value === '' ? 0 : Number(event.target.value) })} /></label><label>等待提醒时间<input aria-label="客户插话等待秒数" type="number" min="1" value={selected.progressAfterSeconds || ''} onChange={event => patch({ progressAfterSeconds: event.target.value === '' ? 0 : Number(event.target.value) })} /></label><label>开始调用话术<input aria-label="开始调用话术" value={selected.startMessage} onChange={event => patch({ startMessage: event.target.value })} /></label><label>调用中话术<input aria-label="调用中话术" value={selected.runningMessage} onChange={event => patch({ runningMessage: event.target.value })} /></label><label>等待提醒话术<input aria-label="客户插话话术" value={selected.progressMessage} onChange={event => patch({ progressMessage: event.target.value })} /></label><label>调用成功话术<input aria-label="调用成功话术" value={selected.successMessage} onChange={event => patch({ successMessage: event.target.value })} /></label><label>调用失败话术<input aria-label="调用失败话术" value={selected.failureMessage} onChange={event => patch({ failureMessage: event.target.value })} /></label></div></section> : <section className="skill-tool-config-empty"><Clock3 size={28} /><strong>等待 Skill 工具解析</strong></section>}</div>;
}
