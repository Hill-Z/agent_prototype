export type GuardrailStage = 'INPUT' | 'OUTPUT' | 'TOOL_RESULT';
export type ExecutorType = 'LOCAL' | 'THIRD_PARTY' | 'CUSTOM_HTTP';
export type RuleType = 'KEYWORD' | 'REGEX' | 'CONTENT_MODERATION' | 'CUSTOM';
export type GuardrailAction = 'ALLOW' | 'MASK' | 'BLOCK' | 'CONFIRM' | 'HANDOFF' | 'REWRITE';
export type FailureMode = 'ALLOW_AND_LOG' | 'BLOCK_WITH_FALLBACK' | 'HANDOFF';
export type MatchMode = 'CONTAINS' | 'EXACT' | 'WHOLE_WORD';
export type GuardrailHealth = 'READY' | 'INCOMPLETE' | 'ERROR';
export type PrivacyEntityType = 'PHONE' | 'ID_CARD' | 'BANK_CARD' | 'EMAIL' | 'API_KEY' | 'ACCESS_TOKEN';
export type PrivacyAction = 'TOKENIZE' | 'MASK' | 'REMOVE' | 'BLOCK' | 'PASS';

export interface MatcherConfig {
  keywords?: string[];
  patterns?: string[];
  matchMode?: MatchMode;
  ignoreCase?: boolean;
  normalizeWidth?: boolean;
  trimSpaces?: boolean;
}

export interface CustomHttpConfig {
  endpoint: string;
  method: 'POST';
  credentialId?: string;
  requestTemplate: string;
  decisionPath: string;
}

export interface GuardrailRule {
  id: string;
  name: string;
  stages: GuardrailStage[];
  executorType: ExecutorType;
  ruleType: RuleType;
  matcher: MatcherConfig;
  action: GuardrailAction;
  enabled: boolean;
  providerId?: string;
  credentialId?: string;
  timeoutMs?: number;
  failureMode?: FailureMode;
  customHttp?: CustomHttpConfig;
  health?: GuardrailHealth;
  lastTestedAt?: string;
}

export interface PrivacyEntityPolicy {
  input: PrivacyAction;
  toolResult: PrivacyAction;
  output: PrivacyAction;
}

export interface PrivacyConfig {
  inputEnabled: boolean;
  toolResultEnabled: boolean;
  outputEnabled: boolean;
  entityPolicies: Record<PrivacyEntityType, PrivacyEntityPolicy>;
}

export interface BuiltinGuardrailConfig {
  contentSafety: boolean;
  promptInjection: boolean;
  outputSafety: boolean;
}

export interface GuardrailConfig {
  enabled: boolean;
  fallbackReplies: {
    contentBlocked: string;
    privacyHandled: string;
    detectorUnavailable: string;
    handoff: string;
    rewriteFailed: string;
  };
  privacy: PrivacyConfig;
  builtin: BuiltinGuardrailConfig;
  rules: GuardrailRule[];
}

export interface EvaluationResult {
  decision: GuardrailAction;
  transformedText: string;
  matchedRules: string[];
  trace: Array<{ ruleId: string; detector: string; action: GuardrailAction }>;
}

export const defaultGuardrailConfig: GuardrailConfig = {
  enabled: true,
  fallbackReplies: {
    contentBlocked: '抱歉，我暂时无法处理该请求。',
    privacyHandled: '为保护您的信息，部分敏感内容已隐藏。',
    detectorUnavailable: '当前暂时无法处理，请稍后再试。',
    handoff: '这个问题需要人工客服进一步处理。',
    rewriteFailed: '抱歉，我暂时无法提供合适的回答。'
  },
  privacy: {
    inputEnabled: true,
    toolResultEnabled: true,
    outputEnabled: true,
    entityPolicies: {
      PHONE: { input: 'MASK', toolResult: 'MASK', output: 'MASK' },
      EMAIL: { input: 'TOKENIZE', toolResult: 'MASK', output: 'MASK' },
      ID_CARD: { input: 'BLOCK', toolResult: 'REMOVE', output: 'BLOCK' },
      BANK_CARD: { input: 'BLOCK', toolResult: 'REMOVE', output: 'BLOCK' },
      API_KEY: { input: 'BLOCK', toolResult: 'REMOVE', output: 'BLOCK' },
      ACCESS_TOKEN: { input: 'BLOCK', toolResult: 'REMOVE', output: 'BLOCK' }
    }
  },
  builtin: {
    contentSafety: true,
    promptInjection: true,
    outputSafety: true
  },
  rules: [
    {
      id: 'rule-refund-keywords',
      name: '高风险操作关键词',
      stages: ['INPUT'],
      executorType: 'LOCAL',
      ruleType: 'KEYWORD',
      matcher: {
        keywords: ['强制退款', '直接退款', '删除', '修改权限', '权限修改', '外发'],
        matchMode: 'CONTAINS',
        ignoreCase: true,
        normalizeWidth: true,
        trimSpaces: true
      },
      action: 'CONFIRM',
      enabled: true,
      health: 'READY'
    },
    {
      id: 'rule-output-promises',
      name: '敏感承诺关键词',
      stages: ['OUTPUT'],
      executorType: 'LOCAL',
      ruleType: 'KEYWORD',
      matcher: {
        keywords: ['保证退款', '一定到账', '绝对有效'],
        matchMode: 'CONTAINS'
      },
      action: 'REWRITE',
      enabled: true,
      health: 'READY'
    },
    {
      id: 'rule-aliyun-content',
      name: '阿里云内容审核',
      stages: ['INPUT'],
      executorType: 'THIRD_PARTY',
      ruleType: 'CONTENT_MODERATION',
      matcher: {},
      action: 'BLOCK',
      enabled: true,
      providerId: 'aliyun-content-security',
      credentialId: 'credential-aliyun-prod',
      timeoutMs: 500,
      failureMode: 'ALLOW_AND_LOG',
      health: 'READY',
      lastTestedAt: '07-31 15:20'
    },
    {
      id: 'rule-aliyun-output',
      name: '阿里云回复审核',
      stages: ['OUTPUT'],
      executorType: 'THIRD_PARTY',
      ruleType: 'CONTENT_MODERATION',
      matcher: {},
      action: 'BLOCK',
      enabled: true,
      providerId: 'aliyun-content-security',
      credentialId: 'credential-aliyun-prod',
      timeoutMs: 500,
      failureMode: 'ALLOW_AND_LOG',
      health: 'READY',
      lastTestedAt: '07-31 15:20'
    },
    {
      id: 'rule-tool-sensitive-fields',
      name: '工具敏感字段',
      stages: ['TOOL_RESULT'],
      executorType: 'LOCAL',
      ruleType: 'CUSTOM',
      matcher: {},
      action: 'MASK',
      enabled: true,
      health: 'READY'
    },
    {
      id: 'rule-tool-internal-errors',
      name: '内部错误信息',
      stages: ['TOOL_RESULT'],
      executorType: 'LOCAL',
      ruleType: 'REGEX',
      matcher: { patterns: ['stack trace', 'internal server', 'jdbc:'], ignoreCase: true },
      action: 'REWRITE',
      enabled: true,
      health: 'READY'
    }
  ]
};
