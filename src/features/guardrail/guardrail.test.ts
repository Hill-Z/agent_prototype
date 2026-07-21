import { describe, expect, it } from 'vitest';
import { evaluateGuardrail } from './guardrail.evaluator';
import { guardrailReducer } from './guardrail.reducer';
import { defaultGuardrailConfig } from './guardrail.types';

describe('guardrail rule model', () => {
  it('adds and updates the same rule instead of creating disconnected display rows', () => {
    const added = guardrailReducer(defaultGuardrailConfig, {
      type: 'add-rule',
      rule: {
        id: 'rule-new',
        name: '退款关键词',
        stages: ['INPUT'],
        executorType: 'LOCAL',
        ruleType: 'KEYWORD',
        matcher: { keywords: ['强制退款'], matchMode: 'CONTAINS' },
        action: 'CONFIRM',
        enabled: true
      }
    });

    const updated = guardrailReducer(added, {
      type: 'update-rule',
      rule: { ...added.rules.at(-1)!, name: '退款与删除关键词', stages: ['INPUT', 'OUTPUT'] }
    });

    expect(updated.rules).toHaveLength(defaultGuardrailConfig.rules.length + 1);
    expect(updated.rules.at(-1)).toMatchObject({
      id: 'rule-new',
      name: '退款与删除关键词',
      stages: ['INPUT', 'OUTPUT']
    });
  });

  it('keeps third-party provider, credential, timeout, and failure behavior together', () => {
    const thirdParty = defaultGuardrailConfig.rules.find(rule => rule.executorType === 'THIRD_PARTY');

    expect(thirdParty).toMatchObject({
      providerId: 'aliyun-content-security',
      credentialId: 'credential-aliyun-prod',
      timeoutMs: 500,
      failureMode: 'ALLOW_AND_LOG'
    });
  });
});

describe('guardrail evaluation', () => {
  it('uses configured keyword rules instead of only hard-coded demo patterns', () => {
    const result = evaluateGuardrail('请给我强制退款', defaultGuardrailConfig, 'INPUT');

    expect(result.decision).toBe('CONFIRM');
    expect(result.matchedRules).toContain('rule-refund-keywords');
  });

  it('keeps mandatory secret blocking active when agent guardrails are disabled', () => {
    const result = evaluateGuardrail(
      '这是密钥 sk-proj-1234567890abcdef',
      { ...defaultGuardrailConfig, enabled: false },
      'INPUT'
    );

    expect(result.decision).toBe('BLOCK');
    expect(result.matchedRules).toContain('platform-secret-baseline');
  });

  it('chooses confirmation over masking when a request contains both PII and a risky action', () => {
    const result = evaluateGuardrail(
      '给手机号 13800138000 的客户直接退款 200 元',
      defaultGuardrailConfig,
      'INPUT'
    );

    expect(result.decision).toBe('CONFIRM');
    expect(result.transformedText).toContain('138****8000');
  });

  it('only applies rules assigned to the current stage', () => {
    const inputResult = evaluateGuardrail('保证退款一定到账', defaultGuardrailConfig, 'INPUT');
    const outputResult = evaluateGuardrail('保证退款一定到账', defaultGuardrailConfig, 'OUTPUT');

    expect(inputResult.matchedRules).not.toContain('rule-output-promises');
    expect(outputResult.matchedRules).toContain('rule-output-promises');
  });
});

