"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelProgramContext = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
class ChannelProgramContext {
    constructor(typeChecker) {
        this.typeChecker = typeChecker;
        this.variablesMap = new Map();
        this.channel_variables = new Set();
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
            const importElementsArray = namedBindings.elements.map(it => {
                const name = it.propertyName ? it.propertyName.text : it.name.text;
                return { name, importSpecifier: it, symbol: this.typeChecker.getSymbolAtLocation(it.name) };
            });
            const { symbol: channelMethodSymbol } = importElementsArray.find(it => it.name === 'channel') || {};
            if (channelMethodSymbol) {
                this.channelMethodSymbol = channelMethodSymbol;
            }
            const { symbol: channelClassSymbol } = importElementsArray.find(it => it.name === 'Channel') || {};
            if (channelClassSymbol) {
                this.channelClassSymbol = channelClassSymbol;
            }
        }
    }
}
exports.ChannelProgramContext = ChannelProgramContext;
//# sourceMappingURL=ChannelProgramContext.js.map