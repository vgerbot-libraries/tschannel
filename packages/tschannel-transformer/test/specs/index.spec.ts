import { transpile } from '../common/compiler';
import transformer from '../../src';

describe('@tschannel/transformer', () => {
    it('Should run normally with the transformer', async () => {
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
    it('Should transform the interface parameter correctly', () => {
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
});
