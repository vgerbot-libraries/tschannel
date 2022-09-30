import { channel } from '@vgerbot/channel';
let channelBuilder = channel("channel-id");
let generator = channelBuilder.connectToMainThread();
const c = generator.create();

interface RemoteAPI {
    method();
}

class AA {}

class RemoteAPIImpl extends AA implements RemoteAPI {
    method() {}
}

c.def_class(RemoteAPIImpl);

// ↑ same as ↓

c.def_class('AA', RemoteAPIImpl)
