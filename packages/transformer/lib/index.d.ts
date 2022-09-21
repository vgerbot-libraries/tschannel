import ts from 'typescript';
import { TransformerOptions } from './TransformerOptions';
export default function transformer(program: ts.Program, options?: Partial<TransformerOptions>): ts.TransformerFactory<ts.SourceFile>;
