export const RMI_ID = 'parallel-rmi';

export function hex(arrayBuffer: ArrayBuffer, byteOffset: number, length: number): string[] {
    const end = Math.min(arrayBuffer.byteLength, byteOffset + length);
    const arr = new Uint8Array(arrayBuffer);
    const result: string[] = [];
    for (let i = byteOffset; i < end; i++) {
        result.push(('00' + arr[i].toString(16)).slice(-2));
    }
    return result;
}
