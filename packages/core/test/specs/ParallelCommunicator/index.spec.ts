import { InvokeMethodData, channel, communicators } from '@vgerbot/channel';
import { hex, CHANNEL_ID } from './common';
import istanbul from 'istanbul-lib-coverage';
import { sendCoverageData } from '../../common/sendCoverageData';

describe('ParallelCommunicator', function() {
    this.timeout(1000 * 300);

    const workerURL = '/base/test/specs/ParallelCommunicator/worker.external.js';
    const parallels = 4;
    const parallelsChannel = channel(CHANNEL_ID)
        .parallel(
            parallels,
            () => communicators.webWorker(workerURL)
        )
        .distributor((no: number, payload) => {
            if (payload.getMethodName() === 'get-coverage') {
                return payload;
            }
            const data = payload.serialize() as InvokeMethodData;
            const [buffer] = data.parameters as Parameters<typeof hex>;
            const partSize = buffer.byteLength / parallels;

            return payload.newPayload(
                {
                    ...data,
                    parameters: [buffer, partSize * no, partSize]
                },
                []
            );
        })
        .combiner(data => {
            const errorData = data.find(it => {
                if (!it.success) {
                    return it;
                }
            });
            if (errorData) {
                return errorData;
            }
            const value = data.flatMap(it => it.value as string[]);
            return {
                ...data[0],
                value
            };
        })
        .create();
    const buffer = new SharedArrayBuffer(parallels * 1024 * 8);
    before(async () => {
        const arr = new Uint8Array(buffer);
        arr.forEach((v, i) => {
            arr[i] = Math.floor(Math.random() * 0xff);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
    after(async () => {
        if (typeof __coverage__ === 'object') {
            const coverageDatas = await parallelsChannel.get_method<() => istanbul.CoverageMapData[]>('get-coverage')();
            for (let i = 0; i < coverageDatas.length; i++) {
                await sendCoverageData(coverageDatas[i]);
            }
        }
        await parallelsChannel.destroy();
    });
    it('Should parallel worker works correctly', async () => {
        const remoteHex = parallelsChannel.get_method<typeof hex>('bin2hex');

        const lstartTime = Date.now();
        const localResult = hex(buffer, 0, buffer.byteLength);
        const lendTime = Date.now();

        const startTime = Date.now();
        const remoteResult = await remoteHex(buffer, 0, buffer.byteLength);
        const endTime = Date.now();

        const parallelTime = endTime - startTime;
        const localTime = lendTime - lstartTime;

        console.info(parallelTime, localTime);
        expect(localResult.join('')).to.be.equal(remoteResult.join(''));
    });
});
