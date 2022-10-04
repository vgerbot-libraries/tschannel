import ts from 'typescript';
import { TransformerOptions } from './TransformerOptions';
export { TransformerOptions };
export default channelTransformerFactory;
export declare function channelTransformerFactory(program: ts.Program, options?: Partial<TransformerOptions>): ts.TransformerFactory<ts.SourceFile>;
