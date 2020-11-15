import { RemoteMethodOptions } from '../annotations/types/RemoteMethodOptions';
import uid from '../common/uid';
import { CallbackParameter } from '../foundation/CallbackParameter';
import { RMINamespace } from '../foundation/RNamespace';
import { ParameterType } from '../types/ParameterType';
import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';

export class RMIMethodMetadata {
    constructor(private readonly methodName: string, private readonly options: RemoteMethodOptions) {}
    public getName(): string {
        return this.methodName;
    }
    public getParameterData(namespace: RMINamespace, ...args): SerializableValue {
        if (Array.isArray(this.options.paramTypes)) {
            return this.options.paramTypes.map((it, index) => {
                if (it === ParameterType.callback) {
                    const id = uid();
                    namespace.lmethod(id, args[index]);
                    return new CallbackParameter(namespace.id, id);
                }
                return args[index];
            }) as SerializableValue;
        }
        return [];
    }
    public getTransferable(...args): Transferable[] {
        if (typeof this.options.transferables === 'function') {
            return this.options.transferables.apply(undefined, args);
        }
        if (Array.isArray(this.options.paramTypes)) {
            return this.options.paramTypes
                .map((it, index) => {
                    if (it === ParameterType.transferable) {
                        return args[index];
                    }
                })
                .filter(it => !!it) as Transferable[];
        }
        return [];
    }
}
