import { extractTransferables } from '../common/extractTransferables';
import { SerializableValue } from '../types/Serializable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WindowChannelCommunicator extends AbstractMessageChannelCommunicator<Window> {
    constructor(private targetWindow: Window, private targetOrigin: string = '*') {
        super(window || globalThis);
    }
    sendPayload(serializable: SerializableValue): void {
        this.targetWindow.postMessage(serializable, this.targetOrigin, extractTransferables(serializable));
    }
    close(): void {
        super.close();
    }
}
