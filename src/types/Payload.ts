import { SerializableValue } from './Serializable';
import { Transferable } from './Transferable';

export default interface Payload<T extends SerializableValue = SerializableValue> {
    serialize(): T;
    transferables(): Transferable[];
    newPayload(data: T, transferables?: Transferable[]): Payload<T>;
    getNamespace(): string;
    getMethodName(): string;
}
