import { Channel, WebWorkerScopeCommunicator } from '@vgerbot/channel';
const channel = new Channel('', new WebWorkerScopeCommunicator());
channel.get_class<RemoteAPI>();
abstract class RemoteAPI {
    method(){}
    abstract method2();
}
