export type PromisifyClass<T, K extends keyof T = keyof T> = {
    [key in K]: T[K] extends (...args) => unknown ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>> : T[K];
};
