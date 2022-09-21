"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelProgramContext = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
class ChannelProgramContext {
    constructor(typeChecker) {
        this.typeChecker = typeChecker;
        this.variablesMap = new Map();
        this.functional_channel_rel_variables = new Set();
    }
    is_accessing_get_class_method(callExpression, propertyExpression) {
        var _a;
        const propertyName = propertyExpression.name.text;
        if (propertyName !== 'get_class') {
            return false;
        }
        if (((_a = callExpression.typeArguments) === null || _a === void 0 ? void 0 : _a.length) !== 1) {
            return false;
        }
        const LeftHandSideExpressionSymbol = this.typeChecker.getSymbolAtLocation(propertyExpression.expression);
        return !!LeftHandSideExpressionSymbol && this.functional_channel_rel_variables.has(LeftHandSideExpressionSymbol);
    }
    recordChannelVariableIfPossible(node) {
        const typeChecker = this.typeChecker;
        const variables = this.functional_channel_rel_variables;
        const initializer = node.initializer;
        if (!initializer) {
            return;
        }
        const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
        if (!variableSymbol) {
            return;
        }
        if (typescript_1.default.isNewExpression(initializer)) {
            const classSymbol = typeChecker.getSymbolAtLocation(initializer.expression);
            if (classSymbol === this.channelClassSymbol) {
                variables.add(variableSymbol);
            }
        }
        else if (typescript_1.default.isCallExpression(initializer)) {
            const expression = initializer.expression;
            if (typescript_1.default.isPropertyAccessExpression(expression)) {
                const LeftHandSideExpression = expression.expression;
                const LeftHandSideExpressionSymbol = typeChecker.getSymbolAtLocation(LeftHandSideExpression);
                if (!LeftHandSideExpressionSymbol) {
                    return;
                }
                if (variables.has(LeftHandSideExpressionSymbol)) {
                    variables.add(variableSymbol);
                }
            }
            else if (typescript_1.default.isIdentifier(expression)) {
                const methodSymbol = typeChecker.getSymbolAtLocation(expression);
                if (!!this.channelMethodSymbol && methodSymbol === this.channelMethodSymbol) {
                    variables.add(variableSymbol);
                }
            }
        }
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