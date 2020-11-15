import { RemoteMethodOptions } from './types/RemoteMethodOptions';
import { RMIMethod } from './types/RMIMethod';

export function rmethod(options: RemoteMethodOptions) {
    return (prototype: Object, methodName: string, descriptor: TypedPropertyDescriptor<unknown>) => {
        const method = prototype[methodName] as RMIMethod;
        method.isLocal = false;
        method.options = options;
        return descriptor;
    };
}
