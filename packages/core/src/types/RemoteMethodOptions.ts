import { ParameterType } from './ParameterType';
import { Transferable } from './Transferable';

export interface RemoteMethodOptions {
    paramTypes?: ParameterType[];
    transferables?: (this: void, ...args) => Transferable[];
}

export type GetRemoteMethodOptions = RemoteMethodOptions & { methodName: string };
