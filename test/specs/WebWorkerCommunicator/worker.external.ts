import { Channel, WebWorkerScopeCommunicator } from '../../../src';
import { Animal, CHANNEL_ID } from './common';

const channel = new Channel(CHANNEL_ID, new WebWorkerScopeCommunicator());

channel.lmethod('hello', () => 'world');

channel.lclass(
    'Dog',
    class Dog implements Animal {
        constructor(private type: string) {}
        public getType(): string {
            return this.type;
        }
    }
);
channel.lmethod('get-coverage', () => {
    return __coverage__;
});
