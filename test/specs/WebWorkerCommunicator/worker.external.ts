import { RMI, WebWorkerScopeCommunicator } from '../../../src';
import { Animal, RMI_ID } from './common';

const rmi = new RMI(RMI_ID, new WebWorkerScopeCommunicator());

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
