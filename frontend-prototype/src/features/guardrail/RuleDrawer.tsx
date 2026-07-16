import { useEffect, useState } from 'react';
import { FlaskConical, Save, X } from 'lucide-react';
import type {
  ExecutorType,
  FailureMode,
  GuardrailAction,
  GuardrailRule,
  GuardrailStage,
  RuleType
} from './guardrail.types';

interface RuleDrawerProps {
  open: boolean;
  stage: GuardrailStage;
  rule: GuardrailRule | null;
  onClose: () => void;
  onSave: (rule: GuardrailRule) => void;
}

const providers = [
  { value: 'aliyun-content-security', label: '阿里云' },
  { value: 'tencent-content-security', label: '腾讯云' }
];

const credentials = [
  { value: 'credential-aliyun-prod', label: '阿里云内容安全凭证' },
  { value: 'credential-tencent-prod', label: '腾讯云内容安全凭证' }
];

function newRule(stage: GuardrailStage): GuardrailRule {
  return {
    id: `rule-${Date.now()}`,
    name: '',
    stages: [stage],
    executorType: 'LOCAL',
    ruleType: 'KEYWORD',
    matcher: { keywords: [], matchMode: 'CONTAINS', ignoreCase: true, normalizeWidth: true, trimSpaces: true },
    action: 'BLOCK',
    enabled: true
  };
}

export function RuleDrawer({ open, stage, rule, onClose, onSave }: RuleDrawerProps) {
  const [draft, setDraft] = useState<GuardrailRule>(() => rule ?? newRule(stage));
  const [matcherText, setMatcherText] = useState('');
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const next = rule ? structuredClone(rule) : newRule(stage);
    setDraft(next);
    setMatcherText(
      next.ruleType === 'REGEX'
        ? (next.matcher.patterns ?? []).join('\n')
        : (next.matcher.keywords ?? []).join(', ')
    );
    setTestResult('');
  }, [open, rule, stage]);

  if (!open) return null;

  const toggleStage = (value: GuardrailStage) => {
    setDraft(current => {
      const stages = current.stages.includes(value)
        ? current.stages.filter(item => item !== value)
        : [...current.stages, value];
      return { ...current, stages: stages.length ? stages : [stage] };
    });
  };

  const updateExecutor = (executorType: ExecutorType) => {
    setDraft(current => ({
      ...current,
      executorType,
      providerId: executorType === 'THIRD_PARTY' ? current.providerId ?? providers[0].value : undefined,
      credentialId: executorType === 'THIRD_PARTY' ? current.credentialId ?? credentials[0].value : undefined,
      timeoutMs: executorType === 'LOCAL' ? undefined : current.timeoutMs ?? 500,
      failureMode: executorType === 'LOCAL' ? undefined : current.failureMode ?? 'ALLOW_AND_LOG',
      customHttp: executorType === 'CUSTOM_HTTP'
        ? current.customHttp ?? {
          endpoint: 'https://risk.example.com/v1/check',
          method: 'POST',
          requestTemplate: '{"text":"{{text}}"}',
          decisionPath: '$.data.decision'
        }
        : undefined
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    const matcher = draft.ruleType === 'REGEX'
      ? { ...draft.matcher, patterns: matcherText.split('\n').map(value => value.trim()).filter(Boolean), keywords: undefined }
      : { ...draft.matcher, keywords: matcherText.split(',').map(value => value.trim()).filter(Boolean), patterns: undefined };
    onSave({ ...draft, name: draft.name.trim(), matcher });
  };

  return (
    <div className="layer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="rule-drawer-title">
        <header className="drawer-header">
          <div>
            <h2 id="rule-drawer-title">{rule ? '编辑检测规则' : '添加检测规则'}</h2>
            <p>{stage === 'INPUT' ? '输入护栏' : stage === 'OUTPUT' ? '输出护栏' : 'Tool 返回护栏'}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭规则配置"><X size={18} /></button>
        </header>

        <div className="drawer-body">
          <div className="form-section">
            <label htmlFor="rule-name">规则名称</label>
            <input id="rule-name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="请输入规则名称" />
          </div>

          <div className="form-section">
            <span className="field-label">检测阶段</span>
            <div className="check-grid">
              {([['INPUT', '用户输入'], ['OUTPUT', 'Agent 输出'], ['TOOL_RESULT', 'Tool 返回']] as const).map(([value, label]) => (
                <label className="check-option" key={value}>
                  <input type="checkbox" checked={draft.stages.includes(value)} onChange={() => toggleStage(value)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-section two-column-form">
            <label>执行方式
              <select aria-label="执行方式" value={draft.executorType} onChange={event => updateExecutor(event.target.value as ExecutorType)}>
                <option value="LOCAL">本地执行</option>
                <option value="THIRD_PARTY">第三方服务</option>
                <option value="CUSTOM_HTTP">自定义 HTTP</option>
              </select>
            </label>
            <label>规则类型
              <select aria-label="规则类型" value={draft.ruleType} onChange={event => setDraft({ ...draft, ruleType: event.target.value as RuleType })}>
                <option value="KEYWORD">关键词</option>
                <option value="REGEX">正则表达式</option>
                <option value="CONTENT_MODERATION">内容审核</option>
                <option value="CUSTOM">自定义</option>
              </select>
            </label>
          </div>

          {draft.executorType === 'THIRD_PARTY' ? (
            <div className="form-section two-column-form">
              <label>服务来源
                <select aria-label="服务来源" value={draft.providerId} onChange={event => setDraft({ ...draft, providerId: event.target.value })}>
                  {providers.map(provider => <option key={provider.value} value={provider.value}>{provider.label}</option>)}
                </select>
              </label>
              <label>凭证
                <select aria-label="凭证" value={draft.credentialId} onChange={event => setDraft({ ...draft, credentialId: event.target.value })}>
                  {credentials.map(credential => <option key={credential.value} value={credential.value}>{credential.label}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          {draft.executorType === 'CUSTOM_HTTP' ? (
            <div className="form-section custom-http-fields">
              <label>接口地址<input value={draft.customHttp?.endpoint ?? ''} onChange={event => setDraft({ ...draft, customHttp: { ...draft.customHttp!, endpoint: event.target.value } })} /></label>
              <div className="two-column-form">
                <label>鉴权凭证<select value={draft.customHttp?.credentialId ?? ''} onChange={event => setDraft({ ...draft, customHttp: { ...draft.customHttp!, credentialId: event.target.value } })}><option value="">不使用凭证</option><option value="credential-custom-risk">客户风控凭证</option></select></label>
                <label>响应决策路径<input value={draft.customHttp?.decisionPath ?? ''} onChange={event => setDraft({ ...draft, customHttp: { ...draft.customHttp!, decisionPath: event.target.value } })} /></label>
              </div>
              <label>请求模板<textarea value={draft.customHttp?.requestTemplate ?? ''} onChange={event => setDraft({ ...draft, customHttp: { ...draft.customHttp!, requestTemplate: event.target.value } })} /></label>
            </div>
          ) : null}

          {draft.ruleType === 'KEYWORD' || draft.ruleType === 'REGEX' ? (
            <div className="form-section">
              <label htmlFor="rule-matcher">{draft.ruleType === 'KEYWORD' ? '关键词' : '正则表达式'}</label>
              <textarea
                id="rule-matcher"
                value={matcherText}
                onChange={event => setMatcherText(event.target.value)}
                placeholder={draft.ruleType === 'KEYWORD' ? '多个关键词使用英文逗号分隔' : '每行输入一条正则表达式'}
              />
            </div>
          ) : null}

          <div className="form-section two-column-form">
            <label>命中动作
              <select value={draft.action} onChange={event => setDraft({ ...draft, action: event.target.value as GuardrailAction })}>
                <option value="BLOCK">阻断请求</option><option value="MASK">脱敏后继续</option><option value="CONFIRM">用户确认</option><option value="HANDOFF">转人工</option><option value="REWRITE">安全改写</option>
              </select>
            </label>
            <label>状态
              <select value={draft.enabled ? 'enabled' : 'disabled'} onChange={event => setDraft({ ...draft, enabled: event.target.value === 'enabled' })}>
                <option value="enabled">开启</option><option value="disabled">关闭</option>
              </select>
            </label>
          </div>

          {draft.executorType !== 'LOCAL' ? (
            <div className="form-section two-column-form">
              <label>超时时间
                <div className="input-suffix"><input aria-label="超时时间" type="number" value={draft.timeoutMs ?? 500} onChange={event => setDraft({ ...draft, timeoutMs: Number(event.target.value) })} /><span>ms</span></div>
              </label>
              <label>超时处理
                <select value={draft.failureMode} onChange={event => setDraft({ ...draft, failureMode: event.target.value as FailureMode })}>
                  <option value="ALLOW_AND_LOG">放行并记录异常</option><option value="BLOCK_WITH_FALLBACK">阻断并使用兜底回复</option><option value="HANDOFF">转人工</option>
                </select>
              </label>
            </div>
          ) : null}

          <button className="secondary-button test-rule-button" onClick={() => setTestResult(draft.executorType === 'LOCAL' ? '本地规则可正常执行' : '模拟调用成功，响应映射有效')}>
            <FlaskConical size={15} />测试当前规则
          </button>
          {testResult ? <p className="test-success">{testResult}</p> : null}
        </div>

        <footer className="drawer-footer">
          <button className="secondary-button" onClick={onClose}>取消</button>
          <button className="primary-button" onClick={handleSave} disabled={!draft.name.trim()}><Save size={15} />保存配置</button>
        </footer>
      </aside>
    </div>
  );
}

export function providerLabel(providerId?: string): string {
  return providers.find(provider => provider.value === providerId)?.label ?? '第三方服务';
}

