import { Channel, StorageChannelCommunicator } from '../../../src';
import { CHANNEL_ID } from './common';

describe('StorageChannelCommunicator', () => {
    let channel: Channel;
    let iframe: HTMLIFrameElement;
    before(async () => {
        localStorage.clear();
        const url = location.origin + '/base/test/specs/StorageChannelCommunicator/iframe.external.html';
        iframe = document.createElement('iframe');
        const promise = new Promise((resolve, reject) => {
            iframe.onload = resolve;
            iframe.onerror = reject;
        });
        iframe.src = url;
        document.body.appendChild(iframe);
        await promise;
        channel = new Channel(CHANNEL_ID, new StorageChannelCommunicator(localStorage, CHANNEL_ID));
    });
    after(() => {
        document.body.removeChild(iframe);
        channel.destroy();
        expect(localStorage.length).to.be.eql(0);
    });

    it('Should rmethod work correctly', async () => {
        await expect(channel.rmethod<() => string>('hello')()).to.be.eventually.become('world');
    });

    it('Should buffer data be transmitted correctly', async () => {
        const u8ia = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            u8ia[i] = 0xf0;
        }
        await expect(channel.rmethod('receive-buffer')(u8ia)).to.be.eventually.become(true);
    });
});
