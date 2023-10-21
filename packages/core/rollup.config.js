const plugins = require('./build/rollup.plugins');
const pkg = require('./package.json');

function createOutputConfig(file, format, cfg = {}) {
    return Object.assign(
        {
            file,
            format,
            sourcemap: true,
            name: pkg.library,
            exports: 'named'
        },
        cfg || {}
    );
}

module.exports = [
    [pkg.browser, 'umd'],
    [pkg.module, 'es'],
    [pkg.main, 'cjs']
].map(confs => createOutputConfig(...confs))
    .map(output => {
        console.log(output);
        return {
            input: 'src/index.ts',
            output,
            plugins: [
                plugins.typescript({
                    tsconfigOverride: {
                        compilerOptions: {
                            target: output.format === 'es' ? 'ESNext' : 'ES5'
                        }
                    }
                }),
                plugins.nodeResolve({
                    mainFields: ['main', 'browser', 'module']
                }),
                plugins.commonjs({
                    include: /node_modules/,
                    ignore: ['js-base64'],
                    sourceMap: false
                }),
                plugins.printError()
            ],
            external: ['txon']
        }
    })
