import ts from 'typescript';
import { TransformerOptions } from './TransformerOptions';
export { TransformerOptions };
export declare function channelTransformerFactory(program: ts.Program, options?: Partial<TransformerOptions>): ts.TransformerFactory<ts.SourceFile>;
