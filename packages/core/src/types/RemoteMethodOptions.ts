import { ParameterType } from './ParameterType';

export interface RemoteMethodOptions {
    paramTypes?: ParameterType[];
}

export type GetRemoteMethodOptions = RemoteMethodOptions & { methodName: string };
