import { Channel, WebWorkerScopeCommunicator } from '@vgerbot/channel';
type RemoteAPI1 = {
    method1(): void;
};
type RemoteAPI2 =  {
    method2(): void;
    method3(): void;
};
type RemoteAPI = RemoteAPI1 & RemoteAPI2;
const channel = new Channel('', new WebWorkerScopeCommunicator());
channel.get_class<RemoteAPI>();
