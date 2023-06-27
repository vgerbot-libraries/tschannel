import { RMIClass, RMIClassConstructor } from './annotations/types/RMIClass';
import { RMIMethod } from './annotations/types/RMIMethod';
import { getPropertyNames } from './common/reflect';
import uid from './common/uid';
import { Destructible, RMINamespace } from './foundation';
import MessageAdaptor from './foundation/MessageAdaptor';
import { RMIMethodMetadata } from './metadata/RMIMethodMetadata';
import {
    AnyConstructor,
    AnyFunction,
    Communicator,
    Constructor,
    GetRemoteMethodOptions,
    PromisifyClass,
    RemoteClassOptions,
    RemoteMethodOptions
} from './types';

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

    public get_class<T>(
        remoteClassIdOrOptions?: string | RemoteClassOptions<T>,
        _clazzOrMembers?: Constructor<T> | Array<keyof T>
    ): PromisifyClass<T & Remote> {
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
        let clazz;
        if (Array.isArray(_clazzOrMembers)) {
            clazz = class {};
            const abstractMethod = () => {
                // EMPTY
            };
            Object.assign(
                clazz.prototype,
                _clazzOrMembers.reduce((members, member) => {
                    members[member as string] = abstractMethod;
                    return members;
                }, {} as Record<string | symbol, typeof abstractMethod>)
            );
        } else {
            clazz = _clazzOrMembers as unknown as RMIClassConstructor;
        }
        if (typeof remoteClassId !== 'string' || remoteClassId.length < 1) {
            throw new Error(`Incorrect classId: ${remoteClassId}`);
        }

        class cls extends clazz implements Remote {
            public readonly $namespace = new RMINamespace(uid(), channel.adaptor, this);
            public readonly $initPromise: Promise<void>;

            constructor(...args) {
                super(...args);
                channel.namespaces[this.$namespace.id] = this.$namespace;
                const getConstructorTransferable = options?.getConstructorTransferable;
                this.$initPromise = channel.get_method({
                    methodName: remoteClassId + '-new-instance',
                    transferables: getConstructorTransferable
                        ? (id, args) => {
                              return getConstructorTransferable(...args);
                          }
                        : undefined
                })(this.$namespace.id, args) as Promise<void>;
            }

            __destroy__() {
                return channel.destroyThat(this);
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
            const methodOptions: RemoteMethodOptions = Object.assign({}, method.options);
            const classLevelGetTransferable = options?.getTransferable;
            if (!methodOptions.transferables && classLevelGetTransferable) {
                methodOptions.transferables = (...args) => {
                    return classLevelGetTransferable(propertyName as keyof T, ...args);
                };
            }
            const metadata = new RMIMethodMetadata(propertyName, methodOptions);
            cls.prototype[propertyName] = function (this: cls, ...args) {
                return this.$initPromise.then(() => {
                    return this.$namespace.get_method(metadata).apply(this, args);
                });
            };
        });
        return cls as unknown as PromisifyClass<T & Remote>;
    }
    public def_class(id: string, clazz: AnyConstructor);
    public def_class(clazz: AnyConstructor);
    public def_class(...args) {
        const id = args[0] as string;
        const clazz = args[1] as AnyConstructor;

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
        methodNameOrmetadataOrOptions?: string | RMIMethodMetadata | GetRemoteMethodOptions,
        func?: F
    ): (this: T, ...args: Parameters<F>) => Promise<ReturnType<F>> {
        if (!methodNameOrmetadataOrOptions) {
            throw new TypeError(`Invalid Parameter Error: methodName: ${methodNameOrmetadataOrOptions}`);
        }
        const {
            metadata: inputMetadata,
            options,
            methodName
        } = this.resolveRemoteMethodOptions(methodNameOrmetadataOrOptions);
        let metadata = inputMetadata;
        if (!metadata) {
            metadata = new RMIMethodMetadata(
                methodName,
                Object.assign({}, (func as unknown as RMIMethod)?.options || {}, options || {})
            );
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

    public def_method<T extends AnyFunction = AnyFunction>(name: string, func: T);
    public def_method<T extends AnyFunction = AnyFunction>(func: T);
    public def_method(...args) {
        const name = args[0] as string;
        const func = args[1] as AnyFunction;
        if (typeof name !== 'string') {
            throw new Error('Illegal argument: name is not a string!');
        }
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
