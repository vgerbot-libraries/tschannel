import { Channel, WindowChannelCommunicator } from '@tschannel/core';
import { CHANNEL_ID, Animal } from './common';

const channel = new Channel(CHANNEL_ID, new WindowChannelCommunicator(window.parent, window.parent.location.origin));

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
