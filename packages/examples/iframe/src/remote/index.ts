import {
    Channel,
    WindowChannelCommunicator
} from '@tschannel/core';

const channel = new Channel(
    'embed-iframe',
    new WindowChannelCommunicator(parent)
);

channel.lmethod('clear', () => {
    console.log('clear data');
});
channel.lclass(
    'ClassDefinedInIframe',
    class ClassDefinedInIframe implements CrossIframeClassInterface {
        constructor() {
            console.log('create new instance');
        }
        hello() {
            console.log('hello world');
        }
    }
);
