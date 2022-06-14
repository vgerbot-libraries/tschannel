import { Channel, WebWorkerCommunicator } from '@vgerbot/channel';
import { Animal, CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';
import { sendCoverageData } from '../../common/sendCoverageData';

describe('WebWorkerCommunicator', () => {
    const channel = new Channel(
        CHANNEL_ID,
        new WebWorkerCommunicator('/base/test/specs/WebWorkerCommunicator/worker.external.js')
    );
    it('Should get_method work correctly', () => {
        return expect(channel.get_method<() => string>('hello')()).to.eventually.become('world');
    });
    it('Should create remote instance correctly', async () => {
        const RemoteDog = channel.get_class<Animal>('Dog');
        const dog = new RemoteDog('Loki');

        expect(dog.getType()).to.eventually.become('Loki');
    });
    after(async () => {
        if (typeof __coverage__ !== 'undefined') {
            const coverageData = await channel.get_method<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }
        channel.destroy();
    });
});
