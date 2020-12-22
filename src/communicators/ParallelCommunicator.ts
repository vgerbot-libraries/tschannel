import { CommunicationData } from '../types/CommunicationData';
import { Communicator } from '../types/Communicator';
import Payload from '../types/Payload';
import { Returning } from '../types/Returning';
import AbstractCommunicator from './AbstractCommunicator';

export type ParallelDataDistributor<T extends CommunicationData> = (no: number, payload: Payload<T>) => Payload<T>;
export type ParallelDataCombiner = (data: Returning[]) => Returning;

interface CachedParallelData {
    returned: number;
    returns: Returning[];
}

export class ParallelCommunicator extends AbstractCommunicator implements Communicator {
    private communicationDataCache: Record<string, CachedParallelData> = {};
    constructor(
        private parallelRemoteCommunicators: Communicator[],
        private distributor: ParallelDataDistributor<CommunicationData>,
        private combiner: ParallelDataCombiner
    ) {
        super();
        this.prepare();
    }
    send(payload: Payload<CommunicationData>): void {
        this.parallelRemoteCommunicators.forEach((communicator, no) => {
            const pl = this.distributor(no, payload);
            communicator.send(pl);
        });
    }
    close(): void {
        this.communicationDataCache = {};
        this.parallelRemoteCommunicators.forEach(communicator => {
            communicator.close();
        });
    }
    private prepare() {
        const parallelCount = this.parallelRemoteCommunicators.length;
        this.parallelRemoteCommunicators.forEach((communicator, no) => {
            communicator.addReceiveMessageListener(message => {
                const callId = message.callId;
                let cache = this.communicationDataCache[callId];
                if (!cache) {
                    cache = this.communicationDataCache[callId] = {
                        returned: 0,
                        returns: []
                    };
                }
                cache.returned++;
                cache.returns[no] = message as Returning;
                if (cache.returned === parallelCount) {
                    const ret = this.combiner(cache.returns);
                    this.messageReceivers.forEach(receiver => {
                        receiver(ret);
                    });
                    delete this.communicationDataCache[callId];
                }
            });
        });
    }
}
