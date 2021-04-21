import istanbul from 'istanbul-lib-coverage';

const coverageDatas: istanbul.CoverageMapData[] = [];

type CoverageMessageData = {
    action: string;
    coverage: istanbul.CoverageMapData;
    callId: string;
};

window.addEventListener('message', e => {
    try {
        const msgData = e.data as CoverageMessageData;
        if (msgData.action === 'receive-coverage-data') {
            coverageDatas.push(msgData.coverage);
            window.postMessage(msgData.callId);
        }
    } catch (error) {
        // IGNORE
    }
});

const complete = __karma__.complete;

__karma__.complete = function(options) {
    const coverageMap = istanbul.createCoverageMap(options.coverage);
    coverageDatas.forEach(coverageData => {
        coverageMap.merge(coverageData);
    });
    return complete.call(this, {
        ...options,
        coverage: coverageMap.toJSON()
    });
};
