import { MessageCircleMore } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import type { AgentConfig } from '../agent/agent.types';

export function ResponseExperienceSection({ config, update }: { config: AgentConfig; update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void }) {
  const set = (patch: Partial<AgentConfig['responseExperience']>) => update('responseExperience', { ...config.responseExperience, ...patch });
  const experience = config.responseExperience;
  return <ConfigSection title="回复体验" icon={MessageCircleMore}>
    <div className="setting-line response-experience-master"><strong>模拟真人回复节奏</strong><Switch checked={experience.humanizedTimingEnabled} onChange={humanizedTimingEnabled => set({ humanizedTimingEnabled })} label="模拟真人回复节奏" /></div>
    {experience.humanizedTimingEnabled ? <div className="response-experience-body">
      <div className="form-grid three">
        <label>输入状态节奏<select value={experience.typingStyle} onChange={event => set({ typingStyle: event.target.value as 'natural' | 'continuous' })}><option value="natural">自然停顿</option><option value="continuous">持续显示</option></select></label>
        <label>首次出现延迟<input type="number" min={0} max={3000} step={100} value={experience.initialDelayMs} onChange={event => set({ initialDelayMs: Number(event.target.value) })} /></label>
        <label>最短展示时间<input type="number" min={300} max={5000} step={100} value={experience.minTypingMs} onChange={event => set({ minTypingMs: Number(event.target.value) })} /></label>
      </div>
    </div> : null}
    <div className="response-experience-body">
      <div className="setting-line"><strong>多条消息回复</strong><Switch checked={experience.splitLongRepliesEnabled} onChange={splitLongRepliesEnabled => set({ splitLongRepliesEnabled })} label="多条消息回复" /></div>
      {experience.splitLongRepliesEnabled ? <div className="multi-message-config"><div className="fixed-policy-value"><span>输出方式</span><strong>完整生成后分段发送</strong></div><label>最多发送消息数<input aria-label="最多发送消息数" type="number" min={2} max={5} value={experience.maxReplyMessages} onChange={event => set({ maxReplyMessages: Number(event.target.value) })} /></label><label>消息发送间隔<input aria-label="消息发送间隔" type="number" min={0} max={5000} step={100} value={experience.messageIntervalMs} onChange={event => set({ messageIntervalMs: Number(event.target.value) })} /><span>毫秒</span></label></div> : null}
    </div>
  </ConfigSection>;
}
