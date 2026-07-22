import type { SkillToolBinding, SkillToolDeclaration } from '../tools/tool.types';

export type SkillStatus = 'draft' | 'published' | 'validating' | 'failed';

export interface SkillFile { path: string; language: string; content: string; editable: boolean; }
export interface SkillVersion { version: string; status: 'draft' | 'published'; createdAt: string; author: string; note: string; files: SkillFile[]; }
export interface ManagedSkill {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  status: SkillStatus;
  source: 'upload' | 'ai' | 'online';
  currentVersion: string;
  updatedAt: string;
  versions: SkillVersion[];
  references: Array<{ agent: string; version: string; autoUpdate: boolean }>;
  declaredTools?: SkillToolDeclaration[];
  toolBindings?: SkillToolBinding[];
}

const customerFiles: SkillFile[] = [
  { path: 'SKILL.md', language: 'markdown', editable: true, content: `# Customer Profile Update\n\n## Purpose\nSafely update customer profile fields after identity verification.\n\n## Inputs\n- customer_id: string\n- fields: object\n\n## Tools\n- Read the profile with \`get_customer_update_profile(account_no, language)\`.\n- Submit changes with \`submit_account_update(account_no, update_type, new_value, language)\`.\n\n## Workflow\n1. Verify the requester.\n2. Read the existing profile.\n3. Validate allowed fields.\n4. Ask for confirmation before writing.\n5. Call the update tool with an idempotency key.\n` },
  { path: 'references/field-policy.md', language: 'markdown', editable: true, content: '# Allowed fields\n\nAllowed: language, timezone, contact preference.\nForbidden: account role, credit limit.' },
  { path: 'scripts/validate.py', language: 'python', editable: true, content: 'def validate(payload):\n    forbidden = {"role", "credit_limit"}\n    return not forbidden.intersection(payload.keys())\n' },
  { path: 'scripts/tool.py', language: 'python', editable: true, content: 'def get_customer_update_profile(account_no: str = "", language: str = "zh") -> str:\n    return "FINAL_ANSWER: profile"\n\ndef submit_account_update(account_no: str = "", update_type: str = "", new_value: str = "", language: str = "zh") -> str:\n    return "FINAL_ANSWER: submitted"\n' }
];

export const defaultSkills: ManagedSkill[] = [
  { id: 'skill-account-update', name: '客户资料更新', slug: 'account_update', description: '校验客户身份并安全更新允许修改的资料字段。', category: '客户服务', tags: ['高频', '含工具'], status: 'published', source: 'upload', currentVersion: 'v1.2.0', updatedAt: '2026-07-15 17:20', references: [{ agent: 'new高级智能体', version: 'v1.2.0', autoUpdate: true }], toolBindings: [{ id: 'binding-account-query', toolId: 'tool-customer-query', enabled: true, timeoutSeconds: 30, fallbackAction: 'failure_message', startMessage: '我来帮您查询客户资料。', runningMessage: '正在核对资料，请稍等。', progressAfterSeconds: 10, progressMessage: '还需要一点时间，我继续帮您处理。', successMessage: '客户资料已经查询完成。', failureMessage: '暂时没有查询成功，我可以继续为您处理。' }], versions: [
    { version: 'v1.2.0', status: 'published', createdAt: '2026-07-15 17:20', author: 'Alex', note: '增加幂等与字段白名单', files: customerFiles },
    { version: 'v1.1.0', status: 'published', createdAt: '2026-07-08 10:42', author: 'Alex', note: '增加身份核验步骤', files: customerFiles.map(file => ({ ...file })) },
    { version: 'v1.0.0', status: 'published', createdAt: '2026-06-30 14:10', author: 'Alex', note: '首次发布', files: customerFiles.map(file => ({ ...file })) }
  ]},
  { id: 'skill-refund', name: '退款协商', slug: 'refund_negotiation', description: '识别退款原因，核对政策并生成可执行的协商方案。', category: '售后服务', tags: ['风险操作', '含工具'], status: 'draft', source: 'ai', currentVersion: 'v0.4.0', updatedAt: '2026-07-16 09:35', references: [], toolBindings: [], versions: [{ version: 'v0.4.0', status: 'draft', createdAt: '2026-07-16 09:35', author: 'Alex', note: 'AI 优化草稿', files: customerFiles.map(file => ({ ...file, content: file.content.replace('Customer Profile Update', 'Refund Negotiation') })) }] },
  { id: 'skill-ticket-summary', name: '工单总结', slug: 'ticket_summary', description: '从多轮客服对话中提取问题、行动与后续事项。', category: '效率工具', tags: ['只读'], status: 'published', source: 'online', currentVersion: 'v2.0.0', updatedAt: '2026-07-12 16:08', references: [{ agent: '售后工单助手', version: 'v2.0.0', autoUpdate: false }], toolBindings: [], versions: [{ version: 'v2.0.0', status: 'published', createdAt: '2026-07-12 16:08', author: '徐良植', note: '结构化输出升级', files: customerFiles.map(file => ({ ...file, content: file.content.replace('Customer Profile Update', 'Ticket Summary') })) }] }
];

export const skillVersionOptions: Record<string, string[]> = {
  '客户意图识别': ['v1.3.0', 'v1.2.0', 'v1.0.0'],
  '退款协商': ['v0.4.0', 'v0.3.0'],
  '工单总结': ['v2.0.0', 'v1.4.0'],
  '多语言客服': ['v1.1.0', 'v1.0.0']
};
