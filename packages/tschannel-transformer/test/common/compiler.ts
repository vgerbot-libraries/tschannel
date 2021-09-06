/* istanbul ignore file */
import ts from 'typescript';
import path from 'path';
import fs from 'fs';

const extTs = ts as unknown as ExtTs;

export type TSChannelTransformerType = (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;

const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    target: ts.ScriptTarget.ESNext,
    strict: true,
    sourceMap: false,
    importHelpers: false,
    esModuleInterop: true,
    skipLibCheck: true
};

export type TranspileOptions = {
    options?: ts.CompilerOptions;
    channelTransformer?: TSChannelTransformerType,
    transformers?: Array<ts.TransformerFactory<ts.SourceFile>>;
};

interface ExtTs {
    getNewLineCharacter(options: ts.CompilerOptions): string;
    normalizePath(path: string): string;
    fileExtensionIs(path: string, extension: string): boolean;
}

export function transpile(code: string, transpileOptions: TranspileOptions): string {
    const options = Object.assign({}, compilerOptions, transpileOptions.options || {});
    options.suppressOutputPathCheck = true;
    options.allowNonTsExtensions = true;
    const inputFileName = 'module.ts';
    const scriptTarget = options.target || ts.ScriptTarget.ESNext;
    const mockTSChannelCode = fs.readFileSync(path.resolve(__dirname, '../mock/Channel.ts')).toString('utf-8');
    const tschannelCoreModuleName = '@tschannel/core';

    const sourceFile = ts.createSourceFile(inputFileName, code, scriptTarget);

    const channelSourceFile = ts.createSourceFile(tschannelCoreModuleName, mockTSChannelCode, scriptTarget);

    const newLine = extTs.getNewLineCharacter(options);
    let outputText: string = '';
    const compilerHost: ts.CompilerHost = {
        getSourceFile: (fileName: string) => {
            if(fileName === inputFileName) {
                return sourceFile;
            } else if(fileName === channelSourceFile.fileName) {
                return channelSourceFile;
            }
            return undefined;
        },
        writeFile: function(name: string, text: string) {
            if(extTs.fileExtensionIs(name, '.map')) {
                return;
            }
            const moduleFileName = (ts as unknown as ExtTs).normalizePath(inputFileName);
            if(moduleFileName === inputFileName) {
                outputText = text;
            }
        },
        getDefaultLibFileName: () => 'lib.d.ts',
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: (fileName: string) => fileName,
        getCurrentDirectory: () => '',
        getNewLine: () => newLine,
        fileExists: (fileName: string) => fileName === inputFileName,
        readFile: () => "",
        directoryExists: () => true,
        getDirectories: () => ([])
    };
    const program = ts.createProgram([inputFileName], options, compilerHost);
    const transformers: Array<ts.TransformerFactory<ts.SourceFile>> = [];
    if(transpileOptions.transformers) {
        transformers.push(...transpileOptions.transformers);
    }
    if(transpileOptions.channelTransformer) {
        transformers.push(transpileOptions.channelTransformer(program));
    }
    program.emit(/*targetSourceFile*/ undefined, /*writeFile*/ undefined, /*cancellationToken*/ undefined, /*emitOnlyDtsFiles*/ undefined, {
        before: transformers
    });
    return outputText;
}
