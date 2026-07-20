import { BellRing } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import type { AgentConfig } from '../agent/agent.types';

export function ProactiveServiceSection({ config, update }: {
  config: AgentConfig;
  update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void;
}) {
  const set = (patch: Partial<AgentConfig['proactiveService']>) => update('proactiveService', { ...config.proactiveService, ...patch });
  const service = config.proactiveService;
  return <ConfigSection title="主动服务" icon={BellRing}>
    <div className="conversation-policy-row"><div><strong>长任务等待提醒</strong><p>任务持续较久且尚未回复时，只发送一次自然等待消息。</p></div><Switch checked={service.longTaskNoticeEnabled} onChange={longTaskNoticeEnabled => set({ longTaskNoticeEnabled })} label="长任务等待提醒" /></div>
    {service.longTaskNoticeEnabled ? <div className="proactive-wait-config"><label>触发时间<span><input aria-label="长任务提醒触发时间" type="number" min={5} max={60} value={service.longTaskThresholdSeconds} onChange={event => set({ longTaskThresholdSeconds: Number(event.target.value) })} />秒</span></label><label>等待话术<textarea aria-label="长任务等待话术" maxLength={100} value={service.longTaskNoticeMessage} onChange={event => set({ longTaskNoticeMessage: event.target.value })} /></label></div> : null}
    <div className="conversation-policy-row"><div><strong>异步任务完成通知</strong><p>仅由已配置的业务事件触发，不允许模型自由发起。</p></div><Switch checked={service.asyncCompletionEnabled} onChange={asyncCompletionEnabled => set({ asyncCompletionEnabled })} label="异步任务完成通知" /></div>
  </ConfigSection>;
}
