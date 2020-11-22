import { Communicator } from '../types/Communicator';
import Payload from '../types/Payload';
import { SerializableValue } from '../types/Serializable';
import AbstractCommunicator from './AbstractCommunicator';

export default class IframeCommunicator extends AbstractCommunicator implements Communicator {
    constructor(private targetWindow: Window, private targetOrigin: string) {
        super();
        targetWindow.addEventListener('message', e => {
            // TODO:
            console.info(e);
        });
    }
    send(payload: Payload<SerializableValue>): void {
        this.targetWindow.postMessage(payload.serialize(), this.targetOrigin, payload.transferables());
    }
    close(): void {
        //
    }
}
