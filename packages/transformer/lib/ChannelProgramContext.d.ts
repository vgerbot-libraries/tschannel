import ts from 'typescript';
export declare class ChannelProgramContext {
    private readonly typeChecker;
    constructor(typeChecker: ts.TypeChecker);
    get_classMethodSymbol: ts.Symbol;
    channelMethodSymbol?: ts.Symbol;
    channelClassSymbol?: ts.Symbol;
    variablesMap: Map<ts.Type, ts.VariableDeclaration>;
    functional_channel_rel_variables: Set<ts.Symbol>;
    is_accessing_get_class_method(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression): boolean;
    recordChannelVariableIfPossible(node: ts.VariableDeclaration): void;
    recordChannelSymbolIfPossible(node: ts.ImportDeclaration): void;
}
