import { RMI, WebWorkerScopeCommunicator } from '../../../src';
import { RMI_ID } from './common';

const rmi = new RMI(RMI_ID, new WebWorkerScopeCommunicator());

rmi.lmethod('hello', () => 'world');
