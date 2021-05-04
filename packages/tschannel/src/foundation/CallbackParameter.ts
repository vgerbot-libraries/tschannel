import { SerializableObject, SerializableValue } from '../types/Serializable';

const CALLBACK_PARAMETER_SYMBOLE = 'is-callback-parameter';

export class CallbackParameter {
    constructor(public namespace: string, public readonly id: string) {
        this[CALLBACK_PARAMETER_SYMBOLE] = true;
    }
    static isCallback(value: SerializableValue): value is CallbackParameter {
        return !!value && !!(value as Object)[CALLBACK_PARAMETER_SYMBOLE];
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CallbackParameter extends SerializableObject {}
