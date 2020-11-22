import { rclass, RMI } from '../../src';
import LocalCommunicator from '../fixtures/communicator/LocalCommunicator';

describe('Remote method invocation', () => {
    let localCommunicator: LocalCommunicator;
    let remoteCommunicator: LocalCommunicator;
    let localRMI: RMI;
    let remoteRMI: RMI;
    beforeEach(() => {
        localCommunicator = new LocalCommunicator();
        remoteCommunicator = localCommunicator.createRemote();
        localRMI = new RMI('local', localCommunicator);
        remoteRMI = new RMI('local', remoteCommunicator);
    });
    afterEach(() => {
        localRMI.destroy();
        remoteRMI.destroy();
    });
    it('Should be called correctly in the RMI object with the same method name and the same RMI id', async () => {
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
        const promise = localRMI.rmethod('method4')();
        await promise.catch((reason: Error) => {
            const remoteError = fakeMethod4.exceptions[0] as Error;
            expect(method4).to.been.thrown(remoteError);
            expect(reason.message).to.be.equal(remoteError.message);
            expect(reason.stack).to.be.equal(remoteError.stack);
        });
    });
    it('Should create remote instance correctly', async () => {
        interface Animal {
            getType(): string;
        }
        class DogImpl implements Animal {
            constructor(private type: string) {}
            public getType() {
                return this.type;
            }
        }
        remoteRMI.lclass('Animal', DogImpl);
        @rclass({
            id: 'Animal'
        })
        class Dog implements Animal {
            getType(): string {
                throw new Error('Method not implemented.');
            }
        }
        const RemoteDogClass = localRMI.rclass(Dog);

        const remoteDog = new RemoteDogClass('dog');

        await expect(remoteDog.getType()).to.be.eventually.become('dog');

        await expect(localRMI.release(remoteDog)).to.be.eventually.become(true);
    });
});
