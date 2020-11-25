export interface MessageChannel {
    postMessage(message: any, transfer?: Transferable[]): void;
    addEventListener<K extends keyof MessagePortEventMap>(
        type: K,
        listener: (this: MessagePort, ev: MessagePortEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof MessagePortEventMap>(
        type: K,
        listener: (this: MessagePort, ev: MessagePortEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
    ): void;
}
