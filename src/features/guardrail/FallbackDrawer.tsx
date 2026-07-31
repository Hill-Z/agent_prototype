import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { GuardrailConfig } from './guardrail.types';

interface FallbackDrawerProps {
  open: boolean;
  value: GuardrailConfig['fallbackReplies'];
  onClose: () => void;
  onSave: (value: GuardrailConfig['fallbackReplies']) => void;
}

const fields: Array<[keyof GuardrailConfig['fallbackReplies'], string]> = [
  ['contentBlocked', '内容无法处理'],
  ['privacyHandled', '隐私信息已处理'],
  ['detectorUnavailable', '检测服务异常'],
  ['handoff', '需要转人工'],
  ['rewriteFailed', '安全改写失败']
];

export function FallbackDrawer({ open, value, onClose, onSave }: FallbackDrawerProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(structuredClone(value)), [open, value]);
  if (!open) return null;

  return <div className="layer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="fallback-drawer-title">
      <header className="drawer-header"><h2 id="fallback-drawer-title">兜底话术</h2><button className="icon-button" onClick={onClose} aria-label="关闭兜底话术"><X size={18} /></button></header>
      <div className="drawer-body fallback-fields">
        {fields.map(([key, label]) => <label key={key}>{label}<textarea value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} /></label>)}
      </div>
      <footer className="drawer-footer"><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => onSave(draft)}><Save size={15} />保存配置</button></footer>
    </aside>
  </div>;
}
