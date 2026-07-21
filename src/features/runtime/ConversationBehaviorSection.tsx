import { MessagesSquare } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import type { AgentConfig } from '../agent/agent.types';

export function ConversationBehaviorSection({ config, update }: {
  config: AgentConfig;
  update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void;
}) {
  const set = (patch: Partial<AgentConfig['conversationBehavior']>) => update('conversationBehavior', { ...config.conversationBehavior, ...patch });
  return <ConfigSection title="对话管理" icon={MessagesSquare}>
    <div className="conversation-policy-row"><div><strong>用户补充消息时重新规划</strong><p>停止当前未完成回复，将新消息加入本轮上下文后重新执行。</p></div><Switch checked={config.conversationBehavior.replanOnNewMessage} onChange={replanOnNewMessage => set({ replanOnNewMessage })} label="用户补充消息时重新规划" /></div>
    <div className="conversation-policy-row"><div><strong>用户插话时停止后续消息</strong><p>已发送消息保留，尚未发送的分段立即取消。</p></div><Switch checked={config.conversationBehavior.stopPendingMessages} onChange={stopPendingMessages => set({ stopPendingMessages })} label="用户插话时停止后续消息" /></div>
  </ConfigSection>;
}
