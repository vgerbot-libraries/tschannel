import { Channel as ChannelAlias, WebWorkerScopeCommunicator } from '@vgerbot/channel';

const channel = new ChannelAlias('', new WebWorkerScopeCommunicator());

channel.get_class<RemoteAPI>('RemoteAPI1', class {
    method(){}
});

interface RemoteAPI {
    method(): void
}
