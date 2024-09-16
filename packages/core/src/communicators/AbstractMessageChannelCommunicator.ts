import { Payload, SerializableValue } from '../types';
import AbstractCommunicator from './AbstractCommunicator';

export interface EventTarget {
    addEventListener(type: string, callback: (e: MessageEvent) => void): void;
    removeEventListener(type: string, callback: (e: MessageEvent) => void): void;
}

export default abstract class AbstractMessageChannelCommunicator<T extends EventTarget> extends AbstractCommunicator {
    protected removeEventListener: () => void;
    protected constructor(protected target: T) {
        super();
        const listener = (event: MessageEvent) => {
            this.messageReceivers.forEach(receiver => {
                receiver(event.data);
            });
        };
        this.target.addEventListener('message', listener);
        this.removeEventListener = () => {
            this.target.removeEventListener('message', listener);
        };
    }
    send(payload: Payload): void {
        this.sendPayload(payload.serialize());
    }
    abstract sendPayload(serializable: SerializableValue): void;
    close() {
        this.removeEventListener();
    }
}
