import { BrainCircuit, Check, Circle, Database, LoaderCircle, RotateCcw, Send, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { evaluateGuardrail } from '../guardrail/guardrail.evaluator';
import type { GuardrailConfig } from '../guardrail/guardrail.types';
import type { AgentConfig } from '../agent/agent.types';
import { createRuntimeScenario } from './runtime.mock';
import type { RuntimeRun, RuntimeStepKind } from './runtime.types';

const stepIcons: Record<RuntimeStepKind, typeof BrainCircuit> = { analysis: BrainCircuit, guardrail: ShieldCheck, skill: Sparkles, knowledge: Database, tool: Wrench, generation: Sparkles };

export function RuntimePreviewPanel({ guardrail, responseExperience }: { guardrail: GuardrailConfig; responseExperience: AgentConfig['responseExperience'] }) {
  const [mode, setMode] = useState<'debug' | 'customer'>('debug');
  const [text, setText] = useState('');
  const [runs, setRuns] = useState<RuntimeRun[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), []);

  const clear = () => { timers.current.forEach(timer => window.clearTimeout(timer)); timers.current = []; setRuns([]); };
  const run = (value: string) => {
    const input = value.trim();
    if (!input) return;
    const result = evaluateGuardrail(input, guardrail, 'INPUT');
    const scenario = createRuntimeScenario(input, result, guardrail.fallbackReply);
    const id = `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setRuns(current => [...current, { id, input, result, scenario, completedSteps: 0, typingVisible: false, completed: false }]);
    setText('');
    if (responseExperience.humanizedTimingEnabled) timers.current.push(window.setTimeout(() => setRuns(current => current.map(item => item.id === id ? { ...item, typingVisible: true } : item)), responseExperience.initialDelayMs));
    let elapsed = 220;
    scenario.steps.forEach((step, index) => {
      elapsed += Math.min(step.durationMs, 520);
      if (index + 1 === scenario.steps.length && responseExperience.humanizedTimingEnabled) elapsed = Math.max(elapsed, responseExperience.initialDelayMs + responseExperience.minTypingMs);
      timers.current.push(window.setTimeout(() => setRuns(current => current.map(item => item.id === id ? { ...item, completedSteps: index + 1, completed: index + 1 === scenario.steps.length } : item)), elapsed));
    });
  };

  return <aside className="preview-panel runtime-preview">
    <header><strong>{mode === 'debug' ? '调试过程' : '客户 IM 预览'}</strong><div className="preview-header-actions"><div className="preview-mode-switch" aria-label="预览视图"><button className={mode === 'debug' ? 'active' : ''} onClick={() => setMode('debug')}>调试视图</button><button className={mode === 'customer' ? 'active' : ''} onClick={() => setMode('customer')}>客户视图</button></div><button className="icon-button" onClick={clear} aria-label="清空调试记录"><RotateCcw size={15} /></button></div></header>
    <div className={`preview-content ${mode === 'customer' ? 'customer-preview-content' : ''}`} aria-live="polite">
      {runs.length === 0 ? <div className="preview-empty"><span>{mode === 'debug' ? <BrainCircuit size={24} /> : <ShieldCheck size={24} />}</span><strong>{mode === 'debug' ? '查看 Agent 如何完成任务' : '以客户身份查看回复'}</strong><p>{mode === 'debug' ? '发送消息后，思考摘要、Skill、知识库、工具和护栏事件会按实际顺序展示。' : responseExperience.humanizedTimingEnabled ? '客户只会看到输入状态和完成后的整条消息。' : '当前使用平台默认的流式回复效果。'}</p></div> : runs.map(item => mode === 'debug' ? <DebugRun key={item.id} run={item} /> : <CustomerRun key={item.id} run={item} responseExperience={responseExperience} />)}
    </div>
    <div className="chat-composer"><textarea placeholder="和机器人聊一聊吧" value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run(text); } }} /><button onClick={() => run(text)} aria-label="发送消息"><Send size={16} /></button></div>
  </aside>;
}

function DebugRun({ run }: { run: RuntimeRun }) {
  return <div className="preview-run debug-run"><div className="chat-message user">{run.input}</div><div className="run-summary"><div><strong>Run #{run.id.slice(-5)}</strong><span>{run.completed ? '已完成' : '执行中'}</span></div><div className="run-progress"><i style={{ width: `${Math.max(8, run.completedSteps / run.scenario.steps.length * 100)}%` }} /></div></div><div className="runtime-timeline">{run.scenario.steps.map((step, index) => {
    const status = index < run.completedSteps ? 'done' : index === run.completedSteps && !run.completed ? 'running' : 'pending';
    const Icon = stepIcons[step.kind];
    return <div className={`runtime-step ${status}`} key={step.id}><span className="step-state">{status === 'done' ? <Check size={13} /> : status === 'running' ? <LoaderCircle size={13} /> : <Circle size={10} />}</span><span className="step-icon"><Icon size={14} /></span><div><strong>{step.title}</strong><p>{status === 'pending' ? '等待执行' : step.detail}</p></div><small>{status === 'done' ? `${step.durationMs}ms` : status === 'running' ? '进行中' : ''}</small></div>;
  })}</div><div className="trace-card"><div><strong>输入护栏</strong><span className={`decision decision-${run.result.decision.toLowerCase()}`}>{run.result.decision}</span></div><p className="transformed-input">处理后输入：{run.result.transformedText}</p>{run.result.trace.map(trace => <p key={trace.ruleId}><span>{trace.detector}</span><code>{trace.ruleId}</code><b>{trace.action}</b></p>)}</div>{run.completed ? <div className="chat-message agent">{run.scenario.reply}</div> : null}</div>;
}

function CustomerRun({ run, responseExperience }: { run: RuntimeRun; responseExperience: AgentConfig['responseExperience'] }) {
  const streamedLength = Math.max(1, Math.floor(run.scenario.reply.length * run.completedSteps / run.scenario.steps.length));
  return <div className="preview-run customer-run"><div className="chat-message user">{run.input}</div>{run.completed ? <div className="chat-message agent">{run.scenario.reply}</div> : responseExperience.humanizedTimingEnabled ? run.typingVisible ? <div className={`typing-indicator ${responseExperience.typingStyle}`} aria-label="对方正在输入"><i /><i /><i /><span>正在输入</span></div> : null : <div className="chat-message agent streaming-message">{run.scenario.reply.slice(0, streamedLength)}<b /></div>}</div>;
}
