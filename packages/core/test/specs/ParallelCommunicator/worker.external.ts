import { channel } from '@vgerbot/channel';
import { hex, CHANNEL_ID } from './common';

const workerChannel = channel(CHANNEL_ID)
    .connectToMainThread()
    .create();

workerChannel.lmethod('bin2hex', hex);
workerChannel.lmethod('get-coverage', () => {
    return __coverage__;
});
