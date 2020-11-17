import { RemoteMethodOptions } from '../annotations/types/RemoteMethodOptions';
import uid from '../common/uid';
import { CallbackParameter } from '../foundation/CallbackParameter';
import { RMINamespace } from '../foundation/RNamespace';
import { ParameterType } from '../types/ParameterType';
import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';

export class RMIMethodMetadata {
    private namespace?: string;
    private paramTypes?: ParameterType[];
    private getTransferablesFn?: (this: void, ...args) => Transferable[];
    constructor(private readonly methodName: string, options: RemoteMethodOptions = {}) {
        this.namespace = options.namespace || 'global';
        this.paramTypes = options.paramTypes;
        this.getTransferablesFn = options.transferables;
    }
    public getName(): string {
        return this.methodName;
    }
    public getParameterData(namespace: RMINamespace, ...args): SerializableValue {
        if (Array.isArray(this.paramTypes) && this.paramTypes.length > 0) {
            return this.paramTypes.map((it, index) => {
                if (it === ParameterType.callback) {
                    const id = uid();
                    namespace.lmethod(id, args[index]);
                    return new CallbackParameter(namespace.id, id);
                }
                return args[index];
            }) as SerializableValue;
        }
        return args;
    }
    public getTransferable(...args): Transferable[] {
        if (typeof this.getTransferablesFn === 'function') {
            return this.getTransferablesFn.apply(undefined, args);
        }
        if (Array.isArray(this.paramTypes) && this.paramTypes.length > 0) {
            return this.paramTypes
                .map((it, index) => {
                    if (it === ParameterType.transferable) {
                        return args[index];
                    }
                })
                .filter(it => !!it) as Transferable[];
        }
        return [];
    }
    public getNamespace() {
        return this.namespace;
    }
}
