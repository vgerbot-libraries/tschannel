import { ParameterType, rmethod, Channel } from '@vgerbot/channel';
import LocalCommunicator from '../common/communicator/LocalCommunicator';

describe('Remote method invocation', () => {
    let localCommunicator: LocalCommunicator;
    let remoteCommunicator: LocalCommunicator;
    let localChannel: Channel;
    let remoteChannel: Channel;
    beforeEach(() => {
        localCommunicator = new LocalCommunicator();
        remoteCommunicator = localCommunicator.createRemote();
        localChannel = new Channel('local', localCommunicator);
        remoteChannel = new Channel('local', remoteCommunicator);
    });
    afterEach(() => {
        localChannel.destroy();
        remoteChannel.destroy();
    });
    it('Should be called correctly in the Channel object with the same method name and the same Channel id', async () => {
        const method = sinon.spy();
        remoteChannel.def_method('method', method);

        await localChannel.get_method('method')();

        expect(method).to.be.calledOnce;

        const method2 = sinon.spy();

        remoteChannel.def_method('method2', method2);

        await localChannel.get_method('method2')(1);

        expect(method2).to.be.calledWith(1);

        const method3 = sinon.spy(sinon.fake.returns('hello'));

        remoteChannel.def_method('method3', method3);

        const ret = await localChannel.get_method('method3')();

        expect(ret).to.be.eq('hello');

        const fakeMethod4 = sinon.fake.throws('error-message');
        const method4 = sinon.spy(fakeMethod4);

        remoteChannel.def_method('method4', method4);
        const promise = localChannel.get_method('method4')();
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
        remoteChannel.def_class('Animal', DogImpl);

        const RemoteDogClass = localChannel.get_class<Animal>();

        const remoteDog = new RemoteDogClass('dog');

        await expect(remoteDog.getType()).to.be.eventually.become('dog');

        await expect(localChannel.release(remoteDog)).to.be.eventually.become(true);

        const remoteDogger = new RemoteDogClass('Dogger');

        await expect(remoteDogger.__release__()).to.be.eventually.become(true);
    });

    it('Should raise error when remote class not defined', async () => {
        interface Def {
            method();
        }

        const RemoteDef = localChannel.get_class<Def>();
        const instance = new RemoteDef();
        const promise = instance.method();
        await expect(promise).to.be.eventually.rejected;
    });

    it('Should raise error when remote method not exist', async () => {
        await expect(localChannel.get_method('unexistent-method')()).to.be.eventually.rejected;
    });

    it('Should handle callbacks correctly', async () => {
        interface MediaProcessor {
            downloadAndParse(url: string, receive: (data: ArrayBuffer, offset: number, total: number) => void);
        }
        class MediaProcessorImpl implements MediaProcessor {
            downloadAndParse(url: string, receive: (data: ArrayBuffer, offset: number, total: number) => void) {
                for (let i = 0; i < 5; i++) {
                    receive(new ArrayBuffer(10), i, 5);
                }
            }
        }
        remoteChannel.def_class('MediaProcessor', MediaProcessorImpl);

        const RemoteMediaProcessorImpl = localChannel.get_class<MediaProcessor>();

        const processor = new RemoteMediaProcessorImpl();

        const callback = sinon.spy();

        await processor.downloadAndParse('http://url', callback);

        expect(callback).to.be.called;
        expect(callback).to.be.callCount(5);
    });

    it('Should paramTypes of @rmethod() option work correctly', async () => {
        function method(data: string, callback: (data: string) => void) {
            callback(data);
        }
        rmethod({
            paramTypes: [ParameterType.serializable, ParameterType.callback]
        })(
            {
                m: method
            },
            'm'
        );
        const receiver = sinon.spy();
        remoteCommunicator.addReceiveMessageListener(receiver);
        remoteChannel.def_method('method', method);
        const callback = sinon.spy();
        await localChannel.get_method('method', method)('data', callback);

        expect(callback).to.be.calledOnce;
        expect(typeof receiver.args[0][0]).not.to.be.eql('function');
        expect(callback.args[0][0]).to.be.eql('data');
    });

    it('Should raise an error when register multiple local classes with same id', () => {
        remoteChannel.def_class('computer', class Computer {});
        const callback = sinon.spy(() => {
            remoteChannel.def_class('computer', class Computer {});
        });
        expect(callback).to.throw();
    });
    it('Should raise an error when release an illegal remote instance', async () => {
        await expect(localChannel.release({})).to.be.eventually.rejected;
    });
    it('Should handle the asynchrounous methods correctly', async () => {
        interface FileStorage {
            read(): Promise<ArrayBuffer>;
        }
        // ========================== remote ==========================
        const mockFileData = new ArrayBuffer(10);
        class FileStorageImpl implements FileStorage {
            read(): Promise<ArrayBuffer> {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(mockFileData);
                    }, 100);
                });
            }
        }
        remoteChannel.def_class('FileStorage', FileStorageImpl);
        // ========================== remote end ==========================

        // ========================== local ==========================

        const RemoteFileStorage = localChannel.get_class<FileStorage>('FileStorage');

        const storage = new RemoteFileStorage();

        const promise = storage.read();
        // ========================== local end ==========================

        await expect(promise).to.be.eventually.become(mockFileData);
    });

    it('Should work correctly to pass remote objects', async () => {
        class A {}
        class B {
            method(a: A) {
                return a instanceof A;
            }
        }
        remoteChannel.def_class('A', A);
        remoteChannel.def_class('B', B);

        const RemoteA = localChannel.get_class<A>();
        const RemoteB = localChannel.get_class<B>();

        const remoteA = new RemoteA();
        const remoteB = new RemoteB();

        await expect(remoteB.method(remoteA)).to.become(true);
    });

    it('Should get_class() work correctly using the member name array', async () => {
        interface RemoteAPI {
            method1(): string;
            method2(): string;
        }
        localChannel.def_class(
            'RemoteAPI',
            class implements RemoteAPI {
                method1() {
                    return 'method1';
                }
                method2() {
                    return 'method2';
                }
            }
        );
        const RemoteAPIImpl = remoteChannel.get_class<RemoteAPI>('RemoteAPI', ['method1', 'method2']);

        const instance = new RemoteAPIImpl();
        await expect(instance.method1()).to.become('method1');
        await expect(instance.method2()).to.become('method2');
    });
});
