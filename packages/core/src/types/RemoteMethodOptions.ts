import { ParameterType } from './ParameterType';
import { Transferable } from './Transferable';

export interface RemoteMethodOptions {
    methodName?: string;
    paramTypes?: ParameterType[];
    transferables?: (this: void, ...args) => Transferable[];
}
