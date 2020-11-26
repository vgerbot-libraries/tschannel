import { RMI, WebWorkerCommunicator } from '../../../src';
import { RMI_ID } from './common';

describe('WebWorkerCommunicator', () => {
    const rmi = new RMI(RMI_ID, new WebWorkerCommunicator('/base/test/specs/WebWorkerCommunicator/index.external.js'));
    it('Should rmethod work correctly', async () => {
        await expect(rmi.rmethod<() => string>('hello')()).to.eventually.become('world');
    });
});
