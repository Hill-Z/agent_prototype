import { useState } from 'react';
import { Archive, Blocks, Bot, Boxes, BrainCircuit, ChartNoAxesCombined, ClipboardCheck, Compass, Database, FileQuestion, GalleryHorizontal, Image, Layers3, Megaphone, MemoryStick, PanelLeftClose, PackageCheck, RadioTower, Sparkles, Tags, Variable, WandSparkles, Workflow } from 'lucide-react';

export type ManagementArea = 'apps' | 'tools' | 'skills' | 'cards' | 'memory' | 'channels';
type NavItem = { label: string; icon: typeof Bot; area?: ManagementArea };
const groups: Array<{ label: string; items: NavItem[] }> = [
  { label: '智能体', items: [{ label: '模板广场', icon: GalleryHorizontal }, { label: '我的应用', icon: Layers3, area: 'apps' }, { label: '运行分析', icon: ChartNoAxesCombined }] },
  { label: '知识管理', items: [{ label: '知识库', icon: Database }, { label: '记忆库', icon: BrainCircuit, area: 'memory' }, { label: '轻量记忆库', icon: MemoryStick }, { label: '专业词库', icon: Archive }, { label: '问答对', icon: FileQuestion }, { label: '知识发现', icon: Compass }, { label: '图库', icon: Image }] },
  { label: '工具技能', items: [{ label: '内置', icon: PackageCheck, area: 'tools' }, { label: '扩展', icon: Boxes }, { label: '工作流', icon: Workflow }, { label: 'MCP', icon: Blocks }, { label: '技能', icon: WandSparkles, area: 'skills' }, { label: '卡片', icon: GalleryHorizontal, area: 'cards' }] },
  { label: '系统集成', items: [{ label: '第三方集成', icon: RadioTower }, { label: '渠道发布', icon: Megaphone, area: 'channels' }] },
  { label: '运营管理', items: [{ label: '自动测评', icon: ClipboardCheck }, { label: '变量管理', icon: Variable }, { label: '标签管理', icon: Tags }] },
];

export function ManagementSidebar({ active, navigate }: { active: string; navigate: (area: ManagementArea) => void }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('uagent-sidebar-collapsed') === '1');
  const [developing, setDeveloping] = useState<string | null>(null);
  const toggle = () => setCollapsed(value => { const next = !value; localStorage.setItem('uagent-sidebar-collapsed', next ? '1' : '0'); return next; });
  return <>
    <aside className={`management-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="管理导航">
      <div className="management-nav-scroll">{groups.map(group => <section key={group.label} aria-label={group.label}><h3>{group.label}</h3>{group.items.map(({ label, icon: Icon, area }) => <button key={label} title={collapsed ? label : undefined} aria-label={label} aria-current={label === active ? 'page' : undefined} className={label === active ? 'active' : ''} onClick={() => area ? navigate(area) : setDeveloping(label)}><Icon size={17} /><span>{label}</span></button>)}</section>)}</div>
      <button className="management-sidebar-toggle" aria-expanded={!collapsed} aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'} title={collapsed ? '展开侧边栏' : '收起侧边栏'} onClick={toggle}><PanelLeftClose size={17} /><span>{collapsed ? '展开' : '收起'}</span></button>
    </aside>
    {developing ? <div className="development-backdrop" role="presentation" onMouseDown={() => setDeveloping(null)}><section className="development-dialog" role="dialog" aria-modal="true" aria-labelledby="development-title" onMouseDown={event => event.stopPropagation()}><span><Sparkles size={19} /></span><h2 id="development-title">{developing}开发中</h2><p>该功能暂未接入当前原型，后续会在这里显示对应页面。</p><button className="primary-button" onClick={() => setDeveloping(null)}>知道了</button></section></div> : null}
  </>;
}
