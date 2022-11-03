export interface RemoteClassOptions<T> {
    remoteClassId: string;
    getConstructorTransferable?: (...args) => Transferable[];
    getTransferable?: (methodName: keyof T, ...args) => Transferable[];
}
