import { Channel, WebWorkerScopeCommunicator } from 'tschannel';
import { hex, CHANNEL_ID } from './common';

const channel = new Channel(CHANNEL_ID, new WebWorkerScopeCommunicator());

channel.lmethod('bin2hex', hex);
channel.lmethod('get-coverage', () => {
    return __coverage__;
});
