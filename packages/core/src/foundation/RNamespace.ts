import { RMIMethodMetadata } from '../metadata/RMIMethodMetadata';
import { AnyFunction } from '../types/AnyFunction';
import { Destructible } from './Destructible';
import MessageAdaptor from './MessageAdaptor';

export class RMINamespace implements Destructible {
    private readonly remote_methods: Record<string, AnyFunction> = {};
    private readonly local_methods: Record<string, AnyFunction> = {};
    constructor(public readonly id: string, private readonly adaptor: MessageAdaptor, private origin: Object) {}
    public get_method(nameOrMetadata: string | RMIMethodMetadata) {
        if (typeof nameOrMetadata === 'string') {
            return this.remote_methods[nameOrMetadata];
        } else {
            const metadata = nameOrMetadata;
            const name = metadata.getName();
            if (!(name in this.remote_methods)) {
                this.remote_methods[name] = (...args) => {
                    return this.adaptor.invoke(
                        this.id,
                        name,
                        metadata.getParameterData(this, ...args),
                        metadata.getTransferable(...args)
                    );
                };
            }
            return this.remote_methods[name];
        }
    }
    public getOriginObject() {
        return this.origin;
    }
    public def_method<T extends AnyFunction = AnyFunction>(name: string, func?: T) {
        if (typeof func === 'function') {
            if (this.containsMethod(name)) {
                throw new Error(
                    `Duplicate local method name in namespace, namespace: ${this.id}, method name: ${name}`
                );
            }
            this.local_methods[name] = func;
        }
    }
    public get_local_method<T extends AnyFunction = AnyFunction>(name: string) {
        return this.local_methods[name] as T | undefined;
    }
    public containsMethod(name: string): boolean {
        return typeof this.local_methods[name] === 'function';
    }
    public __destroy__() {
        this.clear();
        const destructible = this.origin as Destructible;
        if (typeof destructible.__destroy__ === 'function') {
            destructible.__destroy__();
        }
    }
    public clear() {
        clearObject(this.local_methods);
        clearObject(this.remote_methods);
    }
}

function clearObject(object: {}) {
    Object.keys(object).forEach(key => {
        delete object[key];
    });
}
