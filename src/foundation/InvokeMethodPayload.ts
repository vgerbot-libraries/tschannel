import { InvokeMethodData } from '../types/InvokeMethodData';
import Payload from '../types/Payload';
import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';

const INVOKE_METHOD_DATA_SYMBOL = 'is-invoke-method-data';

export default class InvokeMethodPayload implements Payload<InvokeMethodData> {
    public static isInvokeMethodData(data: SerializableValue): data is InvokeMethodData {
        return !!(data as Object)[INVOKE_METHOD_DATA_SYMBOL];
    }
    constructor(private readonly data: InvokeMethodData, private readonly transferableArray: Transferable[]) {
        data[INVOKE_METHOD_DATA_SYMBOL] = true;
    }
    serialize(): InvokeMethodData {
        return this.data;
    }
    transferables(): Transferable[] {
        return this.transferableArray;
    }
}
