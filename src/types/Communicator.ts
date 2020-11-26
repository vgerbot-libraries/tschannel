import { CommunicationData } from './CommunicationData';
import { InvokeMethodData } from './InvokeMethodData';
import Payload from './Payload';
import { Returning } from './Returning';

export type CommunicatorMessageReceiver = (data: InvokeMethodData | Returning) => void;

export interface Communicator {
    send(payload: Payload<CommunicationData>): void;
    addReceiveMessageListener(receiver: CommunicatorMessageReceiver): () => void;
    close(): void;
}
