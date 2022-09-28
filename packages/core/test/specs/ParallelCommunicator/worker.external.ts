import { channel } from '@vgerbot/channel';
import { hex, CHANNEL_ID } from './common';

const workerChannel = channel(CHANNEL_ID)
    .connectToMainThread()
    .create();

workerChannel.def_method('bin2hex', hex);
workerChannel.def_method('get-coverage', () => {
    return __coverage__;
});
