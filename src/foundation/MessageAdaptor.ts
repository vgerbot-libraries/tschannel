import Defer from '../common/Defer';
import uid from '../common/uid';
import { RMIMethodMetadata } from '../metadata/RMIMethodMetadata';
import { Communicator } from '../types/Communicator';
import { InvokeMethodData } from '../types/InvokeMethodData';
import { SerializableValue } from '../types/Serializable';
import { Transferable } from '../types/Transferable';
import { CallbackParameter } from './CallbackParameter';
import InvokeMethodPayload from './InvokeMethodPayload';
import MethodReturningPayload from './MethodReturningPayload';
import { RMINamespace } from './RNamespace';

export default class MessageAdaptor {
    private readonly deferes: Record<string, Defer<unknown>> = {};
    private readonly removeMessageReceiver: () => void;
    constructor(
        private readonly rmiId: string,
        private readonly communicator: Communicator,
        private readonly namespaces: Record<string, RMINamespace>
    ) {
        this.removeMessageReceiver = communicator.addReceiveMessageListener(message => {
            if (message.rmiId !== this.rmiId) {
                return;
            }
            if (InvokeMethodPayload.isInvokeMethodData(message)) {
                const { namespace: ns, methodName, callId } = message;
                const namespace = namespaces[ns];
                if (!namespace) {
                    this.throwError(callId, new Error(`namespace not exist: ${ns}`));
                    return;
                }
                const method = namespace.lmethod(methodName);
                if (typeof method !== 'function') {
                    this.throwError(callId, new Error(`Method not exit: namespace: ${ns}, methodName: ${methodName}`));
                    return;
                }
                const parameters = message.parameters;
                if (Array.isArray(parameters)) {
                    const args = parameters.map(it => {
                        if (CallbackParameter.isCallback(it)) {
                            return this.createCallback(it.namespace, it.id);
                        }
                        return it;
                    });
                    const retValue = method(...args);
                    this.returnValue(callId, retValue as SerializableValue);
                }
            } else {
                const defer = this.deferes[message.callId];
                if (message.success) {
                    defer.resolve(message.value);
                } else {
                    defer.reject(message.error);
                }
                delete this.deferes[message.callId];
            }
        });
    }
    public invoke(
        namespace: string,
        methodName: string,
        parameters: SerializableValue,
        transferables: Transferable[]
    ): Promise<unknown> {
        const callId = uid('call-xxxx');
        const data: InvokeMethodData = {
            rmiId: this.rmiId,
            namespace,
            methodName,
            callId,
            parameters
        };
        const payload = new InvokeMethodPayload(data, transferables);
        const defer = new Defer();
        this.deferes[callId] = defer;
        this.communicator.send(payload);
        return defer.promise;
    }
    public throwError(callId: string, error: Error) {
        const payload = new MethodReturningPayload({
            rmiId: this.rmiId,
            success: false,
            callId,
            error: {
                stack: error.stack || '',
                message: error.message
            }
        });
        this.communicator.send(payload);
    }
    public returnValue(callId: string, value: SerializableValue) {
        const payload = new MethodReturningPayload({
            rmiId: this.rmiId,
            success: true,
            callId,
            value
        });
        this.communicator.send(payload);
    }
    public destroy() {
        this.removeMessageReceiver();
        const destroyedError = new Error('Message adaptor destroyed!');
        Object.keys(this.deferes).forEach(key => {
            const defer = this.deferes[key];
            defer.reject(destroyedError);
            delete this.deferes[key];
        });
        this.communicator.close();
    }
    private createCallback(ns: string, id: string) {
        const namespace = this.namespaces[ns];
        return namespace.rmethod(new RMIMethodMetadata(id, {}));
    }
}
