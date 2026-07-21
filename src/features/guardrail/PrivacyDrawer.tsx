import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { GuardrailStage, PrivacyConfig } from './guardrail.types';

interface PrivacyDrawerProps {
  open: boolean;
  stage: GuardrailStage;
  privacy: PrivacyConfig;
  onClose: () => void;
  onSave: (privacy: PrivacyConfig) => void;
}

const entities = [
  ['PHONE', '手机号', false],
  ['ID_CARD', '身份证', false],
  ['BANK_CARD', '银行卡', false],
  ['EMAIL', '邮箱', false],
  ['API_KEY', 'API Key（强制）', true],
  ['ACCESS_TOKEN', 'Access Token（强制）', true]
] as const;

export function PrivacyDrawer({ open, stage, privacy, onClose, onSave }: PrivacyDrawerProps) {
  const [draft, setDraft] = useState(privacy);

  useEffect(() => setDraft(structuredClone(privacy)), [open, privacy]);

  if (!open) return null;

  const toggleEntity = (entity: string) => {
    setDraft(current => ({
      ...current,
      entityTypes: current.entityTypes.includes(entity)
        ? current.entityTypes.filter(item => item !== entity)
        : [...current.entityTypes, entity]
    }));
  };

  return (
    <div className="layer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="privacy-drawer-title">
        <header className="drawer-header">
          <div><h2 id="privacy-drawer-title">配置隐私与密钥</h2><p>{stage === 'INPUT' ? '输入护栏' : '输出护栏'}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="关闭隐私配置"><X size={18} /></button>
        </header>

        <div className="drawer-body">
          <div className="form-section">
            <span className="field-label">识别的数据类型</span>
            <div className="check-grid">
              {entities.map(([value, label, mandatory]) => (
                <label className="check-option" key={value}>
                  <input type="checkbox" checked={draft.entityTypes.includes(value)} disabled={mandatory} onChange={() => toggleEntity(value)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {stage === 'INPUT' ? (
            <>
              <div className="form-section">
                <label>发送给模型前
                  <select value={draft.modelInputAction} onChange={event => setDraft({ ...draft, modelInputAction: event.target.value as PrivacyConfig['modelInputAction'] })}>
                    <option value="TOKENIZE">Token 化：{'{{PHONE_1}}'}</option><option value="MASK">部分脱敏：138****8000</option><option value="BLOCK">阻断请求</option>
                  </select>
                </label>
                <p className="form-help">密钥类数据始终阻断，不允许原样发送给模型。</p>
              </div>
              <div className="form-section">
                <span className="field-label">允许恢复原值的工具</span>
                <div className="check-grid">
                  {[['customer-query', '客户查询'], ['order-query', '订单查询'], ['sms-send', '发送短信'], ['customer-update', '修改客户']].map(([value, label]) => (
                    <label className="check-option" key={value}>
                      <input type="checkbox" checked={draft.allowedToolIds.includes(value)} onChange={() => setDraft(current => ({ ...current, allowedToolIds: current.allowedToolIds.includes(value) ? current.allowedToolIds.filter(item => item !== value) : [...current.allowedToolIds, value] }))} />{label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="form-section">
              <label>回复用户时
                <select value={draft.outputAction} onChange={event => setDraft({ ...draft, outputAction: event.target.value as PrivacyConfig['outputAction'] })}>
                  <option value="MASK">部分脱敏</option><option value="BLOCK">阻断输出</option><option value="PASS">按权限原样输出</option>
                </select>
              </label>
              <p className="form-help">输出动作只影响发送给用户的内容，不改变 Tool 参数和模型输入。</p>
            </div>
          )}

          <div className="form-section two-column-form">
            <label>Memory
              <select value={draft.memoryAction} onChange={event => setDraft({ ...draft, memoryAction: event.target.value as PrivacyConfig['memoryAction'] })}>
                <option value="DROP">禁止保存原值</option><option value="MASK">脱敏后保存</option>
              </select>
            </label>
            <label>Trace 与日志
              <select value={draft.logAction} onChange={event => setDraft({ ...draft, logAction: event.target.value as PrivacyConfig['logAction'] })}>
                <option value="MASK">部分脱敏</option><option value="TYPE_ONLY">仅记录命中类型</option>
              </select>
            </label>
          </div>
        </div>

        <footer className="drawer-footer">
          <button className="secondary-button" onClick={onClose}>取消</button>
          <button className="primary-button" onClick={() => onSave(draft)}><Save size={15} />保存配置</button>
        </footer>
      </aside>
    </div>
  );
}

