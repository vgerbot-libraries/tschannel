import { rclass, Channel, WebWorkerCommunicator } from '../../../src';
import { Animal, CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';
import { sendCoverageData } from '../../../src/common/sendCoverageData';

describe('WebWorkerCommunicator', () => {
    const channel = new Channel(
        CHANNEL_ID,
        new WebWorkerCommunicator('/base/test/specs/WebWorkerCommunicator/worker.external.js')
    );
    it('Should rmethod work correctly', async () => {
        await expect(channel.rmethod<() => string>('hello')()).to.eventually.become('world');
    });
    it('Should create remove instance correctly', async () => {
        @rclass({
            id: 'Dog'
        })
        class RemoteDogDef implements Animal {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            constructor(_: string) {
                //
            }
            public getType(): string {
                throw new Error('');
            }
        }
        const RemoteDog = channel.rclass(RemoteDogDef);
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
