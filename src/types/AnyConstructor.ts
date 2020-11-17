export interface AnyConstructor {
    new (...args): {};
}

export interface Constructor<T> {
    new (...args): T;
}
