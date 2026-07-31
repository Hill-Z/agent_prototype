import { useState, type Dispatch, type ReactNode } from 'react';
import { FileKey, FlaskConical, LockKeyhole, Plus, ShieldCheck, Wrench } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import { FallbackDrawer } from './FallbackDrawer';
import { GuardrailTestDrawer } from './GuardrailTestDrawer';
import { PrivacyDrawer } from './PrivacyDrawer';
import { providerLabel, RuleDrawer } from './RuleDrawer';
import type { GuardrailActionEvent } from './guardrail.reducer';
import type { GuardrailAction, GuardrailConfig, GuardrailHealth, GuardrailRule, GuardrailStage, RuleType } from './guardrail.types';

interface GuardrailSectionProps {
  config: GuardrailConfig;
  dispatch: Dispatch<GuardrailActionEvent>;
}

const typeLabels: Record<RuleType, string> = {
  KEYWORD: '本地关键词', REGEX: '字段规则', CONTENT_MODERATION: '内容审核', CUSTOM: '平台检测'
};
const actionLabels: Record<GuardrailAction, string> = {
  ALLOW: '允许', MASK: '脱敏', BLOCK: '阻断', CONFIRM: '用户确认', HANDOFF: '转人工', REWRITE: '安全改写'
};
const healthLabels: Record<GuardrailHealth, string> = { READY: '正常', INCOMPLETE: '配置不完整', ERROR: '服务异常' };

function virtualRule(id: string, name: string, stage: GuardrailStage, ruleType: RuleType, action: GuardrailAction, pattern?: string): GuardrailRule {
  return {
    id, name, stages: [stage], executorType: 'LOCAL', ruleType,
    matcher: pattern ? { patterns: [pattern], ignoreCase: true } : {},
    action, enabled: true, health: 'READY'
  };
}

function RuleRow({ rule, detector, enabled, onToggle, onEdit, onTest, locked }: {
  rule: GuardrailRule;
  detector?: string;
  enabled: boolean;
  onToggle?: (enabled: boolean) => void;
  onEdit: () => void;
  onTest: () => void;
  locked?: boolean;
}) {
  const health = !enabled ? null : rule.health ?? (rule.executorType === 'CUSTOM_HTTP' && !rule.customHttp?.endpoint ? 'INCOMPLETE' : 'READY');
  const stageLabel = rule.stages[0] === 'INPUT' ? '输入' : rule.stages[0] === 'OUTPUT' ? '输出' : '工具返回';
  return <div className="guardrail-policy-row">
    <strong>{rule.name}{locked ? <LockKeyhole size={12} /> : null}</strong>
    <span>{detector ?? (rule.executorType === 'THIRD_PARTY' ? providerLabel(rule.providerId) : typeLabels[rule.ruleType])}</span>
    <span className={`action-tag action-${rule.action.toLowerCase()}`}>{actionLabels[rule.action]}</span>
    <span className={`policy-health ${health ? health.toLowerCase() : 'disabled'}`}>{health ? healthLabels[health] : '已停用'}</span>
    <div className="policy-row-actions">
      <button onClick={onTest} aria-label={`测试${stageLabel}规则 ${rule.name}`}><FlaskConical size={13} />测试</button>
      <button onClick={onEdit} aria-label={`编辑${stageLabel}规则 ${rule.name}`}>配置</button>
      {locked ? <span className="locked-policy">强制</span> : <Switch checked={enabled} onChange={onToggle ?? (() => undefined)} label={`${enabled ? '停用' : '启用'}${rule.name}`} />}
    </div>
  </div>;
}

function PolicyGroup({ icon, title, stage, children, onAdd }: { icon: ReactNode; title: string; stage: GuardrailStage; children: ReactNode; onAdd: () => void }) {
  return <section className="guardrail-policy-group">
    <header><span>{icon}</span><h3>{title}</h3><button className="small-button" onClick={onAdd} aria-label={`添加${title}规则`}><Plus size={13} />添加规则</button></header>
    <div className="guardrail-policy-head"><span>规则</span><span>检测方式</span><span>命中处理</span><span>状态</span><span>操作</span></div>
    <div>{children}</div>
    <input type="hidden" value={stage} readOnly />
  </section>;
}

export function GuardrailSection({ config, dispatch }: GuardrailSectionProps) {
  const [ruleDrawer, setRuleDrawer] = useState<{ stage: GuardrailStage; rule: GuardrailRule | null } | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [testTarget, setTestTarget] = useState<{ stage: GuardrailStage; rule: GuardrailRule } | null>(null);

  const saveRule = (rule: GuardrailRule) => {
    dispatch({ type: config.rules.some(item => item.id === rule.id) ? 'update-rule' : 'add-rule', rule });
    setRuleDrawer(null);
  };
  const updateRule = (rule: GuardrailRule) => dispatch({ type: 'update-rule', rule });
  const toggleRule = (rule: GuardrailRule, enabled: boolean) => updateRule({ ...rule, enabled });
  const rulesFor = (stage: GuardrailStage) => config.rules.filter(rule => rule.stages.includes(stage) && !rule.id.startsWith('builtin-'));
  const openTest = (stage: GuardrailStage, rule: GuardrailRule) => setTestTarget({ stage, rule });

  const privacyInput = virtualRule('builtin-privacy-input', '隐私与密钥', 'INPUT', 'CUSTOM', 'MASK', '\\b1[3-9]\\d{9}\\b');
  const privacyTool = virtualRule('builtin-privacy-tool', '敏感字段检测', 'TOOL_RESULT', 'CUSTOM', 'MASK', '\\b1[3-9]\\d{9}\\b');
  const privacyOutput = virtualRule('builtin-privacy-output', '隐私信息防泄漏', 'OUTPUT', 'CUSTOM', 'MASK', '\\b1[3-9]\\d{9}\\b');
  const contentInput = config.rules.find(rule => rule.id === 'builtin-content-config') ?? virtualRule('builtin-content-config', '内容安全', 'INPUT', 'CONTENT_MODERATION', 'BLOCK');
  const injectionInput = config.rules.find(rule => rule.id === 'builtin-injection-config') ?? virtualRule('builtin-injection-config', 'Prompt Injection', 'INPUT', 'CUSTOM', 'BLOCK');
  const contentOutput = config.rules.find(rule => rule.id === 'builtin-output-config') ?? virtualRule('builtin-output-config', '违规回复检测', 'OUTPUT', 'CONTENT_MODERATION', 'REWRITE');

  return <>
    <ConfigSection title="护栏配置" icon={ShieldCheck} className="guardrail-section guardrail-product-section">
      <div className="guardrail-product-header">
        <div className="guardrail-master-control"><strong>启用安全护栏</strong><Switch checked={config.enabled} onChange={enabled => dispatch({ type: 'set-enabled', enabled })} label="启用安全护栏" /></div>
        <div className="mandatory-protection"><LockKeyhole size={14} /><span>密钥泄漏保护</span><strong>强制启用</strong></div>
      </div>

      <PolicyGroup icon={<ShieldCheck size={15} />} title="输入检测" stage="INPUT" onAdd={() => setRuleDrawer({ stage: 'INPUT', rule: null })}>
        <RuleRow rule={privacyInput} enabled={config.privacy.inputEnabled} detector="平台检测" onToggle={inputEnabled => dispatch({ type: 'set-privacy', privacy: { ...config.privacy, inputEnabled } })} onEdit={() => setPrivacyOpen(true)} onTest={() => openTest('INPUT', privacyInput)} />
        <RuleRow rule={contentInput} enabled={config.builtin.contentSafety} detector="内容审核" onToggle={enabled => dispatch({ type: 'set-builtin', key: 'contentSafety', enabled })} onEdit={() => setRuleDrawer({ stage: 'INPUT', rule: contentInput })} onTest={() => openTest('INPUT', contentInput)} />
        <RuleRow rule={injectionInput} enabled={config.builtin.promptInjection} detector="平台检测" onToggle={enabled => dispatch({ type: 'set-builtin', key: 'promptInjection', enabled })} onEdit={() => setRuleDrawer({ stage: 'INPUT', rule: injectionInput })} onTest={() => openTest('INPUT', injectionInput)} />
        {rulesFor('INPUT').map(rule => <RuleRow key={rule.id} rule={rule} enabled={rule.enabled} onToggle={enabled => toggleRule(rule, enabled)} onEdit={() => setRuleDrawer({ stage: 'INPUT', rule })} onTest={() => openTest('INPUT', rule)} />)}
      </PolicyGroup>

      <PolicyGroup icon={<Wrench size={15} />} title="工具返回检测" stage="TOOL_RESULT" onAdd={() => setRuleDrawer({ stage: 'TOOL_RESULT', rule: null })}>
        <RuleRow rule={privacyTool} enabled={config.privacy.toolResultEnabled} detector="平台检测" onToggle={toolResultEnabled => dispatch({ type: 'set-privacy', privacy: { ...config.privacy, toolResultEnabled } })} onEdit={() => setPrivacyOpen(true)} onTest={() => openTest('TOOL_RESULT', privacyTool)} />
        {rulesFor('TOOL_RESULT').map(rule => <RuleRow key={rule.id} rule={rule} enabled={rule.enabled} onToggle={enabled => toggleRule(rule, enabled)} onEdit={() => setRuleDrawer({ stage: 'TOOL_RESULT', rule })} onTest={() => openTest('TOOL_RESULT', rule)} />)}
      </PolicyGroup>

      <PolicyGroup icon={<FileKey size={15} />} title="输出检测" stage="OUTPUT" onAdd={() => setRuleDrawer({ stage: 'OUTPUT', rule: null })}>
        <RuleRow rule={privacyOutput} enabled={config.privacy.outputEnabled} detector="平台检测" onToggle={outputEnabled => dispatch({ type: 'set-privacy', privacy: { ...config.privacy, outputEnabled } })} onEdit={() => setPrivacyOpen(true)} onTest={() => openTest('OUTPUT', privacyOutput)} />
        <RuleRow rule={contentOutput} enabled={config.builtin.outputSafety} detector="内容审核" onToggle={enabled => dispatch({ type: 'set-builtin', key: 'outputSafety', enabled })} onEdit={() => setRuleDrawer({ stage: 'OUTPUT', rule: contentOutput })} onTest={() => openTest('OUTPUT', contentOutput)} />
        {rulesFor('OUTPUT').map(rule => <RuleRow key={rule.id} rule={rule} enabled={rule.enabled} onToggle={enabled => toggleRule(rule, enabled)} onEdit={() => setRuleDrawer({ stage: 'OUTPUT', rule })} onTest={() => openTest('OUTPUT', rule)} />)}
      </PolicyGroup>

      <button className="fallback-entry" aria-label="兜底话术" onClick={() => setFallbackOpen(true)}><span><strong>兜底话术</strong><em>5 个场景</em></span><span>配置</span></button>
    </ConfigSection>

    <RuleDrawer open={Boolean(ruleDrawer)} stage={ruleDrawer?.stage ?? 'INPUT'} rule={ruleDrawer?.rule ?? null} onClose={() => setRuleDrawer(null)} onSave={saveRule} />
    <PrivacyDrawer open={privacyOpen} privacy={config.privacy} onClose={() => setPrivacyOpen(false)} onSave={privacy => { dispatch({ type: 'set-privacy', privacy }); setPrivacyOpen(false); }} />
    <FallbackDrawer open={fallbackOpen} value={config.fallbackReplies} onClose={() => setFallbackOpen(false)} onSave={fallbackReplies => { dispatch({ type: 'set-fallbacks', fallbackReplies }); setFallbackOpen(false); }} />
    <GuardrailTestDrawer open={Boolean(testTarget)} stage={testTarget?.stage ?? 'INPUT'} rule={testTarget?.rule ?? null} onClose={() => setTestTarget(null)} onTested={rule => { if (config.rules.some(item => item.id === rule.id)) updateRule(rule); }} />
  </>;
}
