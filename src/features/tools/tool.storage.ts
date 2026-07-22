import type { GlobalTool, ToolField } from './tool.types';
import type { ManagedSkill } from '../skills/skill.types';
import type { SkillToolDeclaration } from './tool.types';

const KEY = 'uagent-global-tools-v1';
const field = (id: string, name: string, type: ToolField['type'], required = true): ToolField => ({ id, name, type, required });

export const defaultTools: GlobalTool[] = [
  { id: 'tool-customer-query', name: '查询客户资料', key: 'customer.query', description: '按客户标识查询客户基础资料。', method: 'GET', endpoint: 'https://api.example.com/customers/{customer_id}', enabled: true, inputFields: [field('customer-id', 'customer_id', 'string')], outputFields: [field('customer-name', 'name', 'string'), field('customer-level', 'level', 'string', false)], updatedAt: '2026-07-21 16:20' },
  { id: 'tool-order-query', name: '查询订单状态', key: 'order.query', description: '查询订单当前状态和配送信息。', method: 'GET', endpoint: 'https://api.example.com/orders/{order_id}', enabled: true, inputFields: [field('order-id', 'order_id', 'string')], outputFields: [field('order-status', 'status', 'string'), field('delivery-time', 'estimated_delivery', 'string', false)], updatedAt: '2026-07-20 11:08' },
  { id: 'tool-refund-create', name: '创建退款申请', key: 'refund.create', description: '创建退款申请并返回申请编号。', method: 'POST', endpoint: 'https://api.example.com/refunds', enabled: false, inputFields: [field('refund-order-id', 'order_id', 'string'), field('refund-reason', 'reason', 'string')], outputFields: [field('refund-id', 'refund_id', 'string'), field('refund-status', 'status', 'string')], updatedAt: '2026-07-18 09:40' }
];

export function loadGlobalTools(): GlobalTool[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return Array.isArray(parsed) ? parsed : structuredClone(defaultTools);
  } catch {
    return structuredClone(defaultTools);
  }
}

export const persistGlobalTools = (tools: GlobalTool[]) => localStorage.setItem(KEY, JSON.stringify(tools));

export function inferSkillTools(skill: ManagedSkill): SkillToolDeclaration[] {
  const files = skill.versions[0]?.files ?? [];
  const markdown = files.filter(item => item.language === 'markdown').map(item => item.content).join('\n');
  const mentionedTools = new Set(Array.from(markdown.matchAll(/`([A-Za-z_]\w*)\s*\(/g), match => match[1]));
  const declarations: SkillToolDeclaration[] = [];
  for (const file of files.filter(item => item.language === 'python')) {
    const pattern = /(?:^|\n)\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g;
    for (const match of file.content.matchAll(pattern)) {
      const name = match[1];
      if (name.startsWith('_')) continue;
      if (mentionedTools.size && !mentionedTools.has(name)) continue;
      const inputFields = match[2].split(',').map((raw, index) => {
        const cleaned = raw.trim().replace(/^\*+/, '').split('=')[0].split(':')[0].trim();
        return cleaned ? field(`${skill.id}-${name}-${index}`, cleaned, 'string', !raw.includes('=')) : null;
      }).filter((value): value is ToolField => Boolean(value));
      declarations.push({ id: `${skill.id}:${name}`, name, key: `${skill.slug}.${name}`, description: `${skill.name}中的${name}工具`, sourcePath: file.path, entrypoint: `${file.path}:${name}`, inputFields, outputFields: [field(`${skill.id}-${name}-result`, 'result', 'object', false)] });
    }
  }
  return declarations;
}
