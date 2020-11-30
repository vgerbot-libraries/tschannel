import { InvokeMethodData, ParallelCommunicator, RMI, WebWorkerCommunicator } from '../../../src';
import { hex, RMI_ID } from './common';

describe.only('ParallelCommunicator', function() {
    this.timeout(1000 * 300);

    const workerURL = '/base/test/specs/ParallelCommunicator/worker.external.js';
    const parallels = 4;
    const rmi = new RMI(
        RMI_ID,
        new ParallelCommunicator(
            Array(parallels)
                .fill(undefined)
                .map(() => new WebWorkerCommunicator(workerURL)),
            (no: number, payload) => {
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
            },
            data => {
                const errorData = data.find(it => {
                    if (!it.success) {
                        return it;
                    }
                });
                if (errorData) {
                    return errorData;
                }
                let value: string[] = [];
                data.forEach(it => {
                    value = value.concat(it.value as string[]);
                    // const v = it.value as string[];
                    // for (let i = 0; i < v.length; i++) {
                    //     value.push(v[i]);
                    // }
                });
                return {
                    ...data[0],
                    value
                };
            }
        )
    );
    const buffer = new SharedArrayBuffer(parallels * 1024 * 1024 * 8);
    before(() => {
        const arr = new Uint8Array(buffer);
        arr.forEach((v, i) => {
            arr[i] = Math.floor(Math.random() * 0xff);
        });
    });
    after(() => {
        rmi.destroy();
    });
    it('Should parallel worker works more faster', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const remoteHex = rmi.rmethod<typeof hex>('bin2hex');

        const lstartTime = Date.now();
        const localResult = hex(buffer, 0, buffer.byteLength);
        const lendTime = Date.now();

        const startTime = Date.now();
        const remoteResult = await remoteHex(buffer, 0, buffer.byteLength);
        const endTime = Date.now();

        const parallelTime = endTime - startTime;
        const localTime = lendTime - lstartTime;

        console.info(parallelTime, localTime);
        expect(localResult).to.be.equal(remoteResult);
    });
});
