import { defaultGuardrailConfig, type GuardrailConfig } from './guardrail.types';

const storageKey = 'uagent-prototype.guardrail-config';

export function loadGuardrailConfig(): GuardrailConfig {
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return structuredClone(defaultGuardrailConfig);

  try {
    const parsed = JSON.parse(stored) as Partial<GuardrailConfig> & {
      fallbackReply?: string;
      privacy?: Record<string, unknown>;
    };
    return {
      ...structuredClone(defaultGuardrailConfig),
      ...parsed,
      fallbackReplies: parsed.fallbackReplies ?? {
        ...defaultGuardrailConfig.fallbackReplies,
        contentBlocked: parsed.fallbackReply ?? defaultGuardrailConfig.fallbackReplies.contentBlocked
      },
      privacy: parsed.privacy && 'entityPolicies' in parsed.privacy
        ? parsed.privacy as GuardrailConfig['privacy']
        : structuredClone(defaultGuardrailConfig.privacy),
      builtin: { ...defaultGuardrailConfig.builtin, ...parsed.builtin },
      rules: parsed.rules ?? structuredClone(defaultGuardrailConfig.rules)
    };
  } catch {
    return structuredClone(defaultGuardrailConfig);
  }
}

export function saveGuardrailConfig(config: GuardrailConfig): void {
  window.localStorage.setItem(storageKey, JSON.stringify(config));
}
