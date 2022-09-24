import { Channel, WebWorkerScopeCommunicator } from '@vgerbot/channel';
type RemoteAPI = {
    method();
};
const channel = new Channel('', new WebWorkerScopeCommunicator());
channel.get_class<RemoteAPI>();
