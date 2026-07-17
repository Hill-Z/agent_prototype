import { BrainCircuit, Check, CheckCircle2, Copy, FileClock, LoaderCircle, RefreshCw, RotateCcw, Send, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { evaluateGuardrail } from '../guardrail/guardrail.evaluator';
import type { GuardrailConfig } from '../guardrail/guardrail.types';
import type { AgentConfig } from '../agent/agent.types';
import { createRuntimeScenario } from './runtime.mock';
import type { RuntimeRun } from './runtime.types';

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
      {runs.length === 0 ? <div className="preview-empty"><span>{mode === 'debug' ? <BrainCircuit size={24} /> : <ShieldCheck size={24} />}</span><strong>{mode === 'debug' ? '查看 Agent 如何完成任务' : '以客户身份查看回复'}</strong><p>{mode === 'debug' ? '运行中只显示当前事项，完整执行过程从回复下方的 Agent 日志进入。' : responseExperience.humanizedTimingEnabled ? '客户只会看到输入状态和完成后的整条消息。' : '当前使用平台默认的流式回复效果。'}</p></div> : runs.map(item => mode === 'debug' ? <DebugRun key={item.id} run={item} onRegenerate={() => run(item.input)} /> : <CustomerRun key={item.id} run={item} responseExperience={responseExperience} />)}
    </div>
    <div className="chat-composer"><textarea placeholder="和机器人聊一聊吧" value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run(text); } }} /><button onClick={() => run(text)} aria-label="发送消息"><Send size={16} /></button></div>
  </aside>;
}

function DebugRun({ run, onRegenerate }: { run: RuntimeRun; onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false);
  const currentStep = run.scenario.steps[Math.min(run.completedSteps, run.scenario.steps.length - 1)];
  const totalDurationMs = run.scenario.steps.reduce((total, step) => total + step.durationMs, 0);
  const copyReply = async () => {
    await navigator.clipboard?.writeText(run.scenario.reply);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return <div className="preview-run debug-run"><div className="chat-message user">{run.input}</div><div className={`compact-runtime-status ${run.completed ? 'completed' : 'running'}`} role="status">{run.completed ? <CheckCircle2 size={15} /> : <LoaderCircle size={15} />}<strong>{run.completed ? `已处理 ${(totalDurationMs / 1000).toFixed(1)}s` : currentStep.title}</strong>{!run.completed ? <span className="status-pulse" /> : null}</div>{run.completed ? <div className="agent-response-wrap"><div className="chat-message agent">{run.scenario.reply}</div><div className="response-hover-actions"><button onClick={copyReply} aria-label="复制回复" title="复制回复">{copied ? <Check size={14} /> : <Copy size={14} />}</button><button aria-label="Agent 日志" title="Agent 日志"><FileClock size={14} /><span>Agent 日志</span></button><button onClick={onRegenerate} aria-label="重新运行" title="重新运行"><RefreshCw size={14} /></button></div></div> : null}</div>;
}

function CustomerRun({ run, responseExperience }: { run: RuntimeRun; responseExperience: AgentConfig['responseExperience'] }) {
  const streamedLength = Math.max(1, Math.floor(run.scenario.reply.length * run.completedSteps / run.scenario.steps.length));
  return <div className="preview-run customer-run"><div className="chat-message user">{run.input}</div>{run.completed ? <div className="chat-message agent">{run.scenario.reply}</div> : responseExperience.humanizedTimingEnabled ? run.typingVisible ? <div className={`typing-indicator ${responseExperience.typingStyle}`} aria-label="对方正在输入"><i /><i /><i /><span>正在输入</span></div> : null : <div className="chat-message agent streaming-message">{run.scenario.reply.slice(0, streamedLength)}<b /></div>}</div>;
}
