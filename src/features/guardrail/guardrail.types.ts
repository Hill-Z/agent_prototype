export type GuardrailStage = 'INPUT' | 'OUTPUT' | 'TOOL_RESULT';
export type ExecutorType = 'LOCAL' | 'THIRD_PARTY' | 'CUSTOM_HTTP';
export type RuleType = 'KEYWORD' | 'REGEX' | 'CONTENT_MODERATION' | 'CUSTOM';
export type GuardrailAction = 'ALLOW' | 'MASK' | 'BLOCK' | 'CONFIRM' | 'HANDOFF' | 'REWRITE';
export type FailureMode = 'ALLOW_AND_LOG' | 'BLOCK_WITH_FALLBACK' | 'HANDOFF';
export type MatchMode = 'CONTAINS' | 'EXACT' | 'WHOLE_WORD';

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
}

export interface PrivacyConfig {
  enabled: boolean;
  entityTypes: string[];
  modelInputAction: 'TOKENIZE' | 'MASK' | 'BLOCK';
  outputAction: 'MASK' | 'BLOCK' | 'PASS';
  allowedToolIds: string[];
  memoryAction: 'DROP' | 'MASK';
  logAction: 'MASK' | 'TYPE_ONLY';
}

export interface BuiltinGuardrailConfig {
  contentSafety: boolean;
  promptInjection: boolean;
  outputSafety: boolean;
}

export interface GuardrailConfig {
  enabled: boolean;
  fallbackReply: string;
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
  fallbackReply: '抱歉，这个请求可能涉及敏感或高风险内容，我暂时无法直接处理。如需帮助，可以转接人工客服。',
  privacy: {
    enabled: true,
    entityTypes: ['PHONE', 'ID_CARD', 'BANK_CARD', 'EMAIL', 'API_KEY', 'ACCESS_TOKEN'],
    modelInputAction: 'TOKENIZE',
    outputAction: 'MASK',
    allowedToolIds: ['customer-query', 'order-query'],
    memoryAction: 'DROP',
    logAction: 'MASK'
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
      enabled: true
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
      enabled: true
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
      failureMode: 'ALLOW_AND_LOG'
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
      failureMode: 'ALLOW_AND_LOG'
    }
  ]
};
