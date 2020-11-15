import { RMIMethod } from './types/RMIMethod';

export function local() {
    return (prototype: Object, methodName: string, descriptor: TypedPropertyDescriptor<unknown>) => {
        const method = prototype[methodName] as RMIMethod;
        method.isLocal = true;
        return descriptor;
    };
}
