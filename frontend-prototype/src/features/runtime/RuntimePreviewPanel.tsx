import { AudioLines, BrainCircuit, Check, CheckCircle2, Copy, FileClock, FileMusic, Image, LoaderCircle, Mic, Paperclip, RefreshCw, RotateCcw, Send, ShieldCheck, Square, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { evaluateGuardrail } from '../guardrail/guardrail.evaluator';
import type { GuardrailConfig } from '../guardrail/guardrail.types';
import type { AgentConfig } from '../agent/agent.types';
import { createRuntimeScenario, getMockAsrTranscript } from './runtime.mock';
import type { RuntimeAttachment, RuntimeRun } from './runtime.types';

interface RuntimePreviewProps {
  guardrail: GuardrailConfig;
  responseExperience: AgentConfig['responseExperience'];
  multimodal: AgentConfig['multimodal'];
}

const formatBytes = (size: number) => size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;

export function RuntimePreviewPanel({ guardrail, responseExperience, multimodal }: RuntimePreviewProps) {
  const [mode, setMode] = useState<'debug' | 'customer'>('debug');
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<RuntimeAttachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [asrReady, setAsrReady] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [runs, setRuns] = useState<RuntimeRun[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const previewUrls = useRef(new Set<string>());
  useEffect(() => () => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordingSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const clear = () => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current = [];
    runs.flatMap(item => item.attachments).forEach(item => {
      if (item.previewUrl) { URL.revokeObjectURL(item.previewUrl); previewUrls.current.delete(item.previewUrl); }
    });
    setRuns([]);
  };
  const addFiles = (files: FileList | null, kind: RuntimeAttachment['kind']) => {
    if (!files?.length) return;
    const additions = Array.from(files).map(file => {
      const previewUrl = kind === 'image' && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined;
      if (previewUrl) previewUrls.current.add(previewUrl);
      return { id: `attachment-${Date.now()}-${Math.random().toString(16).slice(2)}`, kind, name: file.name, size: file.size, previewUrl };
    });
    setAttachments(current => {
      if (kind === 'image') {
        const remaining = Math.max(0, multimodal.maxImages - current.filter(item => item.kind === 'image').length);
        additions.slice(remaining).forEach(item => {
          if (item.previewUrl) { URL.revokeObjectURL(item.previewUrl); previewUrls.current.delete(item.previewUrl); }
        });
        return [...current, ...additions.slice(0, remaining)];
      }
      return [...current.filter(item => item.kind !== 'audio'), additions[0]];
    });
  };
  const startRecording = () => { setRecordingSeconds(0); setRecording(true); };
  const cancelRecording = () => { setRecording(false); setRecordingSeconds(0); };
  const finishRecording = () => {
    setRecording(false);
    setTranscribing(true);
    setRecordingSeconds(0);
    timers.current.push(window.setTimeout(() => {
      setText(getMockAsrTranscript());
      setTranscribing(false);
      setAsrReady(true);
    }, 720));
  };
  const run = (value: string, selectedAttachments = attachments) => {
    const input = value.trim();
    if (!input && !selectedAttachments.length) return;
    const displayInput = input || (selectedAttachments.some(item => item.kind === 'image') ? '请识别这张图片' : '请识别这段语音');
    const result = evaluateGuardrail(displayInput, guardrail, 'INPUT');
    const scenario = createRuntimeScenario(displayInput, result, guardrail.fallbackReply, selectedAttachments);
    const id = `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setRuns(current => [...current, { id, input: displayInput, attachments: selectedAttachments, result, scenario, completedSteps: 0, typingVisible: false, completed: false }]);
    setText('');
    setAsrReady(false);
    setAttachments([]);
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
      {runs.length === 0 ? <div className="preview-empty"><span>{mode === 'debug' ? <BrainCircuit size={24} /> : <ShieldCheck size={24} />}</span><strong>{mode === 'debug' ? '查看 Agent 如何完成任务' : '以客户身份查看回复'}</strong><p>{mode === 'debug' ? '上传图片或使用语音输入，查看识别与执行过程。' : '客户只看到原始消息、输入状态和最终回复。'}</p></div> : runs.map(item => mode === 'debug' ? <DebugRun key={item.id} run={item} onRegenerate={() => run(item.input, item.attachments)} /> : <CustomerRun key={item.id} run={item} responseExperience={responseExperience} />)}
    </div>
    <div className="chat-composer multimodal-composer">
      {attachments.length ? <div className="composer-attachments">{attachments.map(item => <AttachmentChip key={item.id} attachment={item} onRemove={() => {
        if (item.previewUrl) { URL.revokeObjectURL(item.previewUrl); previewUrls.current.delete(item.previewUrl); }
        setAttachments(current => current.filter(file => file.id !== item.id));
      }} />)}</div> : null}
      <textarea placeholder="和机器人聊一聊吧" value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); run(text); } }} />
      {asrReady ? <div className="asr-ready-state"><CheckCircle2 size={13} /><span>语音已转为文字，可修改后发送</span></div> : null}
      <div className="composer-toolbar">
        <div className="attachment-actions">
          <button className="composer-tool-button" disabled={!multimodal.imageEnabled} onClick={() => imageInput.current?.click()} aria-label="上传图片" title={multimodal.imageEnabled ? '上传图片' : '图片识别未启用'}><Image size={16} /><span>图片</span></button>
          <button className="composer-tool-button" disabled={!multimodal.audioEnabled} onClick={startRecording} aria-label="开始录音" title={multimodal.audioEnabled ? '录制语音' : '音频识别未启用'}><Mic size={16} /><span>语音</span></button>
          <input ref={imageInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event => { addFiles(event.target.files, 'image'); event.target.value = ''; }} />
        </div>
        <button className="composer-send" onClick={() => run(text)} aria-label="发送消息" disabled={!text.trim() && !attachments.length}><Send size={16} /></button>
      </div>
      {recording || transcribing ? <div className="voice-recording-popover" role="dialog" aria-label={recording ? '语音录制' : '语音识别'}>
        {recording ? <button className="recording-close" onClick={cancelRecording} aria-label="取消录音"><X size={15} /></button> : null}
        <div className={`recording-orb ${transcribing ? 'transcribing' : ''}`}>{transcribing ? <LoaderCircle size={22} /> : <AudioLines size={22} />}</div>
        <strong>{transcribing ? '正在识别语音' : '录音中'}</strong>
        <time>{transcribing ? '识别完成后将自动填入输入框' : `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(recordingSeconds % 60).padStart(2, '0')}`}</time>
        <div className={`recording-wave ${transcribing ? 'is-processing' : ''}`} aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 60}ms` }} />)}</div>
        {recording ? <button className="finish-recording" onClick={finishRecording}><Square size={12} fill="currentColor" />完成录音</button> : null}
      </div> : null}
    </div>
  </aside>;
}

function AttachmentChip({ attachment, onRemove }: { attachment: RuntimeAttachment; onRemove: () => void }) {
  return <div className={`attachment-chip ${attachment.kind}`}>
    <span className="attachment-thumbnail">{attachment.previewUrl ? <img src={attachment.previewUrl} alt="" /> : attachment.kind === 'image' ? <Image size={18} /> : <FileMusic size={18} />}</span>
    <span className="attachment-copy"><strong>{attachment.name}</strong><small>{attachment.kind === 'image' ? '图片' : '音频'} · {formatBytes(attachment.size)}</small></span>
    <button onClick={onRemove} aria-label={`删除附件 ${attachment.name}`}><Trash2 size={13} /></button>
  </div>;
}

function MessageAttachments({ attachments }: { attachments: RuntimeAttachment[] }) {
  if (!attachments.length) return null;
  return <div className="message-attachments">{attachments.map(item => <div key={item.id} className={`message-attachment ${item.kind}`}>{item.previewUrl ? <img src={item.previewUrl} alt={item.name} /> : item.kind === 'image' ? <Image size={20} /> : <><FileMusic size={20} /><span>{item.name}</span></>}</div>)}</div>;
}

function DebugRun({ run, onRegenerate }: { run: RuntimeRun; onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false);
  const currentStep = run.scenario.steps[Math.min(run.completedSteps, run.scenario.steps.length - 1)];
  const totalDurationMs = run.scenario.steps.reduce((total, step) => total + step.durationMs, 0);
  const copyReply = async () => { await navigator.clipboard?.writeText(run.scenario.reply); setCopied(true); window.setTimeout(() => setCopied(false), 1200); };
  return <div className="preview-run debug-run"><div className="user-message-group"><MessageAttachments attachments={run.attachments} /><div className="chat-message user">{run.input}</div></div><div className={`compact-runtime-status ${run.completed ? 'completed' : 'running'}`} role="status">{run.completed ? <CheckCircle2 size={15} /> : <LoaderCircle size={15} />}<strong>{run.completed ? `已处理 ${(totalDurationMs / 1000).toFixed(1)}s` : currentStep.title}</strong>{!run.completed ? <span className="status-pulse" /> : null}</div>{run.completed && run.scenario.recognition ? <details className="recognition-result"><summary><span><Paperclip size={14} />{run.scenario.recognition.title}</span><small>查看识别结果</small></summary><div><strong>{run.scenario.recognition.summary}</strong><label>{run.scenario.recognition.detailLabel}</label><pre>{run.scenario.recognition.detail}</pre><footer>{run.scenario.recognition.meta.map(item => <span key={item}>{item}</span>)}</footer></div></details> : null}{run.completed ? <div className="agent-response-wrap"><div className="chat-message agent">{run.scenario.reply}</div><div className="response-hover-actions"><button onClick={copyReply} aria-label="复制回复" title="复制回复">{copied ? <Check size={14} /> : <Copy size={14} />}</button><button aria-label="Agent 日志" title="Agent 日志"><FileClock size={14} /><span>Agent 日志</span></button><button onClick={onRegenerate} aria-label="重新运行" title="重新运行"><RefreshCw size={14} /></button></div></div> : null}</div>;
}

function CustomerRun({ run, responseExperience }: { run: RuntimeRun; responseExperience: AgentConfig['responseExperience'] }) {
  const streamedLength = Math.max(1, Math.floor(run.scenario.reply.length * run.completedSteps / run.scenario.steps.length));
  return <div className="preview-run customer-run"><div className="user-message-group"><MessageAttachments attachments={run.attachments} /><div className="chat-message user">{run.input}</div></div>{run.completed ? <div className="chat-message agent">{run.scenario.reply}</div> : responseExperience.humanizedTimingEnabled ? run.typingVisible ? <div className={`typing-indicator ${responseExperience.typingStyle}`} aria-label="对方正在输入"><i /><i /><i /><span>正在输入</span></div> : null : <div className="chat-message agent streaming-message">{run.scenario.reply.slice(0, streamedLength)}<b /></div>}</div>;
}
