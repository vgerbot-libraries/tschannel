import ts from 'typescript';

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

    const sourceFile = ts.createSourceFile(inputFileName, code, options.target || ts.ScriptTarget.ESNext);

    const newLine = extTs.getNewLineCharacter(options);
    let outputText: string = '';
    const compilerHost: ts.CompilerHost = {
        getSourceFile: (fileName: string) => {
            if(fileName === extTs.normalizePath(inputFileName)) {
                return sourceFile;
            }
            return undefined;
        },
        writeFile: function(name: string, text: string) {
            if(extTs.fileExtensionIs(name, '.map')) {
                return;
            }
            outputText = text;
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
