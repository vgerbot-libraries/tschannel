import Payload from '../types/Payload';
import { SerializableValue } from '../types/Serializable';
import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export default class WindowChannelCommunicator extends AbstractMessageChannelCommunicator<Window> {
    constructor(private targetWindow: Window, private targetOrigin: string) {
        super(targetWindow);
    }
    send(payload: Payload<SerializableValue>): void {
        this.targetWindow.postMessage(payload.serialize(), this.targetOrigin, payload.transferables());
    }
    close(): void {
        super.close();
    }
}
