import { InvokeMethodPayload, MethodReturningPayload } from './foundation';
import { Communicator, InvokeMethodData, Returning } from './types';

export class Adaptor {
    constructor(private downline: Communicator, private upline: Communicator, private channelId: string) {
        this.downline.addReceiveMessageListener(data => {
            const payload = this.transformToPayload(data);
            this.upline.send(payload);
        });
        this.upline.addReceiveMessageListener(data => {
            const payload = this.transformToPayload(data);
            this.downline.send(payload);
        });
    }
    private transformToPayload(data: InvokeMethodData | Returning) {
        if (typeof data.success === 'boolean') {
            return this.transformReturningData(data as Returning);
        } else {
            return this.transformInvokeMethodData(data as InvokeMethodData);
        }
    }
    private transformReturningData(data: Returning): MethodReturningPayload {
        const returningData = Object.assign({}, data, {
            channelId: this.channelId
        }) as Returning;
        return new MethodReturningPayload(returningData, data.namespace, data.methodName);
    }
    private transformInvokeMethodData(data: InvokeMethodData): InvokeMethodPayload {
        const invokeMethodData = Object.assign({}, data, {
            channelId: this.channelId
        }) as InvokeMethodData;
        return new InvokeMethodPayload(invokeMethodData, [], data.namespace, data.methodName);
    }
    close() {
        this.downline.close();
        this.upline.close();
    }
}
