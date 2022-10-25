import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WebWorkerCommunicator extends AbstractMessageChannelCommunicator<Worker> {
    constructor(workerScriptURL: string, options?: WorkerOptions) {
        super(new Worker(workerScriptURL, options));
    }
    sendPayload(serializable: SerializableValue, transferables: Transferable[]): void {
        this.target.postMessage(serializable, {
            transfer: transferables
        });
    }
    close(): void {
        this.target.terminate();
    }
}
