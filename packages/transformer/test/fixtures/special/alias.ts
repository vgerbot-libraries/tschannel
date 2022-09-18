import { Channel as ChannelAlias } from '@vgerbot/channel';
const channel = new ChannelAlias();
channel.get_class<RemoteAPI>();
interface RemoteAPI {
    method(): void;
}
