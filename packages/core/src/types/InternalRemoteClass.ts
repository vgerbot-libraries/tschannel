import { RMINamespace } from '../foundation';

export interface InternalRemoteClass {
    $initPromise: Promise<void>;
    $namespace: RMINamespace;
}
