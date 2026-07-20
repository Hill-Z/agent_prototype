export type ThinkingMode = 'fast' | 'deep' | 'custom';
export type WorkspaceTab = 'orchestration' | 'channels' | 'memory' | 'api' | 'logs' | 'monitor' | 'reports' | 'review';

export interface VariableDefinition { id: string; key: string; name: string; type: '文本' | '段落' | '下拉选项' | '数字'; required: boolean; }
export interface SessionField { id: string; name: string; description: string; aliases: string; type: string; regex: string; confidence: number; conflict: string; required: boolean; }
export interface SessionExtractor { id: string; skill: string; fields: string[]; }
export interface ReviewTool { id: string; tool: string; timeout: number; strategy: string; }
export interface ReviewChannel { id: string; type: string; endpoint: string; }

export interface AgentConfig {
  prompt: string;
  openingEnabled: boolean;
  openingText: string;
  thinkingMode: ThinkingMode;
  maxThinkingSteps: number;
  maxRetries: number;
  variables: VariableDefinition[];
  skills: string[];
  skillBindings: Record<string, { version: string; autoUpdate: boolean }>;
  tools: string[];
  knowledgeBases: string[];
  longMemory: { enabled: boolean; agentStore: string; userStore: string; recallCount: number; weight: number };
  compression: { enabled: boolean; triggerTurns: number; tokenRatio: number; windowSize: number; syncMemory: boolean };
  session: { enabled: boolean; fields: SessionField[]; extractors: SessionExtractor[] };
  reflection: { enabled: boolean; maxCount: number; intensity: string; mode: string; prompt: string };
  manualReview: { enabled: boolean; tools: ReviewTool[]; channels: ReviewChannel[] };
  responseExperience: { humanizedTimingEnabled: boolean; typingStyle: 'natural' | 'continuous'; initialDelayMs: number; minTypingMs: number; splitLongRepliesEnabled: boolean; maxReplyMessages: number };
  conversationBehavior: { replanOnNewMessage: boolean; stopPendingMessages: boolean };
  proactiveService: { longTaskNoticeEnabled: boolean; longTaskThresholdSeconds: number; asyncCompletionEnabled: boolean; suppressDuringActiveConversation: boolean };
  multimodal: {
    imageEnabled: boolean;
    audioEnabled: boolean;
    asrProvider: string;
    language: string;
  };
  model: { id: string; preset: string; temperatureEnabled: boolean; temperature: number; topPEnabled: boolean; topP: number; frequencyEnabled: boolean; frequencyPenalty: number; presenceEnabled: boolean; presencePenalty: number; maxTokensEnabled: boolean; maxTokens: number; thinking: boolean };
}

export const defaultAgentConfig: AgentConfig = {
  prompt: '你的回复语种必须跟用户的提问语种一致，可以处理图片和文件。如果客户上传了 PDF 文件，直接解析文件内容并返回结果。',
  openingEnabled: false,
  openingText: '你好 {{user_name}}，我是智能客服，请问有什么可以帮你？',
  thinkingMode: 'deep',
  maxThinkingSteps: 3,
  maxRetries: 3,
  variables: [],
  skills: [],
  skillBindings: {},
  tools: [],
  knowledgeBases: [],
  longMemory: { enabled: false, agentStore: '', userStore: '', recallCount: 5, weight: 80 },
  compression: { enabled: true, triggerTurns: 5, tokenRatio: 0.8, windowSize: 262144, syncMemory: false },
  session: { enabled: false, fields: [], extractors: [] },
  reflection: { enabled: false, maxCount: 5, intensity: '', mode: '', prompt: '' },
  manualReview: { enabled: false, tools: [], channels: [] },
  responseExperience: { humanizedTimingEnabled: true, typingStyle: 'natural', initialDelayMs: 500, minTypingMs: 800, splitLongRepliesEnabled: true, maxReplyMessages: 3 },
  conversationBehavior: { replanOnNewMessage: true, stopPendingMessages: true },
  proactiveService: { longTaskNoticeEnabled: true, longTaskThresholdSeconds: 10, asyncCompletionEnabled: true, suppressDuringActiveConversation: true },
  multimodal: { imageEnabled: true, audioEnabled: true, asrProvider: 'Udesk ASR', language: '自动识别' },
  model: { id: 'Doubao-Seed-2.0-pro', preset: 'balanced', temperatureEnabled: false, temperature: 0, topPEnabled: false, topP: 0, frequencyEnabled: false, frequencyPenalty: 0, presenceEnabled: false, presencePenalty: -2, maxTokensEnabled: false, maxTokens: 1, thinking: false }
};

export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
