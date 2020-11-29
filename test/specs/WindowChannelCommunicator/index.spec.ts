import { rclass, RMI, WindowChannelCommunicator } from '../../../src';
import { Animal, RMI_ID } from './common';

describe('WebWorkerCommunicator', () => {
    let rmi: RMI;

    before(async () => {
        const url = location.origin + '/base/test/specs/WindowChannelCommunicator/iframe.external.html';

        const iframe = document.createElement('iframe');
        const promise = new Promise(resolve => {
            iframe.onload = resolve;
        });
        iframe.src = url;
        document.body.appendChild(iframe);
        await promise;
        rmi = new RMI(RMI_ID, new WindowChannelCommunicator(iframe.contentWindow as Window, location.origin));
    });

    it('Should rmethod work correctly', async () => {
        await expect(rmi.rmethod<() => string>('hello')()).to.eventually.become('world');
    });
    it('Should create remove instance correctly', async () => {
        @rclass({
            id: 'Dog'
        })
        class RemoteDogDef implements Animal {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            constructor(type: string) {
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
