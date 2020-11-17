import { RMINamespace } from '../../foundation/RNamespace';

export interface RMIClass {
    $namespace: RMINamespace;
}

export interface RMIClassConstructor<T = RMIClass> {
    new (...args): T;
    id: string;
}
