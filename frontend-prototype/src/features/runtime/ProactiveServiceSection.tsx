import { BellRing, FlaskConical } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import type { AgentConfig } from '../agent/agent.types';

const emitMockEvent = (eventName: string) => window.dispatchEvent(new CustomEvent('uagent:mock-proactive', { detail: { eventName } }));

export function ProactiveServiceSection({ config, update }: {
  config: AgentConfig;
  update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void;
}) {
  const set = (patch: Partial<AgentConfig['proactiveService']>) => update('proactiveService', { ...config.proactiveService, ...patch });
  const service = config.proactiveService;
  return <ConfigSection title="主动服务" icon={BellRing}>
    <div className="conversation-policy-row"><div><strong>长任务等待提醒</strong><p>任务持续较久且尚未回复时，只发送一次自然等待消息。</p></div><Switch checked={service.longTaskNoticeEnabled} onChange={longTaskNoticeEnabled => set({ longTaskNoticeEnabled })} label="长任务等待提醒" /></div>
    {service.longTaskNoticeEnabled ? <div className="compact-number-field proactive-threshold"><label>触发时间<input aria-label="长任务提醒触发时间" type="number" min={5} max={60} value={service.longTaskThresholdSeconds} onChange={event => set({ longTaskThresholdSeconds: Number(event.target.value) })} /><span>秒</span></label></div> : null}
    <div className="conversation-policy-row"><div><strong>异步任务完成通知</strong><p>仅由已配置的业务事件触发，不允许模型自由发起。</p></div><Switch checked={service.asyncCompletionEnabled} onChange={asyncCompletionEnabled => set({ asyncCompletionEnabled })} label="异步任务完成通知" /></div>
    <div className="conversation-policy-row"><div><strong>活跃对话期间不发送主动消息</strong><p>客户或Agent正在对话时，普通主动通知进入待发送队列。</p></div><Switch checked={service.suppressDuringActiveConversation} onChange={suppressDuringActiveConversation => set({ suppressDuringActiveConversation })} label="活跃对话期间不发送主动消息" /></div>
    <div className="proactive-rule-list">
      <div><span><i className="rule-status-dot active" /><strong>报表生成完成</strong><small>report.generated</small></span><button disabled={!service.asyncCompletionEnabled} onClick={() => emitMockEvent('report.generated')}><FlaskConical size={13} />测试</button></div>
      <div><span><i className="rule-status-dot" /><strong>退款到账通知</strong><small>refund.completed</small></span><button disabled={!service.asyncCompletionEnabled} onClick={() => emitMockEvent('refund.completed')}><FlaskConical size={13} />测试</button></div>
    </div>
  </ConfigSection>;
}
