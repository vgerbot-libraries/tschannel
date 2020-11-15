import { InvokeMethodData } from './InvokeMethodData';
import Payload from './Payload';
import { Returning } from './Returning';

export type CommunicatorMessageReceiver = (data: InvokeMethodData | Returning) => void;

export interface Communicator {
    send(payload: Payload): void;
    addReceiveMessageListener(receiver: CommunicatorMessageReceiver): () => void;
    close(): void;
}
