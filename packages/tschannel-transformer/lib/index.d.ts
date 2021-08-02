import ts from 'typescript';
export interface TransformerOptions {
}
export default function transformer(program: ts.Program, options?: Partial<TransformerOptions>): ts.TransformerFactory<ts.Node>;
