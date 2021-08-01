import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WindowChannelCommunicator extends AbstractMessageChannelCommunicator<Window> {
    constructor(private targetWindow: Window, private targetOrigin: string = '*') {
        super(window || globalThis);
    }
    sendPayload(serializable: SerializableValue, transferables: Transferable[]): void {
        this.targetWindow.postMessage(serializable, this.targetOrigin, transferables);
    }
    close(): void {
        super.close();
    }
}
