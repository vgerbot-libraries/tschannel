import { transpile } from '../common/compiler';
import transformer from '../../src';

describe('@tschannel/transformer', () => {
    it('should run normally with the transformer', async () => {
        const source = `
            import { Channel } from '@tschannel/core';
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
            import { Channel } from '@tschannel/core';
            const channel = new Channel();
            channel.rclass<RemoteAPI>();
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
            import { Channel as ChannelAlias } from '@tschannel/core';
            const channel = new Channel();
            channel.rclass<RemoteAPI>();
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
            import { Channel as ChannelAlias } from '@tschannel/core';
            const channel = new Channel();
            channel.rclass<RemoteAPI>('RemoteAPI1', class {
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
            import { Channel } from '@tschannel/core';
            const channel = new Channel();
            channel.rclass('RemoteAPI', class RemoteAPI {
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
            import { Channel } from '@tschannel/core';
            const channel = new Channel();
            channel.rclass<RemoteAPI>();
            class RemoteAPI {
                method(){}
            }
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
});
