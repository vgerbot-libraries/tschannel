import { transpile } from '../common/compiler';
import transformer from '../../src';

describe('@tschannel/transformer', () => {
    it('should run normally with the transformer', async () => {
        const source = `
            import { Channel } from '@tschanel/core';
            export let x: string = 'string';
            console.info(Channel);
        `;
        const output = transpile(source, {
            channelTransformer: transformer
        });
        expect(output).toMatchSnapshot();
    });
});
