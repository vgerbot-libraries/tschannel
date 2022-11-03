'use strict';
const path = require('path');

const plugins = require('./build/rollup.plugins');
const rollupPluginIstanbul = require('rollup-plugin-istanbul');
const baseConfig = require('./karma.base.conf');
const pkg = require('./package.json');
const channelTsTransformer = require('@vgerbot/channel-transformer').channelTransformerFactory;

module.exports = function (config) {
    const coverageIstanbulReporter = {
        reports: ['html', 'text-summary', 'cobertura'],
        dir: path.join(__dirname, 'coverage'),
        skipFilesWithNoCoverage: true
    };

    const rollupPlugins = [
        plugins.typescript({
            tsconfig: 'test/tsconfig.json',
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
        }),
        rollupPluginIstanbul({
            exclude: ['test/**/*.ts', '**/node_modules/**/*'],
            instrumenterConfig: {
                embedSource: false,
                debug: false
            }
        }),
        plugins.printError()
    ];
    config.set(Object.assign({}, baseConfig, {
        preprocessors: {
            'test/**/*.ts': ['rollup']
        },
        files: baseConfig.files.concat(
            'test/utils/coverage-utils.ts'
        ),
        rollupPreprocessor: {
            context: 'this',
            watch: false,
            output: {
                format: 'iife',
                name: pkg.library,
                sourcemap: false
            },
            plugins: rollupPlugins,
            onwarn: function(warning) {
                if (warning.code === 'CIRCULAR_DEPENDENCY') {
                    return;
                }
                // console.warn(`(!) ${warning.message}`);
            }
        },
        reporters: ['mocha', 'coverage-istanbul'],
        coverageIstanbulReporter: coverageIstanbulReporter,

        pingTimeout: 1000 * 3000,
        browserNoActivityTimeout: 1000 * 300,

        logLevel: config.LOG_ERROR,

        singleRun: true,

        plugins: baseConfig.plugins.concat([
            'karma-coverage-istanbul-reporter'
        ])
    }));
};
