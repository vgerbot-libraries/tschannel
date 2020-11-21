import * as Chai from 'chai';
import * as Sinon from 'sinon';

declare global {
    interface GlobalThis {
        expect: Chai.ExpectStatic;
        sinon: Sinon.SinonStatic;
    }
    const expect: Chai.ExpectStatic;
    const sinon: Sinon.SinonStatic;
}
