import { RMI, WebWorkerScopeCommunicator } from '../../../src';
import { hex, RMI_ID } from './common';

const rmi = new RMI(RMI_ID, new WebWorkerScopeCommunicator());

rmi.lmethod('bin2hex', hex);
