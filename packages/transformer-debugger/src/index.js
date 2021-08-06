"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@tschannel/core");
const channelId = 'test-transformer';
const communicator1 = new core_1.StorageChannelCommunicator(localStorage, channelId);
const channel = new core_1.Channel(channelId, communicator1);
function run() {
    new core_1.Channel(channelId, communicator1).rclass("RemoteAPI", RemoteAPIImpl_1);
    // const RRemoteAPI = channel.rclass<RemoteAPI>();
    // const api = new RRemoteAPI();
    // api.init();
    channel.rclass("RemoteAPI2", RemoteAPI2Impl_1);
    channel.rclass("RemoteAPI", RemoteAPIImpl_1);
    channel.rclass("RemoteAPI", RemoteAPIImpl_1);
    channel.rclass("Remote", RemoteImpl_1);
}
run();
class RemoteAPIImpl_1 {
    init() { }
}
class RemoteAPI2Impl_1 {
    init() { }
}
class RemoteImpl_1 {
    method() { }
    method2() { }
}
