import { MessageSquareText } from 'lucide-react';
import channelData from '../../../prototype-content/channels.mock.json';

interface ChannelCapability {
  id: string;
  name: string;
  connected: boolean;
  inbound: string[];
  outbound: string[];
}

const channels: ChannelCapability[] = channelData.channels.map(item => ({
  id: item.id,
  name: item.name,
  connected: true,
  inbound: item.inbound,
  outbound: item.outbound
}));

export function ChannelWorkspace(_props: { notify: (message: string) => void }) {
  return <div className="simple-channel-page">
    <header className="simple-channel-header"><h1>渠道能力</h1></header>
    <section className="simple-channel-table">
      <div className="simple-channel-row head"><span>渠道</span><span>接收能力</span><span>发送能力</span><span>接入状态</span></div>
      {channels.map(channel => <div className="simple-channel-row" key={channel.id}>
        <span className="simple-channel-name"><i><MessageSquareText size={16} /></i><strong>{channel.name}</strong></span>
        <CapabilityList items={channel.inbound} />
        <CapabilityList items={channel.outbound} />
        <span className={`channel-connection-status ${channel.connected ? 'connected' : ''}`}><i />{channel.connected ? '已接入' : '未接入'}</span>
      </div>)}
    </section>
  </div>;
}

function CapabilityList({ items }: { items: string[] }) {
  return <span className="channel-message-types">{items.map(type => <em key={type}>{type}</em>)}</span>;
}
