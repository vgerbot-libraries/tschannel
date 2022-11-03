import { RemoteMethodOptions } from '../../types/RemoteMethodOptions';

export type RMIMethod =
    | {
          (...args): unknown;
          isLocal: false;
          options: Omit<RemoteMethodOptions, 'methodName'>;
      }
    | {
          (...args): unknown;
          isLocal: true;
          options: undefined;
      };
