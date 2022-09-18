import { Channel, WebWorkerScopeCommunicator } from '@vgerbot/channel';
interface RemoteAPI1 {
    method1(): void;
}
interface RemoteAPI1 {
    method1x(): void;
}
interface RemoteAPI2  {
    method2(): void;
    method3(): void;
}
type RemoteAPI = RemoteAPI1 & RemoteAPI2;
const channel = new Channel('', new WebWorkerScopeCommunicator());
channel.get_class<RemoteAPI>();
