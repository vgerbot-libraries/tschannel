import { Channel } from './Channel';
import { WindowChannelCommunicator } from './communicators/WindowChannelCommunicator';
import { StorageChannelCommunicator } from './communicators/StorageChannelCommunicator';
import { WebWorkerCommunicator } from './communicators/WebWorkerCommunicator';
import { WebWorkerScopeCommunicator } from './communicators/WebWorkerScopeCommunicator';
import { Communicator } from './types/Communicator';
import { CommunicationData } from './types/CommunicationData';
import {
    ParallelCommunicator,
    ParallelDataCombiner,
    ParallelDataDistributor
} from './communicators/ParallelCommunicator';

interface ChannelFactory {
    create(): Channel;
}

function createChannel(channelId: string, communicator: Communicator) {
    return new Channel(channelId, communicator);
}

class WindowChannelChainGenerator implements ChannelFactory {
    constructor(
        private readonly channelId: string,
        private readonly win: Window,
        private readonly targetOrigin: string = '*'
    ) {}
    origin(targetOrigin: string = '*'): ChannelFactory {
        return new WindowChannelChainGenerator(this.channelId, this.win, targetOrigin);
    }
    create() {
        return createChannel(this.channelId, communicators.windowChannel(this.win, this.targetOrigin));
    }
}

class StorageChannelChainGenerator implements ChannelFactory {
    constructor(private readonly channelId: string, private readonly storage: Storage) {}
    create() {
        return createChannel(this.channelId, communicators.storage(this.storage, this.channelId));
    }
}

class WebWorkerChannelChainGenerator implements ChannelFactory {
    constructor(
        private readonly channelId: string,
        private readonly workerScriptURL: string,
        private readonly workerOptions?: WorkerOptions
    ) {}
    options(opts: WorkerOptions): ChannelFactory {
        return new WebWorkerChannelChainGenerator(this.channelId, this.workerScriptURL, opts);
    }
    create() {
        return createChannel(this.channelId, communicators.webWorker(this.workerScriptURL, this.workerOptions));
    }
}

class ParallelChannelChainGenerator {
    constructor(private readonly channelId: string, private readonly communicators: Communicator[]) {}
    distributor(distributorFn: ParallelDataDistributor<CommunicationData>) {
        return new ParallelChannelChainGenerator_Combiner(this.channelId, this.communicators, distributorFn);
    }
}

class ParallelChannelChainGenerator_Combiner {
    constructor(
        private readonly channelId: string,
        private readonly communicators: Communicator[],
        private readonly distributorFn: ParallelDataDistributor<CommunicationData>
    ) {}
    combiner(combinerFn: ParallelDataCombiner): ChannelFactory {
        return {
            create: () => {
                return createChannel(
                    this.channelId,
                    communicators.parallel(this.communicators, this.distributorFn, combinerFn)
                );
            }
        };
    }
}

export function channel(channelId: string) {
    return {
        connectToOtherWindow(targetWindow: Window) {
            return new WindowChannelChainGenerator(channelId, targetWindow);
        },
        connectViaStorage(storage: Storage) {
            return new StorageChannelChainGenerator(channelId, storage);
        },
        connectToWorker(workerScriptURL: string) {
            return new WebWorkerChannelChainGenerator(channelId, workerScriptURL);
        },
        connectToMainThread(): ChannelFactory {
            return {
                create() {
                    return createChannel(channelId, communicators.webWorkerScope());
                }
            };
        },
        parallel<T extends Communicator>(parallels: number, generator: (index: number) => T) {
            const communicators = Array(parallels)
                .fill(undefined)
                .map((_, index) => generator(index));
            return new ParallelChannelChainGenerator(channelId, communicators);
        }
    };
}

export const communicators = {
    windowChannel(targetWindow: Window, targetOrigin: string = '*') {
        return new WindowChannelCommunicator(targetWindow, targetOrigin);
    },
    storage(targetStorage: Storage, channelId: string) {
        return new StorageChannelCommunicator(targetStorage, channelId);
    },
    webWorker(workerScriptURL: string, options?: WorkerOptions) {
        return new WebWorkerCommunicator(workerScriptURL, options);
    },
    webWorkerScope() {
        return new WebWorkerScopeCommunicator();
    },
    parallel(
        communicators: Communicator[],
        distributorFn: ParallelDataDistributor<CommunicationData>,
        combinerFn: ParallelDataCombiner
    ) {
        return new ParallelCommunicator(communicators, distributorFn, combinerFn);
    }
};
