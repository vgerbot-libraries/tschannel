import { channel, Channel } from '@tschannel/core';
import { Animal, CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';
import { sendCoverageData } from '../../common/sendCoverageData';

describe('WindowsChannelCommunicator', () => {
    let windowChannel: Channel;
    let iframe: HTMLIFrameElement;

    before(async () => {
        const url = location.origin + '/base/test/specs/WindowChannelCommunicator/iframe.external.html';

        iframe = document.createElement('iframe');
        const promise = new Promise(resolve => {
            iframe.onload = resolve;
        });
        iframe.src = url;
        document.body.appendChild(iframe);
        await promise;
        windowChannel = channel(CHANNEL_ID)
            .connectTo(iframe.contentWindow as Window)
            .origin(location.origin)
            .create();
    });

    it('Should rmethod work correctly', async () => {
        await expect(windowChannel.rmethod<() => string>('hello')()).to.eventually.become('world');
    });
    it('Should create remote instance correctly', async () => {
        const RemoteDog = windowChannel.rclass<Animal>('Dog');
        const dog = new RemoteDog('Loki');

        expect(dog.getType()).to.eventually.become('Loki');
    });

    after(async () => {
        if (typeof __coverage__ !== 'undefined') {
            const coverageData = await windowChannel.rmethod<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }
        document.body.removeChild(iframe);
    });
});
