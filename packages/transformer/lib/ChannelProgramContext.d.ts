import ts from 'typescript';
export interface ChannelSymbols {
    channelMethodSymbol: ts.Symbol;
    channelClassSymbol: ts.Symbol;
}
export declare class ChannelProgramContext {
    private readonly typeChecker;
    constructor(typeChecker: ts.TypeChecker, channelSymbols: ChannelSymbols);
    channelMethodSymbols: Set<ts.Symbol>;
    channelClassSymbols: Set<ts.Symbol>;
    variablesMap: Map<ts.Type, ts.VariableDeclaration>;
    channel_variables: Set<ts.Symbol>;
    isAccessingDefClassMethod(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression): boolean;
    isAccessingDefMethodMethod(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression): boolean;
    isAccessingTheGetClassMethod(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression): boolean;
    recordChannelVariableByBinaryExpression(node: ts.BinaryExpression): void;
    recordChannelVariableIfPossible(node: ts.VariableDeclaration): void;
    private isChannelInstanceInitializerExpression;
    isChannelMethodSymbol(symbol: undefined | ts.Symbol): symbol is ts.Symbol;
    isChannelClassSymbol(symbol: undefined | ts.Symbol): symbol is ts.Symbol;
    recordChannelSymbolIfPossible(node: ts.ImportDeclaration): void;
}
