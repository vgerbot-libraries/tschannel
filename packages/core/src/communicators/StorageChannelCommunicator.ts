import { InvokeMethodData, Payload, Returning } from '../types';
import AbstractCommunicator from './AbstractCommunicator';
import { decode, encode } from '@vgerbot/msgpack-ext';

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
        console.error('btoa', e.newValue);
        const binaryString = atob(e.newValue);
        const binary = Uint8Array.from(binaryString, str => str.codePointAt(0)!);

        const data = decode(binary) as CommunicationData;
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
    send(payload: Payload): void {
        const data = payload.serialize();
        const uint8Array = encode(data);
        const binaryString = Array.from(uint8Array, byte => String.fromCodePoint(byte)).join('');
        const base64 = btoa(binaryString);
        this.storage.setItem(this.key, base64);
    }
    close(): void {
        this.storage.removeItem(this.key);
        this.messageReceivers.length = 0;
        window.removeEventListener('storage', this.storageEventListener);
    }
}
