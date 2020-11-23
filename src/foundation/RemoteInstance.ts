import { SerializableObject } from '../types/Serializable';

const REMOTE_INSTANCE_SYMBOLE = 'is-remote-instance';

export class RemoteInstance {
    public id: string;
    constructor(remoteObject) {
        this.id = remoteObject.$namespace.id;
        this[REMOTE_INSTANCE_SYMBOLE] = true;
    }
}

export function isRemoteInstance(object): object is RemoteInstance {
    return !!object[REMOTE_INSTANCE_SYMBOLE];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RemoteInstance extends SerializableObject {}
