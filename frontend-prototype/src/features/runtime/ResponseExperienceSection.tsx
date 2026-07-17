import { MessageCircleMore } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import type { AgentConfig } from '../agent/agent.types';

export function ResponseExperienceSection({ config, update }: { config: AgentConfig; update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void }) {
  const set = (patch: Partial<AgentConfig['responseExperience']>) => update('responseExperience', { ...config.responseExperience, ...patch });
  const experience = config.responseExperience;
  return <ConfigSection title="回复体验" icon={MessageCircleMore}>
    <div className="setting-line response-experience-master"><div><strong>模拟真人回复节奏</strong><p>用于正式客户 IM；调试视图仍展示完整执行过程。</p></div><Switch checked={experience.humanizedTimingEnabled} onChange={humanizedTimingEnabled => set({ humanizedTimingEnabled })} label="模拟真人回复节奏" /></div>
    {experience.humanizedTimingEnabled ? <div className="response-experience-body">
      <div className="experience-contract"><span>整条发送</span><span>原生输入状态</span><span>不展示内部过程</span></div>
      <div className="form-grid three">
        <label>输入状态节奏<select value={experience.typingStyle} onChange={event => set({ typingStyle: event.target.value as 'natural' | 'continuous' })}><option value="natural">自然停顿</option><option value="continuous">持续显示</option></select></label>
        <label>首次出现延迟<input type="number" min={0} max={3000} step={100} value={experience.initialDelayMs} onChange={event => set({ initialDelayMs: Number(event.target.value) })} /><small>毫秒，避免短回复闪烁</small></label>
        <label>最短展示时间<input type="number" min={300} max={5000} step={100} value={experience.minTypingMs} onChange={event => set({ minTypingMs: Number(event.target.value) })} /><small>毫秒，保证状态可感知</small></label>
      </div>
      <p className="scope-note">不包含消息分段、长任务安抚话术和用户插话处理，这三项需要独立配置与运行策略。</p>
    </div> : <div className="info-box">关闭后，客户测试视图使用平台默认的流式回复效果。</div>}
  </ConfigSection>;
}
