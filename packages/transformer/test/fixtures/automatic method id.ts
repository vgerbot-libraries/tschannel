import { channel } from '@vgerbot/channel';
let channelBuilder = channel("channel-id");
let generator = channelBuilder.connectToMainThread();
const c = generator.create();

c.def_method(function hello() {})

const a = () => {};
c.def_method( a)

const b = function () {};

c.def_method(b)
