import { channel } from '@vgerbot/channel';
import { Animal, CHANNEL_ID } from './common';

const workerChannel = channel(CHANNEL_ID).connectToMainThread().create();

workerChannel.def_method('hello', () => 'world');

workerChannel.def_class(
    'Dog',
    class Dog implements Animal {
        constructor(private type: string) {}
        public getType(): string {
            return this.type;
        }
    }
);
workerChannel.def_method('get-coverage', () => {
    return __coverage__;
});
workerChannel.def_class(
    'Painter',
    class Painter {
        constructor(private canvas: OffscreenCanvas) {}
        checkCanvas(canvas: OffscreenCanvas) {
            return this.canvas == canvas;
        }
    }
);
