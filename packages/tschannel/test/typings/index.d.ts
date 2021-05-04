import * as Chai from 'chai';
import * as Sinon from 'sinon';
import istanbul from 'istanbul-lib-coverage';

interface ContextKarma {
    complete(options: { coverage: istanbul.CoverageMapData }): void;
}

declare global {
    const expect: Chai.ExpectStatic;
    const sinon: Sinon.SinonStatic;

    // export const globalThis: GlobalThis;
    const __karma__: ContextKarma;
    const __coverage__: istanbul.CoverageMapData;
}

declare module 'globalThis' {
    export const __coverage__: istanbul.CoverageMapData;
}
