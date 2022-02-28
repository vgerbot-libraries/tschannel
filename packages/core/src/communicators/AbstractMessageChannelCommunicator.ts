import Payload from '../types/Payload';
import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';
import AbstractCommunicator from './AbstractCommunicator';

export interface EventTarget {
    addEventListener(type: string, callback: (e: MessageEvent) => void);
    removeEventListener(type: string, callback: (e: MessageEvent) => void);
}

export default abstract class AbstractMessageChannelCommunicator<T extends EventTarget> extends AbstractCommunicator {
    protected removeEventListener: () => void;
    constructor(protected target: T) {
        super();
        const listener = e => {
            const event = e as MessageEvent;
            this.messageReceivers.forEach(receiver => {
                receiver(event.data);
            });
        };
        this.target.addEventListener('message', listener);
        this.removeEventListener = () => {
            this.target.removeEventListener('message', listener);
        };
    }
    send(payload: Payload<SerializableValue>): void {
        this.sendPayload(payload.serialize(), payload.transferables());
    }
    abstract sendPayload(serializable: SerializableValue, transferables: Transferable[]): void;
    close() {
        this.removeEventListener();
    }
}
