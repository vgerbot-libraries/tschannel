import { AnyConstructor } from '../types/AnyConstructor';
import { RMIClassConstructor } from './types/RMIClass';

export function rclass(options: { id: string }) {
    return function(constructor: AnyConstructor) {
        (constructor as RMIClassConstructor).id = options.id;
    };
}
