import { RMI, WindowChannelCommunicator } from '../../../src';
import { RMI_ID, Animal } from './common';

const rmi = new RMI(RMI_ID, new WindowChannelCommunicator(window.parent, window.parent.location.origin));

rmi.lmethod('hello', () => 'world');

rmi.lclass(
    'Dog',
    class Dog implements Animal {
        constructor(private type: string) {}
        public getType(): string {
            return this.type;
        }
    }
);
