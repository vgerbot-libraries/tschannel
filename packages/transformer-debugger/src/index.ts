import { Channel, StorageChannelCommunicator } from '@tschannel/core';
import { Remote } from './api';

const channelId = 'test-transformer';
const communicator1 = new StorageChannelCommunicator(localStorage, channelId);

const channel = new Channel(channelId, communicator1);


function run() {

    new Channel(channelId,communicator1).rclass<RemoteAPI>();

    // const RRemoteAPI = channel.rclass<RemoteAPI>();
    // const api = new RRemoteAPI();
    // api.init();

    channel.rclass<RemoteAPI2>()
    channel.rclass<RemoteAPI>()
    channel.rclass<RemoteAPI>()
    channel.rclass<Remote>()

    interface RemoteAPI2 {
        init();
    }
}



interface RemoteAPI {
    init();
}
run()
//
