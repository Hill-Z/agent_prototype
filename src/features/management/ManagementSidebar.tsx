import { useState } from 'react';
import { Archive, Blocks, Bot, Boxes, BrainCircuit, ChartNoAxesCombined, ClipboardCheck, Compass, Database, FileQuestion, GalleryHorizontal, Image, Layers3, Megaphone, MemoryStick, PanelLeftClose, PackageCheck, RadioTower, Sparkles, Tags, Variable, WandSparkles, Workflow } from 'lucide-react';

export type ManagementArea =
  | 'templates' | 'apps' | 'runtime' | 'datasets' | 'memory' | 'lightMemory' | 'terms' | 'qa' | 'discovery' | 'gallery'
  | 'tools' | 'plugins' | 'workflow' | 'mcp' | 'skills' | 'cards' | 'integrations' | 'channels' | 'evaluation' | 'variables' | 'tags';
type NavItem = { label: string; icon: typeof Bot; area?: ManagementArea };
const groups: Array<{ label: string; items: NavItem[] }> = [
  { label: '智能体', items: [{ label: '模板中心', icon: GalleryHorizontal, area: 'templates' }, { label: '我的应用', icon: Layers3, area: 'apps' }, { label: '运行分析', icon: ChartNoAxesCombined, area: 'runtime' }] },
  { label: '知识管理', items: [{ label: '知识库', icon: Database, area: 'datasets' }, { label: '记忆库', icon: BrainCircuit, area: 'memory' }, { label: '轻量记忆库', icon: MemoryStick, area: 'lightMemory' }, { label: '专业词库', icon: Archive, area: 'terms' }, { label: '问答对', icon: FileQuestion, area: 'qa' }, { label: '知识发现', icon: Compass, area: 'discovery' }, { label: '图库', icon: Image, area: 'gallery' }] },
  { label: '工具技能', items: [{ label: '内置', icon: PackageCheck, area: 'tools' }, { label: '扩展', icon: Boxes, area: 'plugins' }, { label: '工作流', icon: Workflow, area: 'workflow' }, { label: 'MCP', icon: Blocks, area: 'mcp' }, { label: '技能', icon: WandSparkles, area: 'skills' }, { label: '卡片', icon: GalleryHorizontal, area: 'cards' }] },
  { label: '系统集成', items: [{ label: '第三方集成', icon: RadioTower, area: 'integrations' }, { label: '渠道发布', icon: Megaphone, area: 'channels' }] },
  { label: '运营管理', items: [{ label: '自动测评', icon: ClipboardCheck, area: 'evaluation' }, { label: '变量管理', icon: Variable, area: 'variables' }, { label: '标签管理', icon: Tags, area: 'tags' }] },
];

export function ManagementSidebar({ active, navigate }: { active: string; navigate: (area: ManagementArea) => void }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('uagent-sidebar-collapsed') === '1');
  const toggle = () => setCollapsed(value => { const next = !value; localStorage.setItem('uagent-sidebar-collapsed', next ? '1' : '0'); return next; });
  return <>
    <aside className={`management-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="管理导航">
      <div className="management-nav-scroll">{groups.map(group => <section key={group.label} aria-label={group.label}><h3>{group.label}</h3>{group.items.map(({ label, icon: Icon, area }) => <button key={label} title={collapsed ? label : undefined} aria-label={label} aria-current={label === active ? 'page' : undefined} className={label === active ? 'active' : ''} onClick={() => navigate(area!)}><Icon size={17} /><span>{label}</span></button>)}</section>)}</div>
      <button className="management-sidebar-toggle" aria-expanded={!collapsed} aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'} title={collapsed ? '展开侧边栏' : '收起侧边栏'} onClick={toggle}><PanelLeftClose size={17} /><span>{collapsed ? '展开' : '收起'}</span></button>
    </aside>
  </>;
}
