import ts from 'typescript';

export class ChannelProgramContext {
    constructor(private readonly typeChecker: ts.TypeChecker) {}
    public channelMethodSymbol?: ts.Symbol;
    public channelClassSymbol?: ts.Symbol;
    public variablesMap = new Map<ts.Type, ts.VariableDeclaration>();
    public channel_variables = new Set<ts.Symbol>();

    is_accessing_get_class_method(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression) {
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'get_class') {
            return false;
        }
        if(callExpression.typeArguments?.length !== 1) {
            return false;
        }
        const expressionType = this.typeChecker.getTypeAtLocation(propertyExpression.expression);
        if(expressionType && expressionType.getSymbol() === this.channelClassSymbol) {
            return true;
        }
        const LeftHandSideExpressionSymbol = this.typeChecker.getSymbolAtLocation(propertyExpression.expression);
        return !!LeftHandSideExpressionSymbol && this.channel_variables.has(LeftHandSideExpressionSymbol);
    }

    recordChannelVariableByBinaryExpression(node: ts.BinaryExpression) {
        const typeChecker = this.typeChecker;
        const variables = this.channel_variables;

        const variableSymbol = typeChecker.getSymbolAtLocation(node.left);
        if(!variableSymbol) {
            return;
        }
        if(this.isChannelInstanceInitializerExpression(node.right)) {
            variables.add(variableSymbol);
        }
    }
    recordChannelVariableIfPossible(node: ts.VariableDeclaration) {
        const typeChecker = this.typeChecker;
        const variables = this.channel_variables;
        const initializer = node.initializer;
        if(!initializer) {
            return;
        }
        const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
        if(!variableSymbol) {
            return;
        }
        if(this.isChannelInstanceInitializerExpression(initializer)) {
            variables.add(variableSymbol);
        }
    }
    private isChannelInstanceInitializerExpression(initializer: ts.Expression) {
        const typeChecker = this.typeChecker;
        if(ts.isNewExpression(initializer)) {
            const classSymbol = typeChecker.getSymbolAtLocation(initializer.expression);
            if(classSymbol === this.channelClassSymbol) {
                return true;
            }
        } else if(ts.isCallExpression(initializer)) {
            let expression = initializer.expression;
            while(true) {
                if(ts.isCallExpression(expression)) {
                    expression = expression.expression;
                } else if(ts.isPropertyAccessExpression(expression)) {
                    expression = expression.expression;
                } else {
                    break;
                }
            }
            if(ts.isIdentifier(expression)) {
                const symbol = typeChecker.getSymbolAtLocation(expression);
                if(!!this.channelMethodSymbol && this.channelMethodSymbol === symbol) {
                    return true;
                }
                if(symbol) {
                    return this.channel_variables.has(symbol);
                }
            }
        }
        return false;
    }
    recordChannelSymbolIfPossible(node: ts.ImportDeclaration) {
        const namedBindings = node.importClause?.namedBindings;
        if(namedBindings && ts.isNamedImports(namedBindings)) {
            const importElementsArray = namedBindings.elements.map(it => {
                const name = it.propertyName ? it.propertyName.text : it.name.text;
                return { name, importSpecifier: it, symbol: this.typeChecker.getSymbolAtLocation(it.name) };
            })
            const { symbol: channelMethodSymbol } = importElementsArray.find(it => it.name === 'channel') || {};
            if(channelMethodSymbol) {
                this.channelMethodSymbol = channelMethodSymbol;
            }
            const { symbol: channelClassSymbol } = importElementsArray.find(it => it.name === 'Channel') || {};
            if(channelClassSymbol) {
                this.channelClassSymbol = channelClassSymbol;
            }
        }
    }
}
