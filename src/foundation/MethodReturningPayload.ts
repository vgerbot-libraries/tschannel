import Payload from '../types/Payload';
import { Returning } from '../types/Returning';
import { Transferable } from '../types/Transferable';

export default class MethodReturningPayload implements Payload<Returning> {
    constructor(private readonly data: Returning) {}
    newPayload(data: Returning): Payload<Returning> {
        return new MethodReturningPayload(data);
    }
    serialize(): Returning {
        return this.data;
    }
    transferables(): Transferable[] {
        return [];
    }
}
