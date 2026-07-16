import { useState, type Dispatch } from 'react';
import { FileKey, MemoryStick, Plus, ShieldCheck, Wrench } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import { PrivacyDrawer } from './PrivacyDrawer';
import { providerLabel, RuleDrawer } from './RuleDrawer';
import type { GuardrailActionEvent } from './guardrail.reducer';
import type { GuardrailAction, GuardrailConfig, GuardrailRule, GuardrailStage, RuleType } from './guardrail.types';

interface GuardrailSectionProps {
  config: GuardrailConfig;
  dispatch: Dispatch<GuardrailActionEvent>;
}

const typeLabels: Record<RuleType, string> = {
  KEYWORD: '关键词', REGEX: '正则表达式', CONTENT_MODERATION: '内容审核', CUSTOM: '自定义'
};
const actionLabels: Record<GuardrailAction, string> = {
  ALLOW: '允许', MASK: '脱敏', BLOCK: '阻断', CONFIRM: '用户确认', HANDOFF: '转人工', REWRITE: '安全改写'
};

function RuleTable({ stage, rules, onAdd, onEdit }: {
  stage: GuardrailStage;
  rules: GuardrailRule[];
  onAdd: () => void;
  onEdit: (rule: GuardrailRule) => void;
}) {
  const stageLabel = stage === 'INPUT' ? '输入' : stage === 'OUTPUT' ? '输出' : 'Tool 返回';
  const stageRules = rules.filter(rule => rule.stages.includes(stage));
  return (
    <div className="rule-area">
      <div className="subsection-heading"><strong>检测规则</strong><button className="small-button" onClick={onAdd} aria-label={`添加${stage === 'INPUT' ? '输入' : '输出'}检测规则`}><Plus size={13} />添加规则</button></div>
      <div className="rule-table">
        <div className="rule-table-header"><span>名称</span><span>执行方式</span><span>规则类型</span><span>处置动作</span><span>状态</span><span /></div>
        {stageRules.map(rule => {
          const source = rule.executorType === 'LOCAL' ? '本地执行' : rule.executorType === 'THIRD_PARTY' ? providerLabel(rule.providerId) : '自定义 HTTP';
          return (
            <div className="rule-table-row" key={rule.id}>
              <strong>{rule.name}</strong>
              <span className={`source-tag ${rule.executorType !== 'LOCAL' ? 'external' : ''}`}>{source}</span>
              <span>{typeLabels[rule.ruleType]}</span>
              <span className={`action-tag action-${rule.action.toLowerCase()}`}>{actionLabels[rule.action]}</span>
              <span className={`status-text ${rule.enabled ? 'enabled' : ''}`}>{rule.enabled ? '开启' : '关闭'}</span>
              <button className="icon-button compact" onClick={() => onEdit(rule)} aria-label={`编辑${stageLabel}规则 ${rule.name}`}>•••</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GuardrailSection({ config, dispatch }: GuardrailSectionProps) {
  const [ruleDrawer, setRuleDrawer] = useState<{ stage: GuardrailStage; rule: GuardrailRule | null } | null>(null);
  const [privacyStage, setPrivacyStage] = useState<GuardrailStage | null>(null);
  const [toolChecks, setToolChecks] = useState({ permission: true, sideEffect: true, memory: true, logs: true });

  const saveRule = (rule: GuardrailRule) => {
    dispatch({ type: config.rules.some(item => item.id === rule.id) ? 'update-rule' : 'add-rule', rule });
    setRuleDrawer(null);
  };

  return (
    <>
      <ConfigSection title="护栏配置" icon={ShieldCheck} className="guardrail-section">
        <div className="setting-line guardrail-master">
          <div><strong>启用安全护栏</strong><p>关闭后仍保留密钥、凭证等平台强制安全规则</p></div>
          <Switch checked={config.enabled} onChange={enabled => dispatch({ type: 'set-enabled', enabled })} label="启用安全护栏" />
        </div>
        <label className="stacked-field">兜底回复
          <textarea value={config.fallbackReply} onChange={event => dispatch({ type: 'set-fallback', fallbackReply: event.target.value })} />
        </label>

        <details className="guardrail-group" open>
          <summary><span className="group-icon"><ShieldCheck size={15} /></span><span><strong>输入护栏</strong><small>用户输入进入 Agent 前执行</small></span></summary>
          <div className="guardrail-group-body">
            <div className="subsection-heading"><strong>平台内置能力</strong></div>
            <div className="capability-row"><div><strong>隐私与密钥</strong><p>手机号、证件号、银行卡、邮箱、API Key</p></div><button className="small-button" onClick={() => setPrivacyStage('INPUT')}>配置</button><Switch checked={config.privacy.enabled} onChange={enabled => dispatch({ type: 'set-privacy', privacy: { ...config.privacy, enabled } })} label="启用输入隐私与密钥" /></div>
            <div className="capability-row"><div><strong>内容安全</strong><p>违法、色情、暴力、自伤与仇恨内容</p></div><button className="small-button">配置</button><Switch checked={config.builtin.contentSafety} onChange={enabled => dispatch({ type: 'set-builtin', key: 'contentSafety', enabled })} label="启用内容安全" /></div>
            <div className="capability-row"><div><strong>Prompt Injection</strong><p>忽略规则、提示词泄露和越权指令</p></div><button className="small-button">配置</button><Switch checked={config.builtin.promptInjection} onChange={enabled => dispatch({ type: 'set-builtin', key: 'promptInjection', enabled })} label="启用 Prompt Injection" /></div>
            <RuleTable stage="INPUT" rules={config.rules} onAdd={() => setRuleDrawer({ stage: 'INPUT', rule: null })} onEdit={rule => setRuleDrawer({ stage: 'INPUT', rule })} />
          </div>
        </details>

        <details className="guardrail-group">
          <summary><span className="group-icon"><FileKey size={15} /></span><span><strong>输出护栏</strong><small>Agent 回复发送给用户前执行</small></span></summary>
          <div className="guardrail-group-body">
            <div className="subsection-heading"><strong>平台内置能力</strong></div>
            <div className="capability-row"><div><strong>隐私信息防泄漏</strong><p>回复发送前识别并处理敏感字段</p></div><button className="small-button" onClick={() => setPrivacyStage('OUTPUT')}>配置</button><Switch checked={config.privacy.enabled} onChange={enabled => dispatch({ type: 'set-privacy', privacy: { ...config.privacy, enabled } })} label="启用输出隐私检测" /></div>
            <div className="capability-row"><div><strong>违规回复检测</strong><p>内容安全分类与安全改写</p></div><button className="small-button">配置</button><Switch checked={config.builtin.outputSafety} onChange={enabled => dispatch({ type: 'set-builtin', key: 'outputSafety', enabled })} label="启用违规回复检测" /></div>
            <RuleTable stage="OUTPUT" rules={config.rules} onAdd={() => setRuleDrawer({ stage: 'OUTPUT', rule: null })} onEdit={rule => setRuleDrawer({ stage: 'OUTPUT', rule })} />
          </div>
        </details>

        <details className="guardrail-group">
          <summary><span className="group-icon"><Wrench size={15} /></span><span><strong>Tool 安全</strong><small>执行前由确定性策略校验</small></span></summary>
          <div className="guardrail-group-body">
            <div className="tool-level-grid">
              {[['R0', '计算、时间', '自动执行'], ['R1', '业务只读', '权限校验'], ['R2', '修改、发送', '用户确认'], ['R3', '退款、删除', '人工审核']].map(([level, scope, action]) => <div className={`tool-level level-${level}`} key={level}><strong>{level}</strong><span>{scope}</span><small>{action}</small></div>)}
            </div>
            <div className="capability-row"><div><strong>参数与权限校验</strong><p>Schema、角色、额度和调用条件</p></div><span className="method-tag">确定性策略</span><Switch checked={toolChecks.permission} onChange={permission => setToolChecks({ ...toolChecks, permission })} label="启用参数与权限校验" /></div>
            <div className="capability-row"><div><strong>副作用保护</strong><p>幂等键、重试限制、确认与审核</p></div><span className="method-tag">Tool Gateway</span><Switch checked={toolChecks.sideEffect} onChange={sideEffect => setToolChecks({ ...toolChecks, sideEffect })} label="启用副作用保护" /></div>
          </div>
        </details>

        <details className="guardrail-group">
          <summary><span className="group-icon"><MemoryStick size={15} /></span><span><strong>Memory 与日志隐私</strong><small>控制敏感数据的持久化范围</small></span></summary>
          <div className="guardrail-group-body">
            <div className="capability-row"><div><strong>Memory 写入保护</strong><p>敏感信息与未经确认的推测不写入</p></div><span className="method-tag">白名单 + DLP</span><Switch checked={toolChecks.memory} onChange={memory => setToolChecks({ ...toolChecks, memory })} label="启用 Memory 写入保护" /></div>
            <div className="capability-row"><div><strong>Trace 与日志脱敏</strong><p>保存规则和动作，不保存敏感原文</p></div><span className="method-tag">字段规则</span><Switch checked={toolChecks.logs} onChange={logs => setToolChecks({ ...toolChecks, logs })} label="启用日志脱敏" /></div>
          </div>
        </details>
      </ConfigSection>

      <RuleDrawer open={Boolean(ruleDrawer)} stage={ruleDrawer?.stage ?? 'INPUT'} rule={ruleDrawer?.rule ?? null} onClose={() => setRuleDrawer(null)} onSave={saveRule} />
      <PrivacyDrawer open={Boolean(privacyStage)} stage={privacyStage ?? 'INPUT'} privacy={config.privacy} onClose={() => setPrivacyStage(null)} onSave={privacy => { dispatch({ type: 'set-privacy', privacy }); setPrivacyStage(null); }} />
    </>
  );
}
