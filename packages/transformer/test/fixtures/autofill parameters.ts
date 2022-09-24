import { Channel, WebWorkerScopeCommunicator } from '@vgerbot/channel';
const channel = new Channel('', new WebWorkerScopeCommunicator());
interface RemoteAPI {
    method();
}
channel.get_class<RemoteAPI>();
