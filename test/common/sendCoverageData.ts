import istanbul from 'istanbul-lib-coverage';
import uid from '../../src/common/uid';

export function sendCoverageData(coverage: istanbul.CoverageMapData) {
    const callId = uid();
    return new Promise<void>(resolve => {
        const messageListener = (e: MessageEvent) => {
            if (e.data === callId) {
                window.removeEventListener('message', messageListener);
                resolve();
            }
        };
        window.addEventListener('message', messageListener);
        window.postMessage({
            action: 'receive-coverage-data',
            callId,
            coverage
        });
    });
}
