import { Channel, StorageChannelCommunicator } from '../../../src';
import { sendCoverageData } from '../../common/sendCoverageData';
import { CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';

describe('StorageChannelCommunicator', function() {
    this.timeout(1000 * 20000);
    let channel: Channel;
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
        channel = new Channel(CHANNEL_ID, new StorageChannelCommunicator(localStorage, CHANNEL_ID));
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
    it('should handle callbacks correctly', async () => {
        const mockData = 'hello world';
        type DataType = typeof mockData;
        const method = channel.rmethod('callback') as (
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
        const method = channel.rmethod('callback') as (
            data: DataType,
            callback: (data: DataType) => void
        ) => Promise<void>;
        const spyCallback = sinon.spy();

        await expect(method(mockData, spyCallback)).to.be.eventually.fulfilled;
        expect(spyCallback).to.be.calledOnceWith(mockData);

        if (typeof __coverage__ !== 'undefined' && !channel.isDestroyed) {
            const coverageData = await channel.rmethod<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }

        channel.destroy();
        expect(() => {
            method(mockData, sinon.spy());
        }).to.throws('Cannot invoke methods after the message channel is destroyed!');
    });

    afterEach(async () => {
        if (typeof __coverage__ !== 'undefined' && !channel.isDestroyed) {
            const coverageData = await channel.rmethod<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }
        document.body.removeChild(iframe);
        channel.destroy();
        expect(localStorage.length).to.be.eql(0);
    });
});
