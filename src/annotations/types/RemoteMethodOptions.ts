import { ParameterType } from '../../types/ParameterType';
import { Transferable } from '../../types/Transferable';

export interface RemoteMethodOptions {
    methodName?: string;
    namespace?: string;
    paramTypes?: ParameterType[];
    transferables?: (this: void, ...args) => Transferable[];
}
