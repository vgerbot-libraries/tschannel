import { channel, Channel } from '@tschannel/core';
import { sendCoverageData } from '../../common/sendCoverageData';
import { CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';

describe('StorageChannelCommunicator', function() {
    this.timeout(1000 * 20000);
    let storageChannel: Channel;
    let iframe: HTMLIFrameElement;
    beforeEach(async () => {
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
        storageChannel = channel(CHANNEL_ID).connectViaStorage(localStorage).create();
    });

    it('Should rmethod work correctly', async () => {
        await expect(storageChannel.rmethod<() => string>('hello')()).to.be.eventually.become('world');
    });

    it('Should buffer data be transmitted correctly', async () => {
        const u8ia = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            u8ia[i] = 0xf0;
        }
        await expect(storageChannel.rmethod('receive-buffer')(u8ia)).to.be.eventually.become(true);
    });
    it('should handle callbacks correctly', async () => {
        const mockData = 'hello world';
        type DataType = typeof mockData;
        const method = storageChannel.rmethod('callback') as (
            data: DataType,
            callback: (data: DataType) => void
        ) => Promise<void>;
        const spyCallback = sinon.spy();

        await expect(method(mockData, spyCallback)).to.be.eventually.fulfilled;
        expect(spyCallback).to.be.calledOnceWith(mockData);
    });
    it('Should be destroyed correctly', async () => {
        const mockData = 'hello world';
        type DataType = typeof mockData;
        const method = storageChannel.rmethod('callback') as (
            data: DataType,
            callback: (data: DataType) => void
        ) => Promise<void>;
        const spyCallback = sinon.spy();

        await expect(method(mockData, spyCallback)).to.be.eventually.fulfilled;
        expect(spyCallback).to.be.calledOnceWith(mockData);

        if (typeof __coverage__ !== 'undefined' && !storageChannel.isDestroyed) {
            const coverageData = await storageChannel.rmethod<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }

        storageChannel.destroy();
        expect(() => {
            method(mockData, sinon.spy());
        }).to.throws('The message channel has been destroyed!');
    });

    afterEach(async () => {
        if (typeof __coverage__ !== 'undefined' && !storageChannel.isDestroyed) {
            const coverageData = await storageChannel.rmethod<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }
        document.body.removeChild(iframe);
        storageChannel.destroy();
        expect(localStorage.length).to.be.eql(0);
    });
});
