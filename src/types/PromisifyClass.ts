import { Constructor } from './AnyConstructor';

export type PromisifyClass<T, K extends keyof T = keyof T> = Constructor<
    {
        [key in K]: T[K] extends (...args) => unknown
            ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]> extends Promise<infer P> ? P : ReturnType<T[K]>>
            : T[K];
    }
>;
