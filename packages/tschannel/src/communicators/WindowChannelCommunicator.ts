import Payload from '../types/Payload';
import { SerializableValue } from '../types/Serializable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WindowChannelCommunicator extends AbstractMessageChannelCommunicator<Window> {
    constructor(private targetWindow: Window, private targetOrigin: string = '*') {
        super(window || globalThis);
    }
    send(payload: Payload<SerializableValue>): void {
        this.targetWindow.postMessage(payload.serialize(), this.targetOrigin, payload.transferables());
    }
    close(): void {
        super.close();
    }
}
