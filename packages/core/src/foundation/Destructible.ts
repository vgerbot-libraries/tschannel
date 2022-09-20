export interface Destructible {
    __destroy__(): Promise<void> | void;
}
