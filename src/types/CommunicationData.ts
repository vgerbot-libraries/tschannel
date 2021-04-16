import { SerializableObject } from './Serializable';

export interface CommunicationData extends SerializableObject {
    readonly channelId: string;
    readonly callId: string;
}
