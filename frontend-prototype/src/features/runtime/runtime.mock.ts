import type { EvaluationResult } from '../guardrail/guardrail.types';
import type { RuntimeScenario, RuntimeStep } from './runtime.types';

const step = (id: string, kind: RuntimeStep['kind'], title: string, detail: string, durationMs: number): RuntimeStep => ({ id, kind, title, detail, durationMs });

export function createRuntimeScenario(input: string, result: EvaluationResult, fallbackReply: string): RuntimeScenario {
  const safeInput = result.transformedText;
  if (result.decision === 'BLOCK') {
    return {
      id: 'blocked-request',
      reply: fallbackReply,
      steps: [
        step('receive', 'analysis', '理解用户请求', '识别语言、消息类型和主要诉求', 180),
        step('input-guardrail', 'guardrail', '输入护栏拦截', '命中阻断规则，本次 Run 不进入 Agent 执行循环', 120),
        step('fallback', 'generation', '生成安全回复', '使用当前护栏兜底回复', 160)
      ]
    };
  }
  if (result.decision === 'CONFIRM') {
    return {
      id: 'confirmation-required',
      reply: `这个操作需要您确认后才能继续。已保护敏感信息：${safeInput}`,
      steps: [
        step('receive', 'analysis', '理解用户请求', '识别为涉及资金或状态变更的高风险操作', 190),
        step('input-guardrail', 'guardrail', '输入护栏完成', '敏感数据已脱敏，风险动作要求用户确认', 140),
        step('plan', 'analysis', '规划执行步骤', '确认身份与操作范围后再进入业务工具', 260),
        step('confirm', 'generation', '生成确认请求', '暂停工具执行并向用户请求明确确认', 180)
      ]
    };
  }
  if (/订单|物流|配送|快递/.test(input)) {
    return {
      id: 'order-query',
      reply: '您的订单目前正在配送中，预计今天 18:00 前送达。',
      steps: [
        step('receive', 'analysis', '理解用户请求', '识别意图为订单配送状态查询', 170),
        step('guardrail', 'guardrail', '输入护栏完成', '未发现需要阻断或确认的风险', 110),
        step('skill', 'skill', '加载订单查询技能', '命中 skill：order_delivery_query v1.3.0', 210),
        step('tool', 'tool', '调用订单中心', 'get_order_delivery 返回 1 条配送记录', 620),
        step('compose', 'generation', '整理回复', '合并配送状态与预计送达时间', 330)
      ]
    };
  }
  return {
    id: 'knowledge-answer',
    reply: `已根据当前知识库整理：${safeInput}`,
    steps: [
      step('receive', 'analysis', '理解用户请求', '完成意图识别与关键信息抽取', 160),
      step('guardrail', 'guardrail', '输入护栏完成', '请求允许进入 Agent 执行循环', 110),
      step('plan', 'analysis', '规划回答路径', '优先检索知识库，未命中时使用模型回答', 230),
      step('knowledge', 'knowledge', '检索知识库', '召回 4 条内容，重排后保留 2 条', 510),
      step('compose', 'generation', '生成最终回复', '根据召回内容生成完整答案并执行输出护栏', 360)
    ]
  };
}
