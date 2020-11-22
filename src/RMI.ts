import { RMIClass, RMIClassConstructor } from './annotations/types/RMIClass';
import { RMIMethod } from './annotations/types/RMIMethod';
import uid from './common/uid';
import MessageAdaptor from './foundation/MessageAdaptor';
import { RMINamespace } from './foundation/RNamespace';
import { RMIMethodMetadata } from './metadata/RMIMethodMetadata';
import { AnyConstructor, Constructor } from './types/AnyConstructor';
import { AnyFunction } from './types/AnyFunction';
import { Communicator } from './types/Communicator';
import istatic from './types/istatic';
import { PromisifyClass } from './types/PromisifyClass';

type Promisify<F extends AnyFunction, T = void> = (this: T, ...args: Parameters<F>) => Promise<ReturnType<F>>;

export class RMI {
    private globalInstance = {
        release: (namespace: string) => {
            delete this.namespaces[namespace];
            return true;
        }
    };
    private readonly globalNamespace: RMINamespace;
    private readonly adaptor: MessageAdaptor;
    private readonly namespaces: Record<string, RMINamespace> = {};
    constructor(id: string, communicator: Communicator) {
        this.adaptor = new MessageAdaptor(id, communicator, this.namespaces);
        this.globalNamespace = new RMINamespace('global', this.adaptor);
        this.namespaces[this.globalNamespace.id] = this.globalNamespace;
        this.linstance(this.globalNamespace, this.globalInstance);
    }
    public rclass<T>(_clazz: Constructor<T>): PromisifyClass<T> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const rmi = this;
        const clazz = (_clazz as unknown) as RMIClassConstructor;
        if (typeof clazz.id !== 'string') {
            throw new Error(`Incorrect remote class: ${clazz}, @rclass() decorator is missing!`);
        }
        @istatic<RMIClassConstructor>()
        class cls extends clazz {
            public readonly $namespace = new RMINamespace(uid(), rmi.adaptor);
            public readonly $initPromise: Promise<void>;
            constructor(...args) {
                super(...args);
                rmi.namespaces[this.$namespace.id] = this.$namespace;
                this.$initPromise = rmi.rmethod(new RMIMethodMetadata(cls.id + '-new-instance', {}))(
                    this.$namespace.id,
                    args
                ) as Promise<void>;
            }
        }
        const propertyNames = Object.getOwnPropertyNames(clazz.prototype).filter(it => it !== 'constructor');
        propertyNames.forEach(propertyName => {
            const propertyValue = clazz.prototype[propertyName];
            if (typeof propertyValue != 'function') {
                return;
            }
            const method = clazz.prototype[propertyName] as RMIMethod;
            if (method.isLocal) {
                return;
            }
            const metadata = new RMIMethodMetadata(propertyName, method.options);
            cls.prototype[propertyName] = function(this: cls, ...args) {
                return this.$initPromise.then(() => {
                    return this.$namespace.rmethod(metadata).apply(this, args);
                });
            };
        });
        return (cls as unknown) as PromisifyClass<T>;
    }
    public lclass(id: string, clazz: AnyConstructor) {
        const constructorMethodName = id + '-new-instance';
        if (this.globalNamespace.containsMethod(constructorMethodName)) {
            throw new Error(`Duplicate local class id: ${id}`);
        }
        const propertyNames = Object.getOwnPropertyNames(clazz.prototype);
        const methodNames = propertyNames.filter(propertyName => {
            return propertyName !== 'constructor' && typeof clazz.prototype[propertyName] === 'function';
        });
        this.lmethod(constructorMethodName, (instanceNamespaceId, args: unknown[]) => {
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
            namespace.lmethod(name, value.bind(instance));
        });
        this.namespaces[namespace.id] = namespace;
    }
    public rmethod<F extends AnyFunction, T = void>(
        metadata: string | RMIMethodMetadata,
        func?: F,
        context?: T
    ): (this: T, ...args: Parameters<F>) => Promise<ReturnType<F>> {
        if (typeof metadata === 'string') {
            metadata = new RMIMethodMetadata(metadata, ((func as unknown) as RMIMethod)?.options || {});
        }
        return this.globalNamespace.rmethod(metadata).bind(context) as Promisify<F, T>;
    }
    public lmethod(name: string, func?: AnyFunction) {
        return this.globalNamespace.lmethod(name, func);
    }
    public release<T>(rinstance: T): Promise<boolean> {
        const namespace = ((rinstance as unknown) as RMIClass).$namespace;
        if (!namespace) {
            return Promise.reject(new Error('Inllegal argument: target is not a remote instance!'));
        }
        delete this.namespaces[namespace.id];
        return this.rmethod('release')(namespace.id) as Promise<boolean>;
    }
    public destroy() {
        this.adaptor.destroy();
        this.globalNamespace.clear();
        Object.keys(this.namespaces).forEach(id => {
            this.namespaces[id].clear();
        });
    }
}
