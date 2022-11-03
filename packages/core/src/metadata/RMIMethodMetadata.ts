import { RemoteMethodOptions } from '../types/RemoteMethodOptions';
import uid from '../common/uid';
import { CallbackParameter } from '../foundation/CallbackParameter';
import { RemoteInstance } from '../foundation/RemoteInstance';
import { RMINamespace } from '../foundation/RNamespace';
import { ParameterType } from '../types/ParameterType';
import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';

export class RMIMethodMetadata {
    private paramTypes?: ParameterType[];
    private getTransferablesFn?: (this: void, ...args) => Transferable[];
    constructor(private readonly methodName: string, options: Omit<RemoteMethodOptions, 'methodName'>) {
        this.paramTypes = options.paramTypes;
        this.getTransferablesFn = options.transferables;
    }
    public getName(): string {
        return this.methodName;
    }
    public getParameterData(namespace: RMINamespace, ...args): SerializableValue {
        if (Array.isArray(this.paramTypes) && this.paramTypes.length > 0) {
            return this.paramTypes.map((it, index) => {
                switch (it) {
                    case ParameterType.callback:
                        const id = uid('cb-xxxxxxxx');
                        namespace.def_method(id, args[index]);
                        return new CallbackParameter(namespace.id, id);
                    case ParameterType.remoteObject:
                        return new RemoteInstance(args[index]);
                }
                return args[index];
            }) as SerializableValue;
        } else {
            return args.map(it => {
                if (typeof it === 'function') {
                    const id = uid('cb-xxxxxxxx');
                    namespace.def_method(id, it);
                    return new CallbackParameter(namespace.id, id);
                }
                return it;
            });
        }
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
}
