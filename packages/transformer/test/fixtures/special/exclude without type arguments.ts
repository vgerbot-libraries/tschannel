import { Channel, WebWorkerScopeCommunicator } from '@vgerbot/channel';

const channel = new Channel('', new WebWorkerScopeCommunicator());

channel.get_class('RemoteAPI', class RemoteAPI {
    method(){}
});
