import { RMI } from '../../src';
import LocalCommunicator from '../fixtures/communicator/LocalCommunicator';

describe('Remote method invocation', () => {
    let localCommunicator;
    let remoteCommunicator;
    beforeEach(() => {
        localCommunicator = new LocalCommunicator();
        remoteCommunicator = localCommunicator.createRemote();
    });
    it('Should be called correctly in the RMI object with the same method name and the same RMI id', async () => {
        const localRMI = new RMI('local', localCommunicator);
        const remoteRMI = new RMI('local', remoteCommunicator);
        const method = sinon.spy();
        remoteRMI.lmethod('method', method);

        await localRMI.rmethod('method')();

        expect(method).to.be.calledOnce;

        const method2 = sinon.spy();

        remoteRMI.lmethod('method2', method2);

        await localRMI.rmethod('method2')(1);

        expect(method2).to.be.calledWith(1);

        const method3 = sinon.spy(sinon.fake.returns('hello'));

        remoteRMI.lmethod('method3', method3);

        const ret = await localRMI.rmethod('method3')();

        expect(ret).to.be.eq('hello');

        const fakeMethod4 = sinon.fake.throws('error-message');
        const method4 = sinon.spy(fakeMethod4);

        remoteRMI.lmethod('method4', method4);
        try {
            await localRMI.rmethod('method4')();
        } catch (e) {}
        expect(method4).to.been.thrown(fakeMethod4.exceptions[0]);
    });
});
