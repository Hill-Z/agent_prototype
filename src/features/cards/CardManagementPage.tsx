import { ManagementSidebar } from '../management/ManagementSidebar';

/** Isolate the existing card editor's styles while keeping it on the same service/origin. */
export function CardManagementPage({ onOpenApps, onOpenSkills, onOpenTools }: {
  onOpenApps: () => void;
  onOpenSkills: () => void;
  onOpenTools: () => void;
}) {
  return <div className="management-body cards-body">
    <ManagementSidebar active="卡片" onOpenApps={onOpenApps} onOpenSkills={onOpenSkills} onOpenTools={onOpenTools} onOpenCards={() => undefined} />
    <main className="cards-main" aria-label="卡片管理">
      <iframe className="cards-frame" title="卡片模板管理" src="/cards/index.html" />
    </main>
  </div>;
}
