import LocalCommunicator from 'common/communicator/LocalCommunicator';
import { Channel, ParameterType, rmethod } from '../../../src';
import { Adaptor } from '../../../src/Adaptor';

describe('channel adaptor', () => {
    let localCommunicator: LocalCommunicator;
    let downlineCommunicator: LocalCommunicator;
    let uplineCommunicator: LocalCommunicator;
    let remoteCommunicator: LocalCommunicator;
    let localChannel: Channel;
    let remoteChannel: Channel;
    let adaptor: Adaptor;
    beforeEach(() => {
        localCommunicator = new LocalCommunicator();
        downlineCommunicator = localCommunicator.createRemote();
        uplineCommunicator = new LocalCommunicator();
        remoteCommunicator = uplineCommunicator.createRemote();
        Object.assign(localCommunicator, {
            name: 'local communicator'
        });
        Object.assign(downlineCommunicator, {
            name: 'downline communicator'
        });
        Object.assign(uplineCommunicator, {
            name: 'upline communicator'
        });
        Object.assign(remoteCommunicator, {
            name: 'remote communicator'
        });
        localChannel = new Channel('local', localCommunicator);
        remoteChannel = new Channel('local', remoteCommunicator);
        Object.assign(localChannel, {
            name: 'local channel'
        });
        Object.assign(remoteChannel, {
            name: 'remote channel'
        });
        adaptor = new Adaptor(downlineCommunicator, uplineCommunicator, 'local');
    });
    afterEach(() => {
        localChannel.destroy();
        remoteChannel.destroy();
        adaptor.close();
    });

    it('Should be called correctly in the Channel object with the same method name and the same Channel id', async () => {
        const method = sinon.spy();
        remoteChannel.lmethod('method', method);

        await localChannel.rmethod('method')();

        expect(method).to.be.calledOnce;

        const method2 = sinon.spy();

        remoteChannel.lmethod('method2', method2);

        await localChannel.rmethod('method2')(1);

        expect(method2).to.be.calledWith(1);

        const method3 = sinon.spy(sinon.fake.returns('hello'));

        remoteChannel.lmethod('method3', method3);

        const ret = await localChannel.rmethod('method3')();

        expect(ret).to.be.eq('hello');

        const fakeMethod4 = sinon.fake.throws('error-message');
        const method4 = sinon.spy(fakeMethod4);

        remoteChannel.lmethod('method4', method4);
        const promise = localChannel.rmethod('method4')();
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
        remoteChannel.lclass('Animal', DogImpl);

        const RemoteDogClass = localChannel.rclass<Animal>();

        const remoteDog = new RemoteDogClass('dog');

        await expect(remoteDog.getType()).to.be.eventually.become('dog');

        await expect(localChannel.release(remoteDog)).to.be.eventually.become(true);
    });

    it('Should raise error when remote class not defined', async () => {
        interface Def {
            method();
        }

        const RemoteDef = localChannel.rclass<Def>('nonexistent-remote-class');
        const instance = new RemoteDef();
        const promise = instance.method();
        await expect(promise).to.be.eventually.rejected;
    });

    it('Should raise error when remote method not exist', async () => {
        await expect(localChannel.rmethod('unexistent-method')()).to.be.eventually.rejected;
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
        remoteChannel.lclass('MediaProcessor', MediaProcessorImpl);

        const RemoteMediaProcessorImpl = localChannel.rclass<MediaProcessor>();

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
        remoteChannel.lmethod('method', method);
        const callback = sinon.spy();
        await localChannel.rmethod('method', method)('data', callback);

        expect(callback).to.be.calledOnce;
        expect(typeof receiver.args[0][0]).not.to.be.eql('function');
        expect(callback.args[0][0]).to.be.eql('data');
    });

    it('Should raise an error when register multiple local classes with same id', () => {
        remoteChannel.lclass('computer', class Computer {});
        const callback = sinon.spy(() => {
            remoteChannel.lclass('computer', class Computer {});
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
        remoteChannel.lclass('FileStorage', FileStorageImpl);
        // ========================== remote end ==========================

        // ========================== local ==========================

        const RemoteFileStorage = localChannel.rclass<FileStorage>();

        const storage = new RemoteFileStorage();

        const promise = storage.read();
        // ========================== local end ==========================

        await expect(promise).to.be.eventually.become(mockFileData);
    });

    it('Should work correctly to pass remote objects', async () => {
        class A {}
        class B {
            method(a: A) {
                console.info(a);
                return a instanceof A;
            }
        }
        remoteChannel.lclass('A', A);
        remoteChannel.lclass('B', B);

        // class BDef {
        //     @rmethod({
        //         paramTypes: [ParameterType.remoteObject]
        //     })
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //     method(_: A): boolean {
        //         throw new Error('Method not implemented');
        //     }
        // }
        const RemoteA = localChannel.rclass<A>();
        const RemoteB = localChannel.rclass<B>();

        const remoteA = new RemoteA();
        const remoteB = new RemoteB();

        await expect(remoteB.method(remoteA)).to.become(true);
    });
});
