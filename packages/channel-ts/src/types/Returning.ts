import { CommunicationData } from './CommunicationData';
import { SerializableValue } from './Serializable';

export interface Returning extends CommunicationData {
    readonly success: boolean;
    readonly error?: {
        readonly name: string;
        readonly message: string;
        readonly stack: string;
    };
    readonly value?: SerializableValue;
    readonly namespace: string;
    readonly methodName: string;
}
