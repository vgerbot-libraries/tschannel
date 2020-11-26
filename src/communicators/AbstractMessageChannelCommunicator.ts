import { MessageChannel } from '../types/MessageChannel';
import Payload from '../types/Payload';
import { SerializableValue } from '../types/Serializable';
import AbstractCommunicator from './AbstractCommunicator';

export default abstract class AbstractMessageChannelCommunicator<
    T extends MessageChannel | Window
> extends AbstractCommunicator {
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
        if (typeof window !== 'undefined' && this.target instanceof Window) {
            throw new Error('Method not implemented.');
        } else {
            (this.target.postMessage as MessageChannel['postMessage']).call(
                this.target,
                payload.serialize(),
                payload.transferables()
            );
        }
    }
    close() {
        this.removeEventListener();
    }
}
