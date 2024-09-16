import { InvokeMethodData, Payload, SerializableValue } from '../types';

const INVOKE_METHOD_DATA_SYMBOL = 'is-invoke-method-data';

export class InvokeMethodPayload implements Payload<InvokeMethodData> {
    public static isInvokeMethodData(data: SerializableValue): data is InvokeMethodData {
        return !!(data as Object)[INVOKE_METHOD_DATA_SYMBOL];
    }
    constructor(
        private readonly data: InvokeMethodData,
        private readonly namespace: string,
        private readonly methodName: string
    ) {
        data[INVOKE_METHOD_DATA_SYMBOL] = true;
    }
    newPayload(data: InvokeMethodData): Payload<InvokeMethodData> {
        return new InvokeMethodPayload(data, this.namespace, this.methodName);
    }
    serialize(): InvokeMethodData {
        return this.data;
    }
    getNamespace() {
        return this.namespace;
    }
    getMethodName() {
        return this.methodName;
    }
}
