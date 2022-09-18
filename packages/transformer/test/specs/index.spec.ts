import { transpile } from '../common/compiler';
import transformer from '../../src';
import { loadFixtures, loadSpecialFixtures } from '../common/load-fixture';

describe('@vgerbot/channel-transformer', () => {

    const specialFixtures = [{
        file: 'normal',
        name: 'should run normally with the transformer'
    }, {
        file: 'alias',
        name: 'should be able to detect the module alias'
    }, {
        file: 'exclude 2 arguments',
        name: 'should be able to exclude methods calling that has more than 2 arguments'
    }, {
        file: 'exclude without type arguments',
        name: 'should be able to exclude methods without type arguments'
    }, {
        file: 'reference class',
        name: 'should be able to reference the class'
    }, {
        file: 'reuse converted variables',
        name: 'should reuse converted variables'
    }];

    specialFixtures.map(it => {
        return {
            source: loadSpecialFixtures(it.file).source,
            name: it.name
        };
    }).concat(
        loadFixtures().map(it => {
            return {
                source: it.source,
                name: `should transform "${it.filepath}" correctly`
            };
        })
    ).forEach(({source, name}) => {
        it(name, () => {
            const output = transpile(source, {
                channelTransformer: transformer
            });
            expect(output).toMatchSnapshot();
        })
    })

});
