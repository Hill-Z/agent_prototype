import { ListTodo, RotateCcw } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import { defaultPlannerPrompt, type AgentConfig } from '../agent/agent.types';

export function PlanningSection({ config, update }: { config: AgentConfig; update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void }) {
  const setPlanning = (patch: Partial<AgentConfig['planning']>) => update('planning', { ...config.planning, ...patch });
  return <ConfigSection title="复杂任务规划" icon={ListTodo}>
    <div className="setting-line planning-master"><strong>启用复杂任务规划</strong><Switch checked={config.planning.enabled} onChange={enabled => setPlanning({ enabled })} label="启用复杂任务规划" /></div>
    {config.planning.enabled ? <div className="planning-config">
      <div className="planning-trigger"><strong>触发方式</strong><div className="segmented-control" role="group" aria-label="规划触发方式"><button className={config.planning.triggerMode === 'auto' ? 'active' : ''} onClick={() => setPlanning({ triggerMode: 'auto' })}>自动判断</button><button className={config.planning.triggerMode === 'always' ? 'active' : ''} onClick={() => setPlanning({ triggerMode: 'always' })}>每次均规划</button></div></div>
      <div className="planner-prompt-field"><span>Planner Prompt<button type="button" onClick={() => setPlanning({ plannerPrompt: defaultPlannerPrompt })}><RotateCcw size={13} />恢复默认</button></span><textarea aria-label="Planner Prompt" value={config.planning.plannerPrompt} onChange={event => setPlanning({ plannerPrompt: event.target.value })} /></div>
    </div> : null}
  </ConfigSection>;
}
