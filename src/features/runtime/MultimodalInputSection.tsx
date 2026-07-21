import { AudioLines, Image } from 'lucide-react';
import { ConfigSection } from '../../components/ConfigSection';
import { Switch } from '../../components/Switch';
import type { AgentConfig } from '../agent/agent.types';

export function MultimodalInputSection({ config, update }: {
  config: AgentConfig;
  update: <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => void;
}) {
  const setMultimodal = (patch: Partial<AgentConfig['multimodal']>) => update('multimodal', { ...config.multimodal, ...patch });
  return <ConfigSection title="多模态输入" icon={Image}>
    <div className="multimodal-setting-block">
      <div className="setting-line">
        <span className="setting-name"><Image size={16} /><strong>图片识别</strong></span>
        <Switch checked={config.multimodal.imageEnabled} onChange={imageEnabled => setMultimodal({ imageEnabled })} label="接收并识别图片" />
      </div>
    </div>
    <div className="multimodal-setting-block">
      <div className="setting-line">
        <span className="setting-name"><AudioLines size={16} /><strong>语音与音频识别</strong></span>
        <Switch checked={config.multimodal.audioEnabled} onChange={audioEnabled => setMultimodal({ audioEnabled })} label="接收并识别语音和音频" />
      </div>
      {config.multimodal.audioEnabled ? <div className="form-grid multimodal-fields">
        <label>ASR服务<select aria-label="ASR服务" value={config.multimodal.asrProvider} onChange={e => setMultimodal({ asrProvider: e.target.value })}><option>Udesk ASR</option><option>火山语音识别</option><option>阿里云智能语音</option></select></label>
        <label>识别语言<select aria-label="识别语言" value={config.multimodal.language} onChange={e => setMultimodal({ language: e.target.value })}><option>自动识别</option><option>中文</option><option>英文</option></select></label>
      </div> : null}
    </div>
  </ConfigSection>;
}
