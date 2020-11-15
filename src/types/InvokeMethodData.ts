import { SerializableValue } from './Serializable';

export interface InvokeMethodData {
    callId: string;
    namespace: string;
    methodName: string;
    parameters: SerializableValue;
    [key: string]: SerializableValue;
}
