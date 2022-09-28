import {
    Channel,
    WindowChannelCommunicator
} from '@vgerbot/channel';
import { CrossIframeClassInterface } from '../CrossIframeClassInterface';

const channel = new Channel(
    'embed-iframe',
    new WindowChannelCommunicator(parent)
);

channel.def_method('clear', () => {
    console.log('clear data');
});
class ClassDefinedInIframe implements CrossIframeClassInterface {
    constructor() {
        console.log('create new instance');
    }
    hello() {
        console.log('hello world');
    }
}
channel.def_class('ClassDefinedInIframe', ClassDefinedInIframe);
channel.def_method('say_hello', (a: ClassDefinedInIframe) => {
    a.hello();
})
