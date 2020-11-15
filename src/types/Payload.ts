import { SerializableValue } from './Serializable';
import { Transferable } from './Transferable';

export default interface Payload<T extends SerializableValue = SerializableValue> {
    serialize(): T;
    transferables(): Transferable[];
}
