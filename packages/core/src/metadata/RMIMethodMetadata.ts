import { isPlainObject } from '../common/isPlainObject';
import uid from '../common/uid';
import { CallbackParameter } from '../foundation/CallbackParameter';
import { RemoteClass } from '../foundation/RemoteClass';
import { RemoteInstance } from '../foundation/RemoteInstance';
import { RMINamespace } from '../foundation/RNamespace';
import { AnyFunction, RemoteMethodOptions, SerializableValue } from '../types';

export class RMIMethodMetadata {
    constructor(private readonly methodName: string, options: Omit<RemoteMethodOptions, 'methodName'>) {}
    public getName(): string {
        return this.methodName;
    }
    public getParameterData(namespace: RMINamespace, ...args: unknown[]): SerializableValue {
        function transformParameter(input: unknown, visited: Map<unknown, unknown>) {
            if (visited.has(input)) {
                return visited.get(input);
            }
            if (Array.isArray(input)) {
                const arr: unknown[] = [];
                visited.set(input, arr);
                for (const item of input) {
                    arr.push(transformParameter(item, visited));
                }
                return arr;
            } else if (input instanceof RemoteClass) {
                return new RemoteInstance(input);
            } else if (isPlainObject(input)) {
                const mapped = {};
                visited.set(input, mapped);
                for (const key in input) {
                    mapped[key] = transformParameter(input[key], visited);
                }
                return mapped;
            } else if (typeof input === 'function') {
                const id = uid('cb-xxxxxxxx');
                namespace.def_method(id, input as AnyFunction);
                return new CallbackParameter(namespace.id, id);
            }
            return input;
        }
        const visited = new Map();
        return args.map(it => transformParameter(it, visited)) as SerializableValue;
    }
}
