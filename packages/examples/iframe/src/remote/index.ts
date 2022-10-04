import {
    Channel,
    WindowChannelCommunicator
} from '@vgerbot/channel';
import { CrossIframeClassInterface } from '../CrossIframeClassInterface';

const channel = new Channel(
    'embed-iframe',
    new WindowChannelCommunicator(parent)
);

channel.def_method(function clear() {
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
channel.def_class(ClassDefinedInIframe);
channel.def_method(function say_hello(a: ClassDefinedInIframe) {
    a.hello();
})
