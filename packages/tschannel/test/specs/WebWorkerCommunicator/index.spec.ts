import { Channel, WebWorkerCommunicator } from '@tschannel/core';
import { Animal, CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';
import { sendCoverageData } from '../../common/sendCoverageData';

describe('WebWorkerCommunicator', () => {
    const channel = new Channel(
        CHANNEL_ID,
        new WebWorkerCommunicator('/base/test/specs/WebWorkerCommunicator/worker.external.js')
    );
    it('Should rmethod work correctly', async () => {
        await expect(channel.rmethod<() => string>('hello')()).to.eventually.become('world');
    });
    it('Should create remove instance correctly', async () => {
        const RemoteDog = channel.rclass<Animal>('Dog');
        const dog = new RemoteDog('Loki');

        expect(dog.getType()).to.eventually.become('Loki');
    });
    after(async () => {
        if (typeof __coverage__ !== 'undefined') {
            const coverageData = await channel.rmethod<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }
        channel.destroy();
    });
});

