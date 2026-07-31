import type {
  EvaluationResult,
  GuardrailAction,
  GuardrailConfig,
  GuardrailRule,
  GuardrailStage,
  PrivacyAction,
  PrivacyEntityType
} from './guardrail.types';

const actionPriority: Record<GuardrailAction, number> = {
  ALLOW: 0,
  MASK: 1,
  REWRITE: 1,
  CONFIRM: 2,
  HANDOFF: 2,
  BLOCK: 3
};

const secretPattern = /\b(?:sk-|ak-|api[_-]?key\s*[:=]|bearer\s+)[A-Za-z0-9._-]{8,}\b/i;
const phonePattern = /\b1[3-9]\d{9}\b/g;
const idCardPattern = /\b\d{17}[\dXx]\b/g;
const bankCardPattern = /\b\d{16,19}\b/g;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const injectionPattern = /(忽略|无视|绕过).{0,12}(规则|指令|限制)|系统提示词|developer message|reveal.{0,8}prompt/i;
const prohibitedPattern = /(制作炸弹|实施诈骗|自杀方法|未成年人色情)/i;

function normalizeText(text: string, rule: GuardrailRule): string {
  let normalized = text;
  if (rule.matcher.trimSpaces) normalized = normalized.replace(/\s+/g, ' ').trim();
  if (rule.matcher.ignoreCase) normalized = normalized.toLocaleLowerCase();
  return normalized;
}

function matchesRule(text: string, rule: GuardrailRule): boolean {
  if (rule.executorType !== 'LOCAL') return false;
  const normalized = normalizeText(text, rule);

  if (rule.ruleType === 'KEYWORD') {
    return (rule.matcher.keywords ?? []).some(keyword => {
      const expected = rule.matcher.ignoreCase ? keyword.toLocaleLowerCase() : keyword;
      if (rule.matcher.matchMode === 'EXACT') return normalized === expected;
      if (rule.matcher.matchMode === 'WHOLE_WORD') {
        return new RegExp(`(^|\\s)${escapeRegExp(expected)}(?=\\s|$)`).test(normalized);
      }
      return normalized.includes(expected);
    });
  }

  if (rule.ruleType === 'REGEX') {
    return (rule.matcher.patterns ?? []).some(pattern => new RegExp(pattern, rule.matcher.ignoreCase ? 'i' : '').test(normalized));
  }

  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskPii(text: string): string {
  return text
    .replace(phonePattern, value => `${value.slice(0, 3)}****${value.slice(-4)}`)
    .replace(idCardPattern, value => `${value.slice(0, 6)}********${value.slice(-4)}`)
    .replace(bankCardPattern, value => `${value.slice(0, 4)} **** **** ${value.slice(-4)}`)
    .replace(emailPattern, value => {
      const [name, domain] = value.split('@');
      return `${name.slice(0, 2)}***@${domain}`;
    });
}

const privacyPatterns: Partial<Record<PrivacyEntityType, RegExp>> = {
  PHONE: phonePattern,
  ID_CARD: idCardPattern,
  BANK_CARD: bankCardPattern,
  EMAIL: emailPattern
};

function privacyActionForStage(action: { input: PrivacyAction; toolResult: PrivacyAction; output: PrivacyAction }, stage: GuardrailStage): PrivacyAction {
  return stage === 'INPUT' ? action.input : stage === 'TOOL_RESULT' ? action.toolResult : action.output;
}

function privacyEnabledForStage(config: GuardrailConfig, stage: GuardrailStage): boolean {
  if (stage === 'INPUT') return config.privacy.inputEnabled;
  if (stage === 'TOOL_RESULT') return config.privacy.toolResultEnabled;
  return config.privacy.outputEnabled;
}

function applyPrivacyAction(text: string, entity: PrivacyEntityType, action: PrivacyAction, index: number): string {
  const pattern = privacyPatterns[entity];
  if (!pattern || action === 'PASS' || action === 'BLOCK') return text;
  pattern.lastIndex = 0;
  if (action === 'REMOVE') return text.replace(pattern, '');
  if (action === 'TOKENIZE') return text.replace(pattern, `{{${entity}_${index}}}`);
  return maskPii(text);
}

export function evaluateGuardrail(
  text: string,
  config: GuardrailConfig,
  stage: GuardrailStage
): EvaluationResult {
  const matches: EvaluationResult['trace'] = [];
  let transformedText = text;

  if (secretPattern.test(text)) {
    matches.push({ ruleId: 'platform-secret-baseline', detector: 'SECRET', action: 'BLOCK' });
  }

  if (config.enabled) {
    if (stage === 'INPUT' && config.builtin.promptInjection && injectionPattern.test(text)) {
      matches.push({ ruleId: 'platform-prompt-injection', detector: 'PROMPT_INJECTION', action: 'BLOCK' });
    }
    if (config.builtin.contentSafety && prohibitedPattern.test(text)) {
      matches.push({ ruleId: 'platform-content-safety', detector: 'CONTENT', action: 'BLOCK' });
    }
    if (privacyEnabledForStage(config, stage)) {
      let privacyIndex = 0;
      (Object.keys(config.privacy.entityPolicies) as PrivacyEntityType[]).forEach(entity => {
        const pattern = privacyPatterns[entity];
        if (!pattern) return;
        pattern.lastIndex = 0;
        if (!pattern.test(text)) return;
        pattern.lastIndex = 0;
        privacyIndex += 1;
        const privacyAction = privacyActionForStage(config.privacy.entityPolicies[entity], stage);
        if (privacyAction === 'PASS') return;
        transformedText = applyPrivacyAction(transformedText, entity, privacyAction, privacyIndex);
        matches.push({
          ruleId: `platform-pii-${entity.toLowerCase()}`,
          detector: entity,
          action: privacyAction === 'BLOCK' ? 'BLOCK' : 'MASK'
        });
      });
    }

    config.rules
      .filter(rule => rule.enabled && rule.stages.includes(stage))
      .filter(rule => matchesRule(text, rule))
      .forEach(rule => matches.push({ ruleId: rule.id, detector: rule.ruleType, action: rule.action }));
  }

  const decision = matches.reduce<GuardrailAction>(
    (current, match) => (actionPriority[match.action] > actionPriority[current] ? match.action : current),
    'ALLOW'
  );

  return {
    decision,
    transformedText,
    matchedRules: matches.map(match => match.ruleId),
    trace: matches
  };
}
