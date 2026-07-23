import { MessagesSquare } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import type { AgentConfig } from '../agent/agent.types';

export function ConversationBehaviorSection({ config, update }: {
  config: AgentConfig;
  update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void;
}) {
  const behavior = config.conversationBehavior;
  const set = (patch: Partial<AgentConfig['conversationBehavior']>) => update('conversationBehavior', { ...behavior, ...patch });
  return <ConfigSection title="对话管理" icon={MessagesSquare}>
    <div className="setting-line"><strong>连续消息合并</strong><Switch checked={behavior.mergeConsecutiveMessagesEnabled} onChange={mergeConsecutiveMessagesEnabled => set({ mergeConsecutiveMessagesEnabled })} label="连续消息合并" /></div>
    {behavior.mergeConsecutiveMessagesEnabled ? <div className="conversation-input-config">
      <label>输入结束判断<select aria-label="输入结束判断" value={behavior.inputCompletionMode} onChange={event => set({ inputCompletionMode: event.target.value as AgentConfig['conversationBehavior']['inputCompletionMode'] })}><option value="delay">固定等待</option><option value="typing">渠道输入状态</option><option value="custom">定制策略</option></select></label>
      {behavior.inputCompletionMode === 'custom' ? <label>判断策略<select aria-label="输入结束判断策略" value={behavior.customCompletionStrategy} onChange={event => set({ customCompletionStrategy: event.target.value })}><option value="">请选择</option><option value="customer-service-completion">客服输入完成判断</option></select></label> : <label>{behavior.inputCompletionMode === 'typing' ? '状态缺失等待' : '等待时间'}<input aria-label="输入等待时间" type="number" min={1} max={30} value={behavior.inputWaitSeconds} onChange={event => set({ inputWaitSeconds: Number(event.target.value) })} /><span>秒</span></label>}
      <label>最长等待<input aria-label="输入最长等待时间" type="number" min={5} max={60} value={behavior.maxWaitSeconds} onChange={event => set({ maxWaitSeconds: Number(event.target.value) })} /><span>秒</span></label>
    </div> : null}
    <div className="conversation-runtime-policies"><div><span>正式结果发送前收到新消息</span><strong>合并消息并重新执行</strong></div><div><span>正式结果发送后收到新消息</span><strong>继续当前回复，进入下一轮队列</strong></div></div>
  </ConfigSection>;
}
