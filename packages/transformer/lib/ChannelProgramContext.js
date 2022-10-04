"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelProgramContext = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
class ChannelProgramContext {
    constructor(typeChecker, channelSymbols) {
        this.typeChecker = typeChecker;
        this.channelSymbols = channelSymbols;
        this.channelMethodSymbol = this.channelSymbols.channelMethodSymbol;
        this.channelClassSymbol = this.channelSymbols.channelClassSymbol;
        this.variablesMap = new Map();
        this.channel_variables = new Set();
    }
    isAccessingDefClassMethod(callExpression, propertyExpression) {
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'def_class') {
            return false;
        }
        const args = callExpression.arguments;
        if (args.length !== 1) {
            return false;
        }
        const argSymbol = this.typeChecker.getSymbolAtLocation(args[0]);
        const declaration = argSymbol === null || argSymbol === void 0 ? void 0 : argSymbol.valueDeclaration;
        return !!declaration && typescript_1.default.isClassDeclaration(declaration);
    }
    isAccessingDefMethodMethod(callExpression, propertyExpression) {
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
        if (typescript_1.default.isArrowFunction(args[0])) {
            throw new Error('The first function parameter of Channel.def_method cannot be anonymous');
        }
        if (typescript_1.default.isFunctionExpression(args[0])) {
            const functionName = args[0].name;
            if (!functionName) {
                throw new Error('The first function parameter of Channel.def_method cannot be anonymous');
            }
            return true;
        }
        else if (typescript_1.default.isIdentifier(args[0])) {
            const symbol = this.typeChecker.getSymbolAtLocation(args[0]);
            if (symbol) {
                const declaration = symbol.declarations ? symbol.declarations[0] : undefined;
                if (declaration && typescript_1.default.isFunctionDeclaration(declaration)) {
                    return true;
                }
            }
        }
        return false;
    }
    isAccessingTheGetClassMethod(callExpression, propertyExpression) {
        var _a;
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'get_class') {
            return false;
        }
        if (((_a = callExpression.typeArguments) === null || _a === void 0 ? void 0 : _a.length) !== 1) {
            return false;
        }
        const expressionType = this.typeChecker.getTypeAtLocation(propertyExpression.expression);
        if (expressionType && expressionType.getSymbol() === this.channelClassSymbol) {
            return true;
        }
        const LeftHandSideExpressionSymbol = this.typeChecker.getSymbolAtLocation(propertyExpression.expression);
        return !!LeftHandSideExpressionSymbol && this.channel_variables.has(LeftHandSideExpressionSymbol);
    }
    recordChannelVariableByBinaryExpression(node) {
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
    recordChannelVariableIfPossible(node) {
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
    isChannelInstanceInitializerExpression(initializer) {
        const typeChecker = this.typeChecker;
        if (typescript_1.default.isNewExpression(initializer)) {
            const classSymbol = typeChecker.getSymbolAtLocation(initializer.expression);
            if (classSymbol === this.channelClassSymbol) {
                return true;
            }
        }
        else if (typescript_1.default.isCallExpression(initializer)) {
            let expression = initializer.expression;
            while (true) {
                if (typescript_1.default.isCallExpression(expression)) {
                    expression = expression.expression;
                }
                else if (typescript_1.default.isPropertyAccessExpression(expression)) {
                    expression = expression.expression;
                }
                else {
                    break;
                }
            }
            if (typescript_1.default.isIdentifier(expression)) {
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
    recordChannelSymbolIfPossible(node) {
        var _a;
        const namedBindings = (_a = node.importClause) === null || _a === void 0 ? void 0 : _a.namedBindings;
        if (namedBindings && typescript_1.default.isNamedImports(namedBindings)) {
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
exports.ChannelProgramContext = ChannelProgramContext;
//# sourceMappingURL=ChannelProgramContext.js.map