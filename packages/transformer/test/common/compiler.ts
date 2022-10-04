/* istanbul ignore file */
import { TransformerOptions } from '../../src';
import { createSystem, createVirtualCompilerHost } from '@typescript/vfs';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import globby from 'globby';

export type TSChannelTransformerType = (
    program: ts.Program,
    options?: Partial<TransformerOptions>
) => ts.TransformerFactory<ts.SourceFile>;

const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Classic,
    target: ts.ScriptTarget.ESNext,
    strict: true,
    sourceMap: false,
    importHelpers: false,
    esModuleInterop: true,
    skipLibCheck: false,
    noImplicitAny: true,
    include: '/',
    baseUrl: path.resolve(__dirname, '../'),
    paths: {
        '@vgerbot/channel': [path.resolve(__dirname, '../../../core/dist/index.d.ts')]
    }
};

export type TranspileOptions = {
    options?: ts.CompilerOptions;
    channelTransformer?: TSChannelTransformerType;
    channelTransformerOptions?: Partial<TransformerOptions>;
    transformers?: Array<ts.TransformerFactory<ts.SourceFile>>;
};

export function transpile(filepath: string, code: string, transpileOptions: TranspileOptions): string {
    const options = Object.assign({}, compilerOptions, transpileOptions.options || {});
    options.suppressOutputPathCheck = true;
    options.allowNonTsExtensions = true;

    const fsMap = new Map<string, string>();
    fsMap.set(filepath, code);
    fsMap.set('/lib.esnext.full.d.ts', ' ');

    const basedir = path.resolve(__dirname, '../../../core/dist');
    const files = globby.sync(path.resolve(basedir, '**/*'), {
        ignore: ['index.*.js']
    });
    files.forEach(it => {
        const code = fs.readFileSync(it).toString('utf8');
        fsMap.set(it, code);
    });


    const system = createSystem(fsMap);
    const host = createVirtualCompilerHost(system, options, ts);

    host.compilerHost.resolveModuleNames = (
        moduleNames: string[],
        containingFile: string,
        reusedNames: string[] | undefined,
        redirectedReference: ts.ResolvedProjectReference | undefined,
        options: ts.CompilerOptions
    ): (ts.ResolvedModule | undefined)[] => {
        return moduleNames
            .map((moduleName) => {
                const result = ts.resolveModuleName(moduleName, containingFile, options, {
                    fileExists(fileName) {
                        return fsMap.has(fileName) || ts.sys.fileExists(fileName);
                    },
                    readFile(fileName) {
                        return fsMap.get(fileName) || ts.sys.readFile(fileName) || '';
                    },
                });
                return result.resolvedModule;
            })
            .filter(Boolean);
    };
    const program = ts.createProgram({
        rootNames: [filepath],
        options,
        host: host.compilerHost,
    });

    const transformers: Array<ts.TransformerFactory<ts.SourceFile>> = [];
    if (transpileOptions.transformers) {
        transformers.push(...transpileOptions.transformers);
    }
    if (transpileOptions.channelTransformer) {
        transformers.push(transpileOptions.channelTransformer(program, transpileOptions.channelTransformerOptions));
    }
    // console.info(program.getSourceFiles());
    program.emit(
        /*targetSourceFile*/ undefined,
        /*writeFile*/ undefined,
        /*cancellationToken*/ undefined,
        /*emitOnlyDtsFiles*/ undefined,
        {
            before: transformers,
        }
    );
    return fsMap.get(filepath.replace(/\.ts$/, '.js')) || '';
}
