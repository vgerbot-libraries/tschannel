import { AnyConstructor } from './AnyConstructor';

export default function istatic<T extends AnyConstructor>() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function(constr: T) {
        //
    };
}
