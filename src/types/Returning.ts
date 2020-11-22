import { SerializableValue } from './Serializable';

export interface Returning {
    readonly rmiId: string;
    readonly callId: string;
    readonly success: boolean;
    readonly error?: {
        readonly name: string;
        readonly message: string;
        readonly stack: string;
    };
    readonly value?: SerializableValue;
    [key: string]: SerializableValue;
}
