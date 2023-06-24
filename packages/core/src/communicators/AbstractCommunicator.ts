import { Communicator, CommunicatorMessageReceiver, Payload, SerializableValue } from '../types';

export default abstract class AbstractCommunicator implements Communicator {
    protected messageReceivers: CommunicatorMessageReceiver[] = [];
    abstract send(payload: Payload<SerializableValue>): void;
    abstract close(): void;
    public addReceiveMessageListener(receiver: CommunicatorMessageReceiver): () => void {
        this.messageReceivers.push(receiver);
        return () => {
            const index = this.messageReceivers.indexOf(receiver);
            if (index === -1) {
                return;
            }
            this.messageReceivers.splice(index, 1);
        };
    }
}
export { AbstractCommunicator };
