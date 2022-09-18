import ts from 'typescript';

export class ChannelProgramContext {
    constructor(private readonly typeChecker: ts.TypeChecker) {}
    public get_classMethodSymbol!: ts.Symbol;
    public functional_channelMethodSymbol?: ts.Symbol;
    public variablesMap = new Map<ts.Type, ts.VariableDeclaration>();
    public functional_channelVariableInstanceMap = new Map<ts.Symbol, ts.Symbol>();
    public functional_channel_rel_variables = new Set<ts.Symbol>();

    is_accessing_get_class_method(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression) {
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'get_class') {
            return false;
        }
        if(callExpression.typeArguments?.length !== 1) {
            return false;
        }
        const typeChecker = this.typeChecker;
        const current_get_class_methodSymbol = typeChecker.getSymbolAtLocation(propertyExpression.name);

        if (!!current_get_class_methodSymbol && this.get_classMethodSymbol !== current_get_class_methodSymbol) {
            return true;
        }
        const LeftHandSideExpressionSymbol = typeChecker.getSymbolAtLocation(propertyExpression.expression);
        if(!!LeftHandSideExpressionSymbol && this.functional_channel_rel_variables.has(LeftHandSideExpressionSymbol)) {
            return true;
        }
        return false;
    }

    recordChannelVariableIfPossible(node: ts.VariableDeclaration) {
        const typeChecker = this.typeChecker;
        const variables = this.functional_channel_rel_variables;
        const initializer = node.initializer;
        if(!initializer || !ts.isCallExpression(initializer)) {
            return;
        }

        const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
        if(!variableSymbol) {
            return;
        }
        const expression = initializer.expression;
        if(ts.isPropertyAccessExpression(expression)) {
            const LeftHandSideExpression = expression.expression;
            const LeftHandSideExpressionSymbol = typeChecker.getSymbolAtLocation(LeftHandSideExpression);
            if(!LeftHandSideExpressionSymbol) {
                return;
            }
            if(variables.has(LeftHandSideExpressionSymbol)) {
                variables.add(variableSymbol);
            }
        } else if(ts.isIdentifier(expression)) {
            const methodSymbol = typeChecker.getSymbolAtLocation(expression);
            if(!!this.functional_channelMethodSymbol && methodSymbol === this.functional_channelMethodSymbol) {
                variables.add(variableSymbol);
            }
        }
    }
    recordChannelMethodSymbolIfPossible(node: ts.ImportDeclaration) {
        const namedBindings = node.importClause?.namedBindings;
        if(namedBindings && ts.isNamedImports(namedBindings)) {
            const channelMethodImportSpecifier = namedBindings.elements.find(it => {
                return ts.getNameOfDeclaration(it)?.getText() === 'channel';
            });
            if(!channelMethodImportSpecifier) {
                return;
            }
            const identifier = channelMethodImportSpecifier.name;
            const channelSymbol = this.typeChecker.getSymbolAtLocation(identifier);
            this.functional_channelMethodSymbol = channelSymbol;
        }
    }
}
