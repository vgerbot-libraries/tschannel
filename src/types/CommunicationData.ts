import { SerializableObject } from './Serializable';

export interface CommunicationData extends SerializableObject {
    readonly rmiId: string;
    readonly callId: string;
}
