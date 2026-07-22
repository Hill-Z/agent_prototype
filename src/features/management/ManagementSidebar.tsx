import { Archive, BrainCircuit, Boxes, ChevronLeft, Clock3, Database, FileText, Layers3, PackageCheck, WandSparkles, Workflow, Wrench } from 'lucide-react';

const managementNav = [
  ['智能体', [['模板广场', Boxes], ['我的应用', Layers3], ['运行分析', Clock3]]],
  ['知识管理', [['知识库', Database], ['记忆库', BrainCircuit], ['专业词库', Archive], ['问答对', FileText]]],
  ['工具技能', [['工具', Wrench], ['内置', PackageCheck], ['扩展', PackageCheck], ['工作流', Workflow], ['MCP', Boxes], ['技能', WandSparkles]]]
] as const;

export function ManagementSidebar({ onBack, active, onOpenSkills, onOpenTools }: { onBack: () => void; active: '技能' | '工具'; onOpenSkills: () => void; onOpenTools: () => void }) {
  return <aside className="management-sidebar"><button className="back-to-agent" onClick={onBack}><ChevronLeft size={16} />返回高级智能体</button>{managementNav.map(([group, items]) => <section key={group}><h3>{group}</h3>{items.map(([label, Icon]) => <button key={label} className={label === active ? 'active' : ''} onClick={() => { if (label === '技能') onOpenSkills(); if (label === '工具') onOpenTools(); }}><Icon size={17} />{label}</button>)}</section>)}</aside>;
}
