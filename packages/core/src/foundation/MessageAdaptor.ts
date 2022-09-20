import Defer from '../common/Defer';
import uid from '../common/uid';
import { RMIMethodMetadata } from '../metadata/RMIMethodMetadata';
import { Communicator } from '../types/Communicator';
import { InvokeMethodData } from '../types/InvokeMethodData';
import { Returning } from '../types/Returning';
import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';
import { CallbackParameter } from './CallbackParameter';
import InvokeMethodPayload from './InvokeMethodPayload';
import MethodReturningPayload from './MethodReturningPayload';
import { RemoteError } from './RemoteError';
import { isRemoteInstance } from './RemoteInstance';
import { RMINamespace } from './RNamespace';

export default class MessageAdaptor {
    private readonly deferes: Record<string, Defer<unknown>> = {};
    private readonly removeMessageReceiver: () => void;
    private isDestroyed: boolean = false;
    constructor(
        private readonly channelId: string,
        private readonly communicator: Communicator,
        private readonly namespaces: Record<string, RMINamespace>
    ) {
        this.removeMessageReceiver = communicator.addReceiveMessageListener(message => {
            /* istanbul ignore if */
            if (message.channelId !== this.channelId) {
                return;
            }
            if (InvokeMethodPayload.isInvokeMethodData(message)) {
                this.handleInvokeMethodData(message);
            } else {
                this.handleReturningData(message);
            }
        });
    }
    public invoke(
        namespace: string,
        methodName: string,
        parameters: SerializableValue,
        transferables: Transferable[]
    ): Promise<unknown> {
        if (this.isDestroyed) {
            throw new Error('The message channel has been destroyed!');
        }
        const callId = uid('call-xxxx');
        const data: InvokeMethodData = {
            channelId: this.channelId,
            namespace,
            methodName,
            callId,
            parameters
        };
        const payload = new InvokeMethodPayload(data, transferables, namespace, methodName);
        const defer = new Defer();
        this.deferes[callId] = defer;
        this.communicator.send(payload);
        return defer.promise;
    }
    public throwError(callId: string, error: Error, namespace: string, methodName: string) {
        const payload = new MethodReturningPayload(
            {
                channelId: this.channelId,
                success: false,
                callId,
                error: {
                    name: error.name,
                    stack: error.stack || '',
                    message: error.message
                },
                namespace,
                methodName
            },
            namespace,
            methodName
        );
        this.communicator.send(payload);
    }
    public returnValue(callId: string, value: SerializableValue, namespace: string, methodName: string) {
        const payload = new MethodReturningPayload(
            {
                channelId: this.channelId,
                success: true,
                callId,
                value,
                namespace,
                methodName
            },
            namespace,
            methodName
        );
        this.communicator.send(payload);
    }
    public waitForAllReturn() {
        return Promise.all(
            Object.keys(this.deferes)
                .map(key => this.deferes[key].promise)
        );
    }
    public destroy() {
        this.removeMessageReceiver();
        const destroyedError = new Error('Message adaptor destroyed!');
        Object.keys(this.deferes).forEach(key => {
            const defer = this.deferes[key];
            defer.reject(destroyedError);
        });
        this.communicator.close();
        this.isDestroyed = true;
    }
    private handleReturningData(message: Returning) {
        if (this.isDestroyed) {
            return;
        }
        const defer = this.deferes[message.callId];
        if (!defer) {
            return;
        }
        if (message.success) {
            defer.resolve(message.value);
        } else {
            defer.reject(new RemoteError(message.error));
        }
        delete this.deferes[message.callId];
    }
    private handleInvokeMethodData(message: InvokeMethodData) {
        const { namespace: ns, methodName, callId } = message;
        const namespace = this.namespaces[ns];
        if (!namespace) {
            return this.throwError(callId, new Error(`namespace not exist: ${ns}`), ns, methodName);
        }
        const method = namespace.def_method(methodName);
        if (typeof method !== 'function') {
            return this.throwError(
                callId,
                new Error(`Method not exit: namespace: ${ns}, methodName: ${methodName}`),
                ns,
                methodName
            );
        }
        const parameters = message.parameters;
        if (!Array.isArray(parameters)) {
            throw new Error('Unexpected parameters array: ' + parameters);
        }
        const args = this.normalizeArguments(parameters);
        try {
            const retValue = method(...args);
            if (retValue instanceof Promise) {
                retValue.then(
                    (value: SerializableValue) => {
                        this.returnValue(callId, value, ns, methodName);
                    },
                    reason => {
                        this.throwError(callId, reason, ns, methodName);
                    }
                );
            } else {
                this.returnValue(callId, retValue as SerializableValue, ns, methodName);
            }
        } catch (error) {
            this.throwError(callId, error as Error, ns, methodName);
        }
    }
    private normalizeArguments(parameters: SerializableValue[]) {
        return parameters.map(it => {
            if (CallbackParameter.isCallback(it)) {
                return this.createCallback(it.namespace, it.id);
            } else if (isRemoteInstance(it)) {
                return this.namespaces[it.id]?.getOriginObject();
            }
            return it;
        });
    }
    private createCallback(ns: string, id: string) {
        const namespace = this.namespaces[ns];
        return namespace.get_method(new RMIMethodMetadata(id, {}));
    }
}
