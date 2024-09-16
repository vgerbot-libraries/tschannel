import { extractTransferables } from '../common/extractTransferables';
import { SerializableValue } from '../types/Serializable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WebWorkerCommunicator extends AbstractMessageChannelCommunicator<Worker> {
    constructor(workerScriptURL: string, options?: WorkerOptions) {
        super(new Worker(workerScriptURL, options));
    }
    sendPayload(serializable: SerializableValue): void {
        this.target.postMessage(serializable, {
            transfer: extractTransferables(serializable)
        });
    }
    close(): void {
        this.target.terminate();
    }
}
