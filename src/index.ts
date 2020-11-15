import { RMIClass, RMIClassConstructor } from './annotations/types/RMIClass';
import { RMIMethod } from './annotations/types/RMIMethod';
import uid from './common/uid';
import MessageAdaptor from './foundation/MessageAdaptor';
import { RMINamespace } from './foundation/RNamespace';
import { RMIMethodMetadata } from './metadata/RMIMethodMetadata';
import { AnyConstructor } from './types/AnyConstructor';
import { AnyFunction } from './types/AnyFunction';
import { Communicator } from './types/Communicator';
import istatic from './types/istatic';

type Promisify<F extends AnyFunction, T = void> = (this: T, ...args: Parameters<F>) => Promise<ReturnType<F>>;

export class RMI {
    private globalInstance = {
        release: (namespace: string) => {
            delete this.namespaces[namespace];
        }
    };
    private readonly globalNamespace: RMINamespace;
    private readonly adaptor: MessageAdaptor;
    private readonly namespaces: Record<string, RMINamespace> = {};
    constructor(communicator: Communicator) {
        this.adaptor = new MessageAdaptor(communicator, this.namespaces);
        this.globalNamespace = new RMINamespace(uid(), this.adaptor);
        this.namespaces[this.globalNamespace.id] = this.globalNamespace;
        this.linstance(this.globalNamespace, this.globalInstance);
    }
    public rclass<T extends AnyConstructor>(clazz: T): T {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const rmi = this;
        @istatic<RMIClassConstructor>()
        class cls extends clazz {
            public static id: string = (clazz as any).id;
            public readonly $namespace = new RMINamespace(uid(), rmi.adaptor);
            constructor(...args) {
                super(...args);
                rmi.namespaces[this.$namespace.id] = this.$namespace;
                rmi.rmethod(new RMIMethodMetadata(cls.id + '-new-instance', {}))(this.$namespace.id, args);
            }
        }
        const propertyNames = Object.getOwnPropertyNames(clazz.prototype);
        propertyNames.forEach(propertyName => {
            const propertyValue = clazz.prototype[propertyName];
            if (typeof propertyValue != 'function') {
                return;
            }
            const method = cls.prototype[propertyValue] as RMIMethod;
            if (method.isLocal) {
                return;
            }
            const metadata = new RMIMethodMetadata(propertyName, method.options);
            cls.prototype[propertyValue] = function(...args) {
                return (this as cls).$namespace.rmethod(metadata).apply(this, args);
            };
        });
        return cls;
    }
    public lclass(id: string, clazz: AnyConstructor) {
        const propertyNames = Object.getOwnPropertyNames(clazz.prototype);
        const methodNames = propertyNames.filter(propertyName => {
            return typeof clazz.prototype[propertyName] === 'function';
        });
        this.lmethod(id + '-new-instance', (instanceNamespaceId, ...args) => {
            const namespace = (this.namespaces[instanceNamespaceId] = new RMINamespace(
                instanceNamespaceId,
                this.adaptor
            ));
            const instance = new clazz(...args);
            this.linstance(namespace, instance, methodNames);
        });
    }
    public linstance(id: string | RMINamespace, instance: Object, methodNames: string[] = Object.keys(instance)) {
        const namespace = id instanceof RMINamespace ? id : new RMINamespace(id, this.adaptor);
        methodNames.forEach(name => {
            const value = instance[name];
            if (typeof value !== 'function') {
                return;
            }
            namespace.lmethod(name, value);
        });
        this.namespaces[namespace.id] = namespace;
    }
    public rmethod<F extends AnyFunction, T = void>(
        metadata: RMIMethodMetadata,
        context?: T
    ): (this: T, ...args: Parameters<F>) => Promise<ReturnType<F>> {
        return this.globalNamespace.rmethod(metadata).bind(context) as Promisify<F, T>;
    }
    public lmethod(name: string, func?: AnyFunction) {
        return this.globalNamespace.lmethod(name, func);
    }
    public release(rinstance: RMIClass): Promise<void> {
        const namespace = rinstance.$namespace;
        if (!namespace) {
            return Promise.reject(new Error(''));
        }
        delete this.namespaces[namespace.id];
        return this.globalNamespace.rmethod('release')(namespace.id) as Promise<void>;
    }
}
