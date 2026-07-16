import { defaultGuardrailConfig, type GuardrailConfig } from './guardrail.types';

const storageKey = 'uagent-prototype.guardrail-config';

export function loadGuardrailConfig(): GuardrailConfig {
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return structuredClone(defaultGuardrailConfig);

  try {
    return JSON.parse(stored) as GuardrailConfig;
  } catch {
    return structuredClone(defaultGuardrailConfig);
  }
}

export function saveGuardrailConfig(config: GuardrailConfig): void {
  window.localStorage.setItem(storageKey, JSON.stringify(config));
}

