import { Channel, StorageChannelCommunicator } from 'tschannel';

const channelId = 'test-transformer';
const communicator1 = new StorageChannelCommunicator(localStorage, channelId);

const channel = new Channel(channelId, communicator1);


const RRemoteAPI = channel.rclass<RemoteAPI>();
// const api = new RRemoteAPI();
// api.init();

interface RemoteAPI {
    init();
}
