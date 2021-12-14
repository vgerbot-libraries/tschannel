export interface Constructor<T> {
    readonly prototype: T;
    new (...args): T;
}

export class Channel {
    rclass<T>(remoteClassId?: string, _clazzOrMembers?: Constructor<T> | Array<keyof T>) {}
}
