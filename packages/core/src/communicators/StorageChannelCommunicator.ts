import txon from 'txon';
import { InvokeMethodData, Payload, Returning, SerializableValue } from '../types';
import AbstractCommunicator from './AbstractCommunicator';

type CommunicationData = InvokeMethodData | Returning;

export class StorageChannelCommunicator extends AbstractCommunicator {
    private key: string;
    private storageEventListener = (e: StorageEvent) => {
        if (!e.newValue) {
            return;
        }
        if (e.key !== this.key) {
            return;
        }
        const data = txon.parse(e.newValue) as CommunicationData;
        if (data.channelId !== this.channelId) {
            return;
        }
        this.messageReceivers.forEach(receiver => {
            receiver(data);
        });
    };
    constructor(private readonly storage: Storage, private readonly channelId: string) {
        super();
        this.key = 'storage-communication-data-' + this.channelId;
        window.addEventListener('storage', this.storageEventListener);
    }
    send(payload: Payload<SerializableValue>): void {
        const data = payload.serialize();
        const str = txon.stringify(data);
        this.storage.setItem(this.key, str);
    }
    close(): void {
        this.storage.removeItem(this.key);
        this.messageReceivers.length = 0;
        window.removeEventListener('storage', this.storageEventListener);
    }
}
