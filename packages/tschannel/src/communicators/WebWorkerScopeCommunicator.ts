import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';
export class WebWorkerScopeCommunicator extends AbstractMessageChannelCommunicator<typeof globalThis> {
    sendPayload(serializable: SerializableValue, transferables: Transferable[]): void {
        self.postMessage(serializable, transferables);
    }
    constructor() {
        super(globalThis);
    }
}
