import { loadFixtures, loadSpecialFixtures } from '../common/load-fixture';
import { TransformerOptions, channelTransformerFactory } from '../../src';

import { transpile } from '../common/compiler';

interface TestCase {
    source: string;
    filepath: string;
    name: string;
    only?: boolean;
    skip?: boolean;
    shouldThrow?: boolean | string;
    transformerOptions?: Partial<TransformerOptions>;
}

interface SpecialFixture {
    file: string;
    name: string;
    only?: boolean;
    skip?: boolean;
    shouldThrow?: boolean | string;
    transformerOptions?: Partial<TransformerOptions>;
}

describe('@vgerbot/channel-transformer', () => {
    const specialFixtures: SpecialFixture[] = [
        {
            file: 'normal',
            name: 'should run normally with the transformer',
        },
        {
            file: 'alias',
            name: 'should be able to detect the module alias',
        },
        {
            file: 'exclude 2 arguments',
            name: 'should be able to exclude methods calling that has more than 2 arguments',
        },
        {
            file: 'exclude without type arguments',
            name: 'should be able to exclude methods without type arguments',
        },
        {
            file: 'reference class',
            name: 'should be able to reference the class',
        },
        {
            file: 'reuse converted variables',
            name: 'should reuse converted variables',
        },
        {
            file: 'class id strategy first-interface',
            name: 'should use the name of the first parent interface as the class id',
            transformerOptions: {
                classIdStrategy: 'first-interface',
            },
        },
        {
            file: 'class id strategy first-parent',
            name: 'should use the name of the first parent class as the class id',
            transformerOptions: {
                classIdStrategy: 'first-parent',
            },
        },
        {
            file: 'detect anonymous arrow functions',
            name: 'should throw when passing a anonymous arrow function to Channel.def_method',
            shouldThrow: 'The first function parameter of Channel.def_method cannot be anonymous',
        },
        {
            file: 'detect anonymous functions',
            name: 'should throw when passing a anonymous function to Channel.def_method',
            shouldThrow: 'The first function parameter of Channel.def_method cannot be anonymous',
        },
    ];

    specialFixtures
        .map((it) => {
            return {
                ...it,
                source: loadSpecialFixtures(it.file).source,
                filepath: `fixtures/special/${it.file}.ts`,
            } as TestCase;
        })
        .concat(
            loadFixtures().map((it) => {
                return {
                    ...it,
                    name: `should transform "${it.filepath}" correctly`,
                    only: false,
                    skip: false,
                };
            })
        )
        .forEach(({ filepath, source, name, only, skip, transformerOptions, shouldThrow }) => {
            let callback: jest.ProvidesCallback = () => {
                const output = transpile(filepath, source, {
                    channelTransformer: channelTransformerFactory,
                    channelTransformerOptions: transformerOptions,
                });
                expect(output).toMatchSnapshot();
            };
            if (shouldThrow) {
                const test_case = callback;
                if (typeof shouldThrow === 'string') {
                    callback = () => {
                        expect(test_case).toThrowError(shouldThrow);
                    };
                } else {
                    callback = () => {
                        expect(test_case).toThrow();
                    };
                }
            }
            if (only) {
                it.only(name, callback);
            } else if (skip) {
                it.skip(name, callback);
            } else {
                it(name, callback);
            }
        });
});
