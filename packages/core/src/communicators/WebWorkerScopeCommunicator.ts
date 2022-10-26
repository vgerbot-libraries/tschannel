import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WebWorkerScopeCommunicator extends AbstractMessageChannelCommunicator<WorkerGlobalScope> {
    sendPayload(serializable: SerializableValue, transferables: Transferable[]): void {
        postMessage(serializable, transferables);
    }
    constructor() {
        if (!WorkerGlobalScope || !(self instanceof WorkerGlobalScope)) {
            // eslint-disable-next-line quotes
            throw new Error("I'm confident that you didn't initialize WebWorkerScopeCommunicator in a Web Worker!");
        }
        super(self);
    }
}
