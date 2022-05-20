import { channel } from '@vgerbot/channel';
import { Animal, CHANNEL_ID } from './common';

const workerChannel = channel(CHANNEL_ID)
    .connectToMainThread()
    .create();

workerChannel.lmethod('hello', () => 'world');

workerChannel.lclass(
    'Dog',
    class Dog implements Animal {
        constructor(private type: string) {}
        public getType(): string {
            return this.type;
        }
    }
);
workerChannel.lmethod('get-coverage', () => {
    return __coverage__;
});
