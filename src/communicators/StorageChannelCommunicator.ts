import { InvokeMethodData } from '../types/InvokeMethodData';
import Payload from '../types/Payload';
import { Returning } from '../types/Returning';
import { SerializableValue } from '../types/Serializable';
import AbstractCommunicator from './AbstractCommunicator';
import txon from 'txon';

type CommunicationData = InvokeMethodData | Returning;

export class StorageChannelCommunicator extends AbstractCommunicator {
    private key: string;
    constructor(private readonly storage: Storage, private readonly rmiId: string) {
        super();
        this.key = 'storage-communication-data-' + this.rmiId;
        window.addEventListener('storage', e => {
            if (!e.newValue) {
                return;
            }
            if (e.key !== this.key) {
                return;
            }
            const data = txon.parse(e.newValue) as CommunicationData;
            if (data.rmiId !== this.rmiId) {
                return;
            }
            this.messageReceivers.forEach(receiver => {
                receiver(data);
            });
        });
    }
    send(payload: Payload<SerializableValue>): void {
        const data = payload.serialize();
        const str = txon.stringify(data);
        this.storage.setItem(this.key, str);
    }
    close(): void {
        this.storage.removeItem(this.key);
        this.messageReceivers.length = 0;
    }
}
