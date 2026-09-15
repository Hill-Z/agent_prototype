import { Archive, BrainCircuit, Boxes, ChevronLeft, Clock3, Database, FileText, Layers3, PackageCheck, WandSparkles, Workflow, LayoutGrid } from 'lucide-react';

const managementNav = [
  ['智能体', [['模板广场', Boxes], ['我的应用', Layers3], ['运行分析', Clock3]]],
  ['知识管理', [['知识库', Database], ['记忆库', BrainCircuit], ['专业词库', Archive], ['问答对', FileText]]],
  ['工具技能', [['内置', PackageCheck], ['扩展', PackageCheck], ['工作流', Workflow], ['MCP', Boxes], ['技能', WandSparkles], ['卡片', LayoutGrid]]]
] as const;

export function ManagementSidebar({ onBack, active, onOpenSkills, onOpenTools, onOpenCards }: { onBack: () => void; active: '技能' | '工具' | '卡片'; onOpenSkills: () => void; onOpenTools: () => void; onOpenCards: () => void }) {
  return <aside className="management-sidebar" aria-label="管理导航"><button className="back-to-agent" onClick={onBack}><ChevronLeft size={16} />返回高级智能体</button>{managementNav.map(([group, items]) => <section key={group}><h3>{group}</h3>{items.map(([label, Icon]) => <button key={label} aria-current={label === active || (active === '工具' && label === '内置') ? 'page' : undefined} className={label === active || (active === '工具' && label === '内置') ? 'active' : ''} onClick={() => { if (label === '技能') onOpenSkills(); if (label === '内置' || label === '扩展') onOpenTools(); if (label === '卡片') onOpenCards(); }}><Icon size={17} />{label}</button>)}</section>)}</aside>;
}
