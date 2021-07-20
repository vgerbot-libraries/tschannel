"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tschannel_1 = require("tschannel");
const channelId = 'test-transformer';
const communicator1 = new tschannel_1.StorageChannelCommunicator(localStorage, channelId);
const channel = new tschannel_1.Channel(channelId, communicator1);
function run() {
    new tschannel_1.Channel(channelId, communicator1).rclass(class RemoteAPI_1 {
    });
    // const RRemoteAPI = channel.rclass<RemoteAPI>();
    // const api = new RRemoteAPI();
    // api.init();
    channel.rclass(class RemoteAPI2_1 {
    });
    channel.rclass(class Remote_1 {
    });
}
run();
