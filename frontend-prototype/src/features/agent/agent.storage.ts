import { defaultAgentConfig, type AgentConfig } from './agent.types';

const KEY = 'uagent-advanced-config-v1';
const SAVED_KEY = 'uagent-advanced-config-saved-v1';

function withDefaults(value: Partial<AgentConfig> | null): AgentConfig {
  const defaults = structuredClone(defaultAgentConfig);
  return {
    ...defaults,
    ...value,
    responseExperience: { ...defaults.responseExperience, ...value?.responseExperience },
    multimodal: { ...defaults.multimodal, ...value?.multimodal }
  };
}

export function loadAgentConfig(): AgentConfig {
  try { return withDefaults(JSON.parse(localStorage.getItem(KEY) ?? 'null')); }
  catch { return structuredClone(defaultAgentConfig); }
}
export const persistAgentConfig = (config: AgentConfig) => localStorage.setItem(KEY, JSON.stringify(config));
export const saveAgentSnapshot = (config: AgentConfig) => localStorage.setItem(SAVED_KEY, JSON.stringify(config));
export function loadSavedSnapshot(): AgentConfig {
  try { return withDefaults(JSON.parse(localStorage.getItem(SAVED_KEY) ?? 'null')); }
  catch { return structuredClone(defaultAgentConfig); }
}
