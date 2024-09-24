import { RMIClass } from './annotations/types/RMIClass';
import { getPropertyNames } from './common/reflect';
import uid from './common/uid';
import { Destructible, RMINamespace } from './foundation';
import MessageAdaptor from './foundation/MessageAdaptor';
import { RemoteClass } from './foundation/RemoteClass';
import { RMIMethodMetadata } from './metadata/RMIMethodMetadata';
import {
    AnyConstructor,
    AnyFunction,
    Communicator,
    GetRemoteMethodOptions,
    PromisifyClass,
    RemoteClassOptions
} from './types';
import { InternalRemoteClass } from './types/InternalRemoteClass';

type Promisify<F extends AnyFunction, T = void> = (this: T, ...args: Parameters<F>) => Promise<ReturnType<F>>;

export interface Remote extends Destructible {
    __destroy__(): Promise<void>;
}

export class Channel {
    private globalInstance = {
        __destroy__: (namespace: string) => {
            try {
                const namespaceInstance = this.namespaces[namespace];
                if (namespaceInstance) {
                    return namespaceInstance.__destroy__();
                }
            } finally {
                delete this.namespaces[namespace];
            }
        }
    };
    private readonly globalNamespace: RMINamespace;
    private readonly adaptor: MessageAdaptor;
    private readonly namespaces: Record<string, RMINamespace> = {};
    private _isDestroyed = false;

    constructor(id: string, communicator: Communicator) {
        this.adaptor = new MessageAdaptor(id, communicator, this.namespaces);
        this.globalNamespace = new RMINamespace('global', this.adaptor, this.globalInstance);
        this.namespaces[this.globalNamespace.id] = this.globalNamespace;
        this.def_instance(this.globalNamespace, this.globalInstance);
    }

    public get_class<T>(remoteClassIdOrOptions: string | RemoteClassOptions): PromisifyClass<T & Remote> {
        if (!remoteClassIdOrOptions) {
            throw new TypeError(`Invalid Parameter Error: remoteClassId: ${remoteClassIdOrOptions}`);
        }
        const options =
            typeof remoteClassIdOrOptions === 'object'
                ? remoteClassIdOrOptions
                : { remoteClassId: remoteClassIdOrOptions };
        const remoteClassId = options.remoteClassId;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const channel = this;

        if (typeof remoteClassId !== 'string' || remoteClassId.length < 1) {
            throw new Error(`Incorrect classId: ${remoteClassId}`);
        }

        const RemoteClassFn = function RemoteClassFn() {
            //
        } as unknown as {
            new (): Object;
            prototype: Object;
        };

        RemoteClassFn.prototype = new Proxy(new RemoteClass(), {
            get: (target, p, receiver) => {
                if (Reflect.has(target, p) || typeof p === 'symbol') {
                    return Reflect.get(target, p, receiver);
                }
                const method = this.generateRemoteMemberMethod(p);
                Reflect.set(target, p, method, receiver);
                return method;
            }
        });

        class cls extends RemoteClassFn implements Remote, InternalRemoteClass {
            public readonly $namespace = new RMINamespace(uid(), channel.adaptor, this);
            public readonly $initPromise: Promise<void>;

            constructor(...args: unknown[]) {
                super();
                channel.namespaces[this.$namespace.id] = this.$namespace;
                this.$initPromise = channel.get_method({
                    methodName: remoteClassId + '-new-instance'
                })(this.$namespace.id, args) as Promise<void>;
            }

            __destroy__() {
                return channel.destroyThat(this);
            }
        }
        return cls as unknown as PromisifyClass<T & Remote>;
    }
    private generateRemoteMemberMethod<T extends InternalRemoteClass>(methodName: string) {
        const metadata = new RMIMethodMetadata(methodName, {});
        return async function (this: T, ...args: unknown[]) {
            await this.$initPromise;
            return this.$namespace.get_method(metadata).apply(this, args);
        };
    }
    public def_class(id: string, clazz: AnyConstructor): void {
        const constructorMethodName = id + '-new-instance';
        if (this.globalNamespace.containsMethod(constructorMethodName)) {
            throw new Error(`Duplicate local class id: ${id}`);
        }
        const propertyNames = getPropertyNames(clazz.prototype);
        const methodNames = propertyNames.filter(propertyName => {
            return propertyName !== 'constructor' && typeof clazz.prototype[propertyName] === 'function';
        });
        this.def_method(constructorMethodName, (instanceNamespaceId, args: unknown[]) => {
            const instance = new clazz(...args);
            const namespace = (this.namespaces[instanceNamespaceId] = new RMINamespace(
                instanceNamespaceId,
                this.adaptor,
                instance
            ));
            this.def_instance(namespace, instance, methodNames);
        });
    }

    public def_instance(id: string | RMINamespace, instance: Object, methodNames: string[] = Object.keys(instance)) {
        const namespace = id instanceof RMINamespace ? id : new RMINamespace(id, this.adaptor, instance);
        methodNames.forEach(name => {
            const value = instance[name];
            if (typeof value !== 'function') {
                return;
            }
            namespace.def_method(name, value.bind(instance));
        });
        this.namespaces[namespace.id] = namespace;
    }
    public get_method<F extends AnyFunction, T = void>(
        methodNameOrMetadataOrOptions: string | RMIMethodMetadata | GetRemoteMethodOptions
    ): (this: T, ...args: Parameters<F>) => Promise<ReturnType<F>> {
        if (!methodNameOrMetadataOrOptions) {
            throw new TypeError(`Invalid Parameter Error: methodName: ${methodNameOrMetadataOrOptions}`);
        }
        const { metadata: inputMetadata, methodName } = this.resolveRemoteMethodOptions(methodNameOrMetadataOrOptions);
        let metadata = inputMetadata;
        if (!metadata) {
            metadata = new RMIMethodMetadata(methodName, {});
        }
        return this.globalNamespace.get_method(metadata) as Promisify<F, T>;
    }

    private resolveRemoteMethodOptions(opt: string | RMIMethodMetadata | GetRemoteMethodOptions) {
        if (typeof opt === 'string') {
            return {
                metadata: undefined,
                methodName: opt
            };
        } else if (opt instanceof RMIMethodMetadata) {
            return {
                metadata: opt,
                methodName: opt.getName()
            };
        }
        return {
            metadata: undefined,
            options: opt,
            methodName: opt.methodName
        };
    }

    public def_method<T extends AnyFunction = AnyFunction>(name: string, func: T): void;
    public def_method<T extends AnyFunction = AnyFunction>(func: T): void;
    public def_method(...args: unknown[]): void {
        if (typeof args[0] !== 'string') {
            throw new Error('Illegal argument: name is not a string!');
        }
        const name = args[0] as string;
        const func = args[1] as AnyFunction;
        this.globalNamespace.def_method(name, func);
    }

    public destroyThat<T>(remote_instance: T): Promise<void> {
        const namespace = (remote_instance as unknown as RMIClass).$namespace;
        if (!namespace) {
            return Promise.reject(new Error('Illegal argument: target is not a remote instance!'));
        }
        delete this.namespaces[namespace.id];
        return this.get_method('__destroy__')(namespace.id) as Promise<void>;
    }

    public get isDestroyed() {
        return this._isDestroyed;
    }

    public async destroy() {
        if (this._isDestroyed) {
            return;
        }
        this.globalNamespace.__destroy__();
        await Promise.all(
            Object.keys(this.namespaces).map(id => {
                return this.namespaces[id].__destroy__();
            })
        );
        this.adaptor.destroy();
        this._isDestroyed = true;
    }
}
