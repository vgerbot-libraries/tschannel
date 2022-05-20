import { channel } from '@vgerbot/channel';
import { CHANNEL_ID } from './common';

const storageChannel = channel(CHANNEL_ID)
    .connectViaStorage(localStorage)
    .create();

storageChannel.lmethod('hello', () => 'world');

storageChannel.lmethod('receive-buffer', (arr: Uint8Array) => {
    return arr.length === 16 && arr instanceof Uint8Array && !arr.some(it => it !== 0xf0);
});
storageChannel.lmethod('get-coverage', () => {
    return __coverage__;
});
storageChannel.lmethod('callback', <T>(data: T, callback: (data) => void) => {
    callback(data);
});
