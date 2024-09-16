import { extractTransferables } from '../common/extractTransferables';
import { SerializableValue } from '../types/Serializable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WebWorkerScopeCommunicator extends AbstractMessageChannelCommunicator<WorkerGlobalScope> {
    sendPayload(serializable: SerializableValue): void {
        (self as DedicatedWorkerGlobalScope).postMessage(serializable, extractTransferables(serializable));
    }
    constructor() {
        if (!WorkerGlobalScope || !(self instanceof WorkerGlobalScope)) {
            // eslint-disable-next-line quotes
            throw new Error("I'm confident that you didn't initialize WebWorkerScopeCommunicator in a Web Worker!");
        }
        super(self);
    }
}
