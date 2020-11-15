export default class Defer<T> {
    private readonly _promise: Promise<T>;
    private _resolve!: (value?: T | PromiseLike<T> | undefined) => void;
    private _reject!: (reason?: unknown) => void;
    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    public get promise() {
        return this._promise;
    }
    public get resolve() {
        return this._resolve;
    }
    public get reject() {
        return this._reject;
    }
}
