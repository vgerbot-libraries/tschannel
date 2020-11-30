import { rclass, RMI, WebWorkerCommunicator } from '../../../src';
import { Animal, RMI_ID } from './common';

describe('WebWorkerCommunicator', () => {
    const rmi = new RMI(RMI_ID, new WebWorkerCommunicator('/base/test/specs/WebWorkerCommunicator/worker.external.js'));
    it('Should rmethod work correctly', async () => {
        await expect(rmi.rmethod<() => string>('hello')()).to.eventually.become('world');
    });
    it('Should create remove instance correctly', async () => {
        @rclass({
            id: 'Dog'
        })
        class RemoteDogDef implements Animal {
            constructor(_: string) {
                //
            }
            public getType(): string {
                throw new Error('');
            }
        }
        const RemoteDog = rmi.rclass(RemoteDogDef);
        const dog = new RemoteDog('Loki');

        expect(dog.getType()).to.eventually.become('Loki');
    });
});
