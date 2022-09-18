import { Channel, WebWorkerScopeCommunicator } from '@vgerbot/channel';
const channel = new Channel('', new WebWorkerScopeCommunicator());
channel.get_class<RemoteAPI>();
channel.get_class<RemoteAPI>();
abstract class RemoteAPI {
    method() {};
    abstract method2();
}
function scope_a() {
    channel.get_class<RemoteAPI>();
    channel.get_class<RemoteAPI>();
    interface RemoteAPI {
        method();
    }
    function scope_inner_a() {
        channel.get_class<InnerRemoteAPI>();
        channel.get_class<RemoteAPI>();
        interface InnerRemoteAPI {
            method();
        }
    }
}
