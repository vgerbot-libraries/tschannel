import { RMI, StorageChannelCommunicator } from '../../../src';
import { RMI_ID } from './common';

const rmi = new RMI(RMI_ID, new StorageChannelCommunicator(localStorage, RMI_ID));

rmi.lmethod('hello', () => 'world');

rmi.lmethod('receive-buffer', (arr: Uint8Array) => {
    return arr.length === 16 && arr instanceof Uint8Array && !arr.some(it => it !== 0xf0);
});
