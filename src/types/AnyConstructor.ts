export interface AnyConstructor {
    new (...args): {};
}

export interface Constructor<T> {
    readonly prototype: T;
    new (...args): T;
}
