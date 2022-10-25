import { RemoteMethodOptions } from '../../types/RemoteMethodOptions';

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
