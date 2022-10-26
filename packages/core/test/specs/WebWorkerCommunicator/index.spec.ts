import { channel as fchannel } from '@vgerbot/channel';
import { Animal, CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';
import { sendCoverageData } from '../../common/sendCoverageData';

describe('WebWorkerCommunicator', () => {
    const channel = fchannel(CHANNEL_ID)
        .connectToWorker('/base/test/specs/WebWorkerCommunicator/worker.external.js')
        .options({
            credentials: 'same-origin'
        })
        .create();
    it('Should get_method work correctly', () => {
        return expect(channel.get_method<() => string>('hello')()).to.eventually.become('world');
    });
    it('Should create remote instance correctly', async () => {
        const RemoteDog = channel.get_class<Animal>('Dog');
        const dog = new RemoteDog('Loki');

        expect(dog.getType()).to.eventually.become('Loki');
    });
    it('Should transfer OffscreenCanvas correctly', async () => {
        interface Painter {
            checkCanvas(): boolean;
        }
        const Painter = channel.get_class<Painter>('Painter', ['checkCanvas'], {
            getConstructorTransferable: (...args) => [args[0]],
            getTransferable: (methodName, ...args) => {
                if (methodName === 'checkCanvas') {
                    return [args[0]];
                }
                return [];
            }
        });

        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 100;
        const offscreenCanvas = (canvas as any).transferControlToOffscreen();
        const painter = new Painter(offscreenCanvas);
        expect(painter.checkCanvas()).to.eventually.become(true);
    });
    after(async () => {
        if (typeof __coverage__ !== 'undefined') {
            const coverageData = await channel.get_method<() => istanbul.CoverageMapData>('get-coverage')();
            await sendCoverageData(coverageData);
        }
        channel.destroy();
    });
});
