import { Transferable } from './Transferable';

type SimpleSerializable =
    | number
    | string
    | boolean
    | undefined
    | null
    | ArrayBuffer
    | SharedArrayBuffer
    | ArrayBufferView
    | ImageBitmap
    | ImageData
    | Date
    | File
    | Transferable
    | FileList;

export interface SerializableObject {
    [key: string]: SimpleSerializable | SimpleSerializable[] | SerializableValue | SerializableValue[];
    [key: number]: SimpleSerializable | SimpleSerializable[] | SerializableValue | SerializableValue[];
}

export type SerializableValue = SerializableObject | SimpleSerializable | SimpleSerializable[] | Error;
