import { CommunicationData } from './CommunicationData';
import { SerializableValue } from './Serializable';

export interface InvokeMethodData extends CommunicationData {
    namespace: string;
    methodName: string;
    parameters: SerializableValue;
}
