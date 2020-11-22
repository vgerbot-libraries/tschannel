import { Returning } from '../types/Returning';

export class RemoteError extends Error {
    constructor(error: Returning['error']) {
        super(error?.message);
        this.name = error?.name || 'RemoteError';
        this.stack = error?.stack;
    }
}
