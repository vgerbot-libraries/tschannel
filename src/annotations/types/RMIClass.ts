import { RMINamespace } from '../../foundation/RNamespace';

export interface RMIClass {
    $namespace: RMINamespace;
}

export interface RMIClassConstructor {
    new (...args): {};
    id: string;
}
