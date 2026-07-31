import type { GuardrailConfig, GuardrailRule, PrivacyConfig } from './guardrail.types';

export type GuardrailActionEvent =
  | { type: 'set-enabled'; enabled: boolean }
  | { type: 'set-fallbacks'; fallbackReplies: GuardrailConfig['fallbackReplies'] }
  | { type: 'set-privacy'; privacy: PrivacyConfig }
  | { type: 'set-builtin'; key: keyof GuardrailConfig['builtin']; enabled: boolean }
  | { type: 'add-rule'; rule: GuardrailRule }
  | { type: 'update-rule'; rule: GuardrailRule }
  | { type: 'delete-rule'; ruleId: string };

export function guardrailReducer(state: GuardrailConfig, event: GuardrailActionEvent): GuardrailConfig {
  switch (event.type) {
    case 'set-enabled':
      return { ...state, enabled: event.enabled };
    case 'set-fallbacks':
      return { ...state, fallbackReplies: event.fallbackReplies };
    case 'set-privacy':
      return { ...state, privacy: event.privacy };
    case 'set-builtin':
      return { ...state, builtin: { ...state.builtin, [event.key]: event.enabled } };
    case 'add-rule':
      return { ...state, rules: [...state.rules, event.rule] };
    case 'update-rule':
      return {
        ...state,
        rules: state.rules.map(rule => (rule.id === event.rule.id ? event.rule : rule))
      };
    case 'delete-rule':
      return { ...state, rules: state.rules.filter(rule => rule.id !== event.ruleId) };
    default:
      return state;
  }
}
