import AbstractCommunicator from '../../../src/communicators/AbstractCommunicator';
import { Communicator, CommunicatorMessageReceiver } from '../../../src/types/Communicator';
import { InvokeMethodData } from '../../../src/types/InvokeMethodData';
import Payload from '../../../src/types/Payload';
import { Returning } from '../../../src/types/Returning';
import { SerializableValue } from '../../../src/types/Serializable';

export default class LocalCommunicator extends AbstractCommunicator implements Communicator {
    public messageReceivers: CommunicatorMessageReceiver[] = [];
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
        this.other?.close();
        this.other = undefined;
    }
    public createRemote() {
        const remote = new LocalCommunicator();
        this.connectTo(remote);
        return remote;
    }
}
