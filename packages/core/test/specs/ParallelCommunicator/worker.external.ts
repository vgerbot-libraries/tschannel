import { channel } from '@tschannel/core';
import { hex, CHANNEL_ID } from './common';

const workerChannel = channel(CHANNEL_ID)
    .connectToMainThread()
    .create();

workerChannel.lmethod('bin2hex', hex);
workerChannel.lmethod('get-coverage', () => {
    return __coverage__;
});
