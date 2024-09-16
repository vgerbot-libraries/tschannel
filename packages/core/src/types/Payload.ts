import { SerializableValue } from './Serializable';

export interface Payload<T extends SerializableValue = SerializableValue> {
    serialize(): T;
    newPayload(data: T): Payload<T>;
    getNamespace(): string;
    getMethodName(): string;
}
