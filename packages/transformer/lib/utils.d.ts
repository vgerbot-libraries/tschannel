import ts from 'typescript';
export declare function getTypeNodeDecration(typeNodeObj: ts.Type): ts.Declaration | undefined;
export declare function createMemberNamesvariable(variableName: string, memberNames: string[], factory: ts.NodeFactory): ts.VariableDeclaration;
export declare function getMethodMembersFrom(typeChecker: ts.TypeChecker, typeNode: ts.Type): ts.Symbol[];
export declare function getTypeArguments(node: ts.CallExpression): ts.NodeArray<ts.TypeNode> | undefined;
