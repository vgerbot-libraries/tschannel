import AbstractMessageChannelCommunicator from './AbstractMessageChannelCommunicator';

export default class WebWorkerCommunicator extends AbstractMessageChannelCommunicator<Worker> {
    constructor(workerScriptURL: string, options?: WorkerOptions) {
        super(new Worker(workerScriptURL, options));
        this.target.addEventListener('message', e => {
            this.messageReceivers.forEach(receiver => {
                receiver(e.data);
            });
        });
    }
    close(): void {
        this.target.terminate();
    }
}
