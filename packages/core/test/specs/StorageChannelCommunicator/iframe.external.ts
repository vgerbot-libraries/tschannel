import { channel } from '@vgerbot/channel';
import { CHANNEL_ID } from './common';

const storageChannel = channel(CHANNEL_ID).connectViaStorage(localStorage).create();

storageChannel.def_method('hello', () => 'world');

storageChannel.def_method('receive-buffer', (arr: Uint8Array) => {
    return arr.length === 16 && arr instanceof Uint8Array && !arr.some(it => it !== 0xf0);
});
storageChannel.def_method('get-coverage', () => {
    return __coverage__;
});
storageChannel.def_method('callback', <T>(data: T, callback: (data) => void) => {
    callback(data);
});
