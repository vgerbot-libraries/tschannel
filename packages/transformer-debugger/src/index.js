import { Channel, StorageChannelCommunicator } from '@tschannel/core';
var channelId = 'test-transformer';
var communicator1 = new StorageChannelCommunicator(localStorage, channelId);
var channel = new Channel(channelId, communicator1);
function run() {
    new Channel(channelId, communicator1).rclass("RemoteAPI", RemoteAPIImpl_1);
    // const RRemoteAPI = channel.rclass<RemoteAPI>();
    // const api = new RRemoteAPI();
    // api.init();
    channel.rclass("RemoteAPI2", RemoteAPI2Impl_1);
    channel.rclass("RemoteAPI", RemoteAPIImpl_1);
    channel.rclass("RemoteAPI", RemoteAPIImpl_1);
    channel.rclass("Remote", RemoteImpl_1);
}
run();
var default_1 = /** @class */ (function () {
    function default_1() {
    }
    default_1.prototype.init = function () { };
    return default_1;
}());
var default_2 = /** @class */ (function () {
    function default_2() {
    }
    default_2.prototype.init = function () { };
    return default_2;
}());
var default_3 = /** @class */ (function () {
    function default_3() {
    }
    default_3.prototype.method = function () { };
    default_3.prototype.method2 = function () { };
    return default_3;
}());
