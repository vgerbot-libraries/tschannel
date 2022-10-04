import ts from 'typescript';

export interface ChannelSymbols {
    channelMethodSymbol: ts.Symbol;
    channelClassSymbol: ts.Symbol;
}

export class ChannelProgramContext {
    constructor(private readonly typeChecker: ts.TypeChecker, private readonly channelSymbols: ChannelSymbols) {}

    public channelMethodSymbol: ts.Symbol = this.channelSymbols.channelMethodSymbol;
    public channelClassSymbol: ts.Symbol = this.channelSymbols.channelClassSymbol;
    public variablesMap = new Map<ts.Type, ts.VariableDeclaration>();
    public channel_variables = new Set<ts.Symbol>();

    isAccessingDefClassMethod(
        callExpression: ts.CallExpression,
        propertyExpression: ts.PropertyAccessExpression
    ): boolean {
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'def_class') {
            return false;
        }
        const args = callExpression.arguments;
        if (args.length !== 1) {
            return false;
        }
        const argSymbol = this.typeChecker.getSymbolAtLocation(args[0]);
        const declaration = argSymbol?.valueDeclaration;
        return !!declaration && ts.isClassDeclaration(declaration);
    }
    isAccessingDefMethodMethod(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression) {
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'def_method') {
            return false;
        }
        const args = callExpression.arguments;
        if (args.length !== 1) {
            return false;
        }
        const expressionType = this.typeChecker.getTypeAtLocation(propertyExpression.expression);
        if (expressionType && expressionType.getSymbol() !== this.channelClassSymbol) {
            return false;
        }

        if (ts.isArrowFunction(args[0])) {
            throw new Error('The first function parameter of Channel.def_method cannot be anonymous');
        }
        if (ts.isFunctionExpression(args[0])) {
            const functionName = args[0].name;
            if (!functionName) {
                throw new Error('The first function parameter of Channel.def_method cannot be anonymous');
            }
            return true;
        } else if (ts.isIdentifier(args[0])) {
            const symbol = this.typeChecker.getSymbolAtLocation(args[0]);
            if (symbol) {
                const declaration = symbol.declarations ? symbol.declarations[0] : undefined;
                if (declaration && ts.isFunctionDeclaration(declaration)) {
                    return true;
                }
            }
        }
        return false;
    }

    isAccessingTheGetClassMethod(callExpression: ts.CallExpression, propertyExpression: ts.PropertyAccessExpression) {
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'get_class') {
            return false;
        }
        if (callExpression.typeArguments?.length !== 1) {
            return false;
        }
        const expressionType = this.typeChecker.getTypeAtLocation(propertyExpression.expression);
        if (expressionType && expressionType.getSymbol() === this.channelClassSymbol) {
            return true;
        }
        const LeftHandSideExpressionSymbol = this.typeChecker.getSymbolAtLocation(propertyExpression.expression);
        return !!LeftHandSideExpressionSymbol && this.channel_variables.has(LeftHandSideExpressionSymbol);
    }

    recordChannelVariableByBinaryExpression(node: ts.BinaryExpression) {
        const typeChecker = this.typeChecker;
        const variables = this.channel_variables;

        const variableSymbol = typeChecker.getSymbolAtLocation(node.left);
        if (!variableSymbol) {
            return;
        }
        if (this.isChannelInstanceInitializerExpression(node.right)) {
            variables.add(variableSymbol);
        }
    }

    recordChannelVariableIfPossible(node: ts.VariableDeclaration) {
        const typeChecker = this.typeChecker;
        const variables = this.channel_variables;
        const initializer = node.initializer;
        if (!initializer) {
            return;
        }
        const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
        if (!variableSymbol) {
            return;
        }
        if (this.isChannelInstanceInitializerExpression(initializer)) {
            variables.add(variableSymbol);
        }
    }

    private isChannelInstanceInitializerExpression(initializer: ts.Expression) {
        const typeChecker = this.typeChecker;
        if (ts.isNewExpression(initializer)) {
            const classSymbol = typeChecker.getSymbolAtLocation(initializer.expression);
            if (classSymbol === this.channelClassSymbol) {
                return true;
            }
        } else if (ts.isCallExpression(initializer)) {
            let expression = initializer.expression;
            while (true) {
                if (ts.isCallExpression(expression)) {
                    expression = expression.expression;
                } else if (ts.isPropertyAccessExpression(expression)) {
                    expression = expression.expression;
                } else {
                    break;
                }
            }
            if (ts.isIdentifier(expression)) {
                const symbol = typeChecker.getSymbolAtLocation(expression);
                if (!!this.channelMethodSymbol && this.channelMethodSymbol === symbol) {
                    return true;
                }
                if (symbol) {
                    return this.channel_variables.has(symbol);
                }
            }
        }
        return false;
    }
    recordChannelSymbolIfPossible(node: ts.ImportDeclaration) {
        const namedBindings = node.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
            const importElementsArray = namedBindings.elements.map((it) => {
                const name = it.propertyName ? it.propertyName.text : it.name.text;
                return { name, importSpecifier: it, symbol: this.typeChecker.getSymbolAtLocation(it.name) };
            });
            const { symbol: channelMethodSymbol } = importElementsArray.find((it) => it.name === 'channel') || {};
            if (channelMethodSymbol) {
                this.channelMethodSymbol = channelMethodSymbol;
            }
            const { symbol: channelClassSymbol } = importElementsArray.find((it) => it.name === 'Channel') || {};
            if (channelClassSymbol) {
                this.channelClassSymbol = channelClassSymbol;
            }
        }
    }
}
