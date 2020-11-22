'use strict';

const baseConfig = require('./karma.base.conf');
const rollupConfig = require('./rollup-debug.config');

module.exports = function (config) {


    config.set(baseConfig);
    config.set({
        preprocessors: {
            'test/specs/**/*.spec.ts': ['sourcemap', 'rollup'],
            'test/prepare.ts': ['sourcemap', 'rollup']
        },
        rollupPreprocessor: rollupConfig,
        reporters: ['progress', 'mocha'],

        logLevel: config.LOG_DEBUG,

        singleRun: false
    });
};
