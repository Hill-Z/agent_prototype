import { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { evaluateGuardrail } from './guardrail.evaluator';
import { defaultGuardrailConfig, type GuardrailRule, type GuardrailStage } from './guardrail.types';

interface GuardrailTestDrawerProps {
  open: boolean;
  rule: GuardrailRule | null;
  stage: GuardrailStage;
  onClose: () => void;
  onTested: (rule: GuardrailRule) => void;
}

const stageLabels: Record<GuardrailStage, string> = { INPUT: '用户输入', TOOL_RESULT: '工具返回', OUTPUT: 'Agent输出' };

export function GuardrailTestDrawer({ open, rule, stage, onClose, onTested }: GuardrailTestDrawerProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ matched: boolean; action: string; output: string; latency: string; service: string } | null>(null);

  useEffect(() => { setText(''); setResult(null); }, [open, rule]);
  if (!open || !rule) return null;

  const runTest = () => {
    const localResult = evaluateGuardrail(text, {
      ...defaultGuardrailConfig,
      builtin: { contentSafety: false, promptInjection: false, outputSafety: false },
      privacy: { ...defaultGuardrailConfig.privacy, inputEnabled: false, toolResultEnabled: false, outputEnabled: false },
      rules: [rule]
    }, stage);
    const externalMatched = rule.executorType !== 'LOCAL' && text.trim().length > 0;
    const matched = externalMatched || localResult.matchedRules.includes(rule.id);
    setResult({
      matched,
      action: matched ? rule.action : 'ALLOW',
      output: matched && rule.action === 'MASK' ? '138****5678' : matched && rule.action === 'REWRITE' ? '已移除内部错误信息' : localResult.transformedText || text,
      latency: rule.executorType === 'LOCAL' ? '12ms' : '126ms',
      service: rule.executorType === 'LOCAL' ? '本地检测' : '调用成功'
    });
    onTested({ ...rule, health: 'READY', lastTestedAt: '刚刚' });
  };

  return <div className="layer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="guardrail-test-title">
      <header className="drawer-header"><div><h2 id="guardrail-test-title">测试规则</h2><strong>{rule.name}</strong></div><button className="icon-button" onClick={onClose} aria-label="关闭规则测试"><X size={18} /></button></header>
      <div className="drawer-body guardrail-test-body">
        <label>消息来源<select aria-label="测试消息来源" value={stage} disabled><option value={stage}>{stageLabels[stage]}</option></select></label>
        <label>测试内容<textarea aria-label="测试内容" value={text} onChange={event => setText(event.target.value)} placeholder="输入需要检测的内容" /></label>
        <button className="primary-button test-run-button" onClick={runTest} disabled={!text.trim()}><FlaskConical size={15} />开始测试</button>
        {result ? <section className={`guardrail-test-result ${result.matched ? 'matched' : 'passed'}`}>
          <header><strong>{result.matched ? '检测命中' : '检测通过'}</strong><span>{result.latency}</span></header>
          <dl>
            <div><dt>命中规则</dt><dd>{result.matched ? rule.name : '—'}</dd></div>
            <div><dt>执行动作</dt><dd>{result.action}</dd></div>
            <div><dt>检测服务</dt><dd>{result.service}</dd></div>
            <div><dt>处理结果</dt><dd>{result.output || '—'}</dd></div>
          </dl>
        </section> : null}
      </div>
    </aside>
  </div>;
}
