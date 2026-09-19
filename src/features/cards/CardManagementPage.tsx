import { ManagementSidebar, type ManagementArea } from '../management/ManagementSidebar';

/** Isolate the existing card editor's styles while keeping it on the same service/origin. */
export function CardManagementPage({ navigate }: { navigate: (area: ManagementArea) => void }) {
  return <div className="management-body cards-body">
    <ManagementSidebar active="卡片" navigate={navigate} />
    <main className="cards-main" aria-label="卡片管理">
      <iframe className="cards-frame" title="卡片模板管理" src="/cards/index.html?v=20260917-1" />
    </main>
  </div>;
}
