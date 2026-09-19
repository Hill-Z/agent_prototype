import { defaultAgentConfig, type AgentConfig } from './agent.types';

const KEY = 'uagent-advanced-config-v1';
const SAVED_KEY = 'uagent-advanced-config-saved-v1';

function withDefaults(value: Partial<AgentConfig> | null): AgentConfig {
  const defaults = structuredClone(defaultAgentConfig);
  const storedMemory = value?.longMemory as Partial<AgentConfig['longMemory']> | undefined;
  const storedRouting = value?.modelRouting as Partial<AgentConfig['modelRouting']> | undefined;
  return {
    ...defaults,
    ...value,
    longMemory: {
      ...defaults.longMemory,
      ...storedMemory,
      backupKeys: Array.isArray(storedMemory?.backupKeys) ? storedMemory.backupKeys : defaults.longMemory.backupKeys,
      profileFields: Array.isArray(storedMemory?.profileFields) ? storedMemory.profileFields : defaults.longMemory.profileFields,
      profilePrompt: typeof storedMemory?.profilePrompt === 'string' ? storedMemory.profilePrompt : defaults.longMemory.profilePrompt,
      summaryPrompt: typeof storedMemory?.summaryPrompt === 'string' ? storedMemory.summaryPrompt : defaults.longMemory.summaryPrompt
    },
    responseExperience: { ...defaults.responseExperience, ...value?.responseExperience },
    conversationBehavior: { ...defaults.conversationBehavior, ...value?.conversationBehavior },
    proactiveService: { ...defaults.proactiveService, ...value?.proactiveService },
    multimodal: { ...defaults.multimodal, ...value?.multimodal },
    planning: { ...defaults.planning, ...value?.planning },
    modelRouting: {
      ...defaults.modelRouting,
      ...storedRouting,
      pool: Array.isArray(storedRouting?.pool) && storedRouting.pool.length
        ? storedRouting.pool.map(item => ({ ...item, parameters: { ...defaults.modelRouting.pool[0].parameters, ...item.parameters } }))
        : defaults.modelRouting.pool
    }
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
