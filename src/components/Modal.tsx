import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, description, children, onClose, footer, wide = false }: { title: string; description?: string; children: ReactNode; onClose: () => void; footer?: ReactNode; wide?: boolean }) {
  return <div className="layer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`product-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="drawer-header"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div><button className="icon-button" onClick={onClose} aria-label={`关闭${title}`}><X size={18} /></button></header>
      <div className="drawer-body">{children}</div>
      {footer ? <footer className="drawer-footer">{footer}</footer> : null}
    </section>
  </div>;
}
