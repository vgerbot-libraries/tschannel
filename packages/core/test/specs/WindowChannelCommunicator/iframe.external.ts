import { Channel, WindowChannelCommunicator } from '@vgerbot/channel';
import { CHANNEL_ID, Animal } from './common';

const channel = new Channel(CHANNEL_ID, new WindowChannelCommunicator(window.parent, window.parent.location.origin));

channel.def_method('hello', () => 'world');

channel.def_class(
    class Dog implements Animal {
        constructor(private type: string) {}
        public getType(): string {
            return this.type;
        }
    },
    'Dog'
);
channel.def_method('get-coverage', () => {
    return __coverage__;
});
