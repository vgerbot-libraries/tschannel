'use strict';

module.exports = {
    basePath: '',

    hostname: '127.0.0.1',

    frameworks: ['mocha', 'sinon-chai', 'chai', 'sinon'],

    restartBrowserBetweenTests: false,

    files: ['test/prepare.ts', 'test/specs/**/*.spec.ts', {
        pattern: 'src/**/*.ts',
        served: true,
        included: false,
        watched: true
    }, {
        pattern: 'test/specs/**/*.external.ts',
        served: true,
        included: false,
        watched: true
    }, {
        pattern: 'test/specs/**/*.external.html',
        served: true,
        included: false,
        watched: true
    }],

    mime: {
        'text/x-typescript': ['ts','tsx']
    },

    reporters: ['mocha'],

    customContextFile: 'test/karmajs/context.html',
    customDebugFile: 'test/karmajs/debug.html',

    port: 9876,

    colors: true,

    autoWatch: true,

    usePolling: true,

    atomic_save: false,
    customLaunchers: {
        HeadlessChrome: {
            base: 'ChromeHeadless',
            flags: [
                '--no-sandbox',
                '--headless',
                '--disable-gpu',
                '--disable-translate',
                '--disable-extensions'
            ]
        }
    },

    singleRun: false,

    concurrency: Infinity,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
    customHeaders: [{
        match: '.*\\.html',
        name: 'Cross-Origin-Opener-Policy',
        value: 'same-origin'
    }, {
        match: '.*\\.(html|js)',
        name: 'Cross-Origin-Embedder-Policy',
        value: 'require-corp'
    }],
    plugins: [
        'karma-chrome-launcher',
        'karma-mocha',
        'karma-chai',
        'karma-sinon',
        'karma-sinon-chai',
        'karma-mocha-reporter',
        '@vgerbot/karma-rollup-preprocessor',
        'karma-sourcemap-loader'
    ]
};
