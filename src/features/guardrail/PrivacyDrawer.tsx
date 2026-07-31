import { useEffect, useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { PrivacyAction, PrivacyConfig, PrivacyEntityType } from './guardrail.types';

interface PrivacyDrawerProps {
  open: boolean;
  privacy: PrivacyConfig;
  onClose: () => void;
  onSave: (privacy: PrivacyConfig) => void;
}

const entities: Array<{ value: PrivacyEntityType; label: string; example: string; mandatory?: boolean }> = [
  { value: 'PHONE', label: '手机号', example: '13812345678' },
  { value: 'EMAIL', label: '邮箱', example: 'alex@example.com' },
  { value: 'ID_CARD', label: '身份证', example: '110101199001011234' },
  { value: 'BANK_CARD', label: '银行卡', example: '6222021234567890123' },
  { value: 'API_KEY', label: 'API Key', example: 'sk-proj-1234567890', mandatory: true },
  { value: 'ACCESS_TOKEN', label: 'Access Token', example: 'Bearer eyJhbGciOiJIUzI1NiJ9', mandatory: true }
];

const actionOptions: Array<{ value: PrivacyAction; label: string }> = [
  { value: 'TOKENIZE', label: '替换为占位符' },
  { value: 'MASK', label: '部分隐藏' },
  { value: 'REMOVE', label: '完全移除' },
  { value: 'BLOCK', label: '阻止处理' },
  { value: 'PASS', label: '保持原文' }
];

function maskExample(entity: PrivacyEntityType, value: string, action: PrivacyAction): string {
  if (action === 'PASS') return value;
  if (action === 'REMOVE') return '（已移除）';
  if (action === 'BLOCK') return '阻止处理';
  if (action === 'TOKENIZE') return `{{${entity}_1}}`;
  if (entity === 'PHONE') return '138****5678';
  if (entity === 'EMAIL') return 'al***@example.com';
  if (entity === 'ID_CARD') return '110101********1234';
  if (entity === 'BANK_CARD') return '6222 **** **** 0123';
  return '••••••••••••';
}

export function PrivacyDrawer({ open, privacy, onClose, onSave }: PrivacyDrawerProps) {
  const [draft, setDraft] = useState(privacy);
  const [previewEntity, setPreviewEntity] = useState<PrivacyEntityType>('PHONE');

  useEffect(() => setDraft(structuredClone(privacy)), [open, privacy]);

  const selected = useMemo(() => entities.find(entity => entity.value === previewEntity)!, [previewEntity]);

  if (!open) return null;

  const updatePolicy = (entity: PrivacyEntityType, stage: 'input' | 'toolResult' | 'output', action: PrivacyAction) => {
    setDraft(current => ({
      ...current,
      entityPolicies: {
        ...current.entityPolicies,
        [entity]: { ...current.entityPolicies[entity], [stage]: action }
      }
    }));
  };

  return (
    <div className="layer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <aside className="drawer privacy-policy-drawer" role="dialog" aria-modal="true" aria-labelledby="privacy-drawer-title">
        <header className="drawer-header">
          <div><h2 id="privacy-drawer-title">隐私与密钥</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="关闭隐私配置"><X size={18} /></button>
        </header>

        <div className="drawer-body">
          <div className="privacy-matrix" role="table" aria-label="隐私数据处理矩阵">
            <div className="privacy-matrix-row privacy-matrix-header" role="row">
              <span>数据类型</span><span>用户输入</span><span>工具返回</span><span>Agent输出</span>
            </div>
            {entities.map(entity => (
              <div className="privacy-matrix-row" role="row" key={entity.value}>
                <strong>{entity.label}{entity.mandatory ? <i>强制保护</i> : null}</strong>
                {(['input', 'toolResult', 'output'] as const).map(stage => (
                  <select
                    key={stage}
                    aria-label={`${entity.label}${stage === 'input' ? '输入处理' : stage === 'toolResult' ? '工具返回处理' : '输出处理'}`}
                    value={draft.entityPolicies[entity.value][stage]}
                    onChange={event => updatePolicy(entity.value, stage, event.target.value as PrivacyAction)}
                    disabled={entity.mandatory}
                  >
                    {actionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ))}
              </div>
            ))}
          </div>

          <section className="privacy-preview-panel">
            <div className="privacy-preview-heading">
              <strong>处理结果预览</strong>
              <select aria-label="预览数据类型" value={previewEntity} onChange={event => setPreviewEntity(event.target.value as PrivacyEntityType)}>
                {entities.map(entity => <option key={entity.value} value={entity.value}>{entity.label}</option>)}
              </select>
            </div>
            <dl>
              <div><dt>原文</dt><dd>{selected.example}</dd></div>
              <div><dt>用户输入</dt><dd>{maskExample(selected.value, selected.example, draft.entityPolicies[selected.value].input)}</dd></div>
              <div><dt>工具返回</dt><dd>{maskExample(selected.value, selected.example, draft.entityPolicies[selected.value].toolResult)}</dd></div>
              <div><dt>Agent输出</dt><dd>{maskExample(selected.value, selected.example, draft.entityPolicies[selected.value].output)}</dd></div>
            </dl>
          </section>
        </div>

        <footer className="drawer-footer">
          <button className="secondary-button" onClick={onClose}>取消</button>
          <button className="primary-button" onClick={() => onSave(draft)}><Save size={15} />保存配置</button>
        </footer>
      </aside>
    </div>
  );
}
