import { SerializableValue } from './Serializable';

export interface InvokeMethodData {
    rmiId: string;
    callId: string;
    namespace: string;
    methodName: string;
    parameters: SerializableValue;
    [key: string]: SerializableValue;
}
