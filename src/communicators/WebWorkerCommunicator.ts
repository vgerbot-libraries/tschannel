import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export class WebWorkerCommunicator extends AbstractMessageChannelCommunicator<Worker> {
    constructor(workerScriptURL: string, options?: WorkerOptions) {
        super(new Worker(workerScriptURL, options));
    }
    close(): void {
        this.target.terminate();
    }
}
