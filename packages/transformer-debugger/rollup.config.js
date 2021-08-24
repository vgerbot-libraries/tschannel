const plugins = require('./build/rollup.plugins');
const channelTsTransformer = require('@tschannel/transformer').default;

const rollupPlugins = [
    plugins.typescript({
        tsconfig: './tsconfig.json',
        tsconfigOverride: {
            compilerOptions: {
                inlineSourceMap: false
            }
        },
        transformers: [
            (languageService) => {
                const program = languageService.getProgram();
                return {
                    before: [channelTsTransformer(program)]
                };
            }
        ]
    }),
    plugins.nodeResolve(),
    plugins.commonjs({
        include: /node_modules/,
        ignore: ['js-base64'],
        sourceMap: false,
        namedExports: {
            chai: ['expect']
        }
    })
];
module.exports = {
    context: 'this',
    input: './src/index.ts',
    output: {
        format: 'commonjs',
        name: 'None',
        sourcemap: false,
        dir: './dist'
    },
    plugins: rollupPlugins,
    onwarn: function(warning) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
            return;
        }
        console.warn(`(!) ${warning.message}`);
    }
};
