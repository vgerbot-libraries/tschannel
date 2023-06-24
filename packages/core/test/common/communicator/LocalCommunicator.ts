import AbstractCommunicator from '../../../src/communicators/AbstractCommunicator';
import { Communicator, InvokeMethodData, Payload, Returning, SerializableValue } from '../../../src/types';

export default class LocalCommunicator extends AbstractCommunicator implements Communicator {
    private other?: LocalCommunicator;
    connectTo(other: LocalCommunicator) {
        this.other = other;
        if (other.other !== this) {
            other.connectTo(this);
        }
    }
    send(payload: Payload<SerializableValue>): void {
        this.other?.messageReceivers.forEach(receiver => {
            receiver(payload.serialize() as InvokeMethodData | Returning);
        });
    }
    close(): void {
        this.messageReceivers = [];
        const other = this.other;
        this.other = undefined;
        other?.close();
    }
    public createRemote() {
        const remote = new LocalCommunicator();
        this.connectTo(remote);
        return remote;
    }
}
