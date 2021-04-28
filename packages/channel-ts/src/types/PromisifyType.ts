import { Constructor } from './AnyConstructor';

export type PromisifyFunction<F> = F extends (...args: infer P) => infer R
    ? (...args: P) => Promise<R extends Promise<infer P> ? P : R>
    : F;

type FilterOutAttributes<Base> = {
    [Key in keyof Base]: Base[Key] extends (...args) => unknown ? Base[Key] : never;
};

export type PromisifyClass<P> = Constructor<PromisifyObject<P>>;

export type PromisifyObject<P, T extends { [key: string]: (...args) => unknown } = FilterOutAttributes<P>> = {
    [Key in keyof T]: ReturnType<T[Key]> extends Promise<unknown> ? T[Key] : PromisifyFunction<T[Key]>;
};
