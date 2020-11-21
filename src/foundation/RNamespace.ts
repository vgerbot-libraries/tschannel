import { RMIMethodMetadata } from '../metadata/RMIMethodMetadata';
import { AnyFunction } from '../types/AnyFunction';
import MessageAdaptor from './MessageAdaptor';

export class RMINamespace {
    private readonly rmethods: Record<string, AnyFunction> = {};
    private readonly lmethods: Record<string, AnyFunction> = {};
    constructor(public readonly id: string, private readonly adaptor: MessageAdaptor) {}
    public rmethod(nameOrMetadata: string | RMIMethodMetadata) {
        if (typeof nameOrMetadata === 'string') {
            return this.rmethods[nameOrMetadata];
        } else {
            const metadata = nameOrMetadata;
            const name = metadata.getName();
            if (!(name in this.rmethods)) {
                this.rmethods[name] = (...args) => {
                    return this.adaptor.invoke(
                        this.id,
                        name,
                        metadata.getParameterData(this, ...args),
                        metadata.getTransferable(...args)
                    );
                };
            }
            return this.rmethods[name];
        }
    }
    public lmethod<T extends AnyFunction = AnyFunction>(name: string, func?: T): T {
        if (this.containsMethod(name)) {
            throw new Error(`Duplicate local method name in namespace, namespace: ${this.id}, method name: ${name}`);
        }
        if (typeof func === 'function') {
            this.lmethods[name] = func;
        }
        return this.lmethods[name] as T;
    }
    public containsMethod(name: string): boolean {
        return typeof this.lmethods[name] === 'function';
    }
}
