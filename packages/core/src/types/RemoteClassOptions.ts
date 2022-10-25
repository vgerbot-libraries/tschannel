export interface RemoteClassOptions<T> {
    getConstructorTransferable?: (...args) => Transferable[];
    getTransferable?:(methodName: keyof T, ...args) => Transferable[];
}
