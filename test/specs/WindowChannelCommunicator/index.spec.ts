import { rclass, Channel, WindowChannelCommunicator } from '../../../src';
import { Animal, CHANNEL_ID } from './common';

describe('WebWorkerCommunicator', () => {
    let channel: Channel;
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
        channel = new Channel(
            CHANNEL_ID,
            new WindowChannelCommunicator(iframe.contentWindow as Window, location.origin)
        );
    });
    after(() => {
        document.body.removeChild(iframe);
    });

    it('Should rmethod work correctly', async () => {
        await expect(channel.rmethod<() => string>('hello')()).to.eventually.become('world');
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
        const RemoteDog = channel.rclass(RemoteDogDef);
        const dog = new RemoteDog('Loki');

        expect(dog.getType()).to.eventually.become('Loki');
    });
});
