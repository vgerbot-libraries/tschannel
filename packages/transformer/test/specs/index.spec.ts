import { transpile } from '../common/compiler';
import transformer from '../../src';

describe('@vgerbot/channel-transformer', () => {
    it('should run normally with the transformer', async () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            export let x: string = 'string';
            console.info(Channel);
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('should transform the interface parameter correctly', () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            const channel = new Channel();
            channel.get_class<RemoteAPI>();
            interface RemoteAPI {
                method(){}
            }
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('should be able to detect the module alias', () => {
        const source = `
            import { Channel as ChannelAlias } from '@vgerbot/channel';
            const channel = new ChannelAlias();
            channel.get_class<RemoteAPI>();
            interface RemoteAPI {
                method(){}
            }
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('should be able to exclude methods calling that has more than 2 arguments', () => {
        const source = `
            import { Channel as ChannelAlias } from '@vgerbot/channel';
            const channel = new ChannelAlias();
            channel.get_class<RemoteAPI>('RemoteAPI1', class {
                method(){}
            });
            interface RemoteAPI {
                method(){}
            }
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    })
    it('should be able to exclude methods without type arguments', () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            const channel = new Channel();
            channel.get_class('RemoteAPI', class RemoteAPI {
                method(){}
            });
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('should be able to reference the class', () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            const channel = new Channel();
            channel.get_class<RemoteAPI>();
            class RemoteAPI {
                method(){}
            }
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('should be able to transform the absrtact class', () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            const channel = new Channel();
            channel.get_class<RemoteAPI>();
            abstract class RemoteAPI {
                method(){}
                abstract method2();
            }
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('should correctly reuse converted member name array variables', () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            const channel = new Channel();
            channel.get_class<RemoteAPI>();
            channel.get_class<RemoteAPI>();
            abstract class RemoteAPI {
                method(){}
                abstract method2();
            }
            function scope_a() {
                channel.get_class<RemoteAPI>();
                channel.get_class<RemoteAPI>();
                interface RemoteAPI {
                    method();
                }
                function scope_inner_a() {
                    channel.get_class<InnerRemoteAPI>();
                    channel.get_class<RemoteAPI>();
                    interface InnerRemoteAPI {
                        method();
                    }
                }
            }
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('the type should work properly as an interface', () => {
        const source = `
          import { Channel } from '@vgerbot/channel';
            type RemoteAPI = {
                method(){}
            };
            const channel = new Channel();
            channel.get_class<RemoteAPI>();
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('the union type should work correctly', () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            interface RemoteAPI1 {
                method1(): void;
            }
            interface RemoteAPI1 {
                method1x(): void;
            }
            interface RemoteAPI2  {
                method2(): void;
                method3(): void;
            }
            type RemoteAPI = RemoteAPI1 & RemoteAPI2;
            const channel = new Channel();
            channel.get_class<RemoteAPI>();
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
    it('the union type should work correctly 2', () => {
        const source = `
            import { Channel } from '@vgerbot/channel';
            type RemoteAPI1 = {
                method1(): void;
            };
            type RemoteAPI2 =  {
                method2(): void;
                method3(): void;
            };
            type RemoteAPI = RemoteAPI1 & RemoteAPI2;
            const channel = new Channel();
            channel.get_class<RemoteAPI>();
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
});
