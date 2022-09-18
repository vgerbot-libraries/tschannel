import { channel } from '@vgerbot/channel';
let channelBuilder = channel("channel-id");
let generator = channelBuilder.connectToMainThread();
const c = generator.create();

interface RemoteAPI {
    method();
}

c.get_class<RemoteAPI>();
