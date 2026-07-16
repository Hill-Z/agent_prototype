import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ConfigSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ConfigSection({ title, icon: Icon, children, actions, className = '' }: ConfigSectionProps) {
  return (
    <section className={`config-section ${className}`.trim()}>
      <header className="config-section-header">
        <div className="config-section-title">
          <Icon size={17} strokeWidth={1.8} />
          <h2>{title}</h2>
        </div>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

