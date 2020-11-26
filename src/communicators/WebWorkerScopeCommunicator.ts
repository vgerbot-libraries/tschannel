import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WebWorkerScopeCommunicator extends AbstractMessageChannelCommunicator<typeof globalThis> {
    constructor() {
        super(globalThis);
    }
}
