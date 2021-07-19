"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tschannel_1 = require("tschannel");
const channelId = 'test-transformer';
const communicator1 = new tschannel_1.StorageChannelCommunicator(localStorage, channelId);
const channel = new tschannel_1.Channel(channelId, communicator1);
new tschannel_1.Channel(channelId, communicator1).rclass();
// const RRemoteAPI = channel.rclass<RemoteAPI>();
channel.rclass();
