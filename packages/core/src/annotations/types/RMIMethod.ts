import { RemoteMethodOptions } from './RemoteMethodOptions';

export type RMIMethod =
    | {
          (...args): unknown;
          isLocal: false;
          options: RemoteMethodOptions;
      }
    | {
          (...args): unknown;
          isLocal: true;
          options: undefined;
      };
