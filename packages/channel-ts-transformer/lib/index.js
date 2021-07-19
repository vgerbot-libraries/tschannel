"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
class ChannelProgramContext {
    constructor() {
        this.channelInstanceSymbols = [];
    }
}
function transformer(program) {
    return (context) => {
        return (file) => {
            const programCtx = new ChannelProgramContext();
            programCtx.sourceFileNode = file;
            return visitNodeAndChildren(file, program, context, programCtx);
        };
    };
}
exports.default = transformer;
function visitNodeAndChildren(node, program, context, programCtx) {
    return typescript_1.default.visitEachChild(visitNode(node, program, programCtx), child => visitNodeAndChildren(child, program, context, programCtx), context);
}
function visitNode(node, program, programCtx) {
    var _a;
    const tss = typescript_1.default;
    const typeChecker = program.getTypeChecker();
    if (typescript_1.default.isImportDeclaration(node)) {
        if (!typescript_1.default.isStringLiteral(node.moduleSpecifier)) {
            return node;
        }
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== 'tschannel') {
            return node;
        }
        const namedImports = (_a = node.importClause) === null || _a === void 0 ? void 0 : _a.namedBindings;
        if (namedImports && typescript_1.default.isNamedImports(namedImports)) {
            const channelClassDeclaration = namedImports.elements.find(it => it.getText() === 'Channel');
            if (!channelClassDeclaration) {
                return node;
            }
            programCtx.channelClassDeclaration = channelClassDeclaration;
            programCtx.channelClassSymbol = typeChecker.getSymbolAtLocation(channelClassDeclaration === null || channelClassDeclaration === void 0 ? void 0 : channelClassDeclaration.getChildAt(0));
        }
    }
    else if (typescript_1.default.isNewExpression(node)) {
        const symbol = typeChecker.getSymbolAtLocation(node.expression);
        if (symbol === programCtx.channelClassSymbol) {
            if (typescript_1.default.isVariableDeclaration(node.parent)) {
                const variabelSymbol = typeChecker.getSymbolAtLocation(node.parent.getChildAt(0));
                if (!variabelSymbol) {
                    return node;
                }
                programCtx.channelInstanceSymbols.push(variabelSymbol);
            }
        }
    }
    else if (typescript_1.default.isCallExpression(node)) {
        const firstChild = node.getChildAt(0);
        if (firstChild && typescript_1.default.isPropertyAccessExpression(firstChild)) {
            const expression = firstChild.expression;
            if (typescript_1.default.isNewExpression(expression)) {
                const classSymbol = typeChecker.getSymbolAtLocation(expression.expression);
                if (classSymbol !== programCtx.channelClassSymbol) {
                    return node;
                }
                console.log(node.getText(), node);
            }
            else {
                const symbol = typeChecker.getSymbolAtLocation(firstChild.expression);
                if (!symbol) {
                    return node;
                }
                const index = programCtx.channelInstanceSymbols.indexOf(symbol);
                if (index < 0) {
                    return node;
                }
                const typeArgs = node.typeArguments;
                if (!typeArgs || typeArgs.length < 1) {
                    return node;
                }
                const type = typeArgs[0];
                console.info(node.getText(), node);
            }
        }
    }
    tss.isCallExpression(node);
    return node;
}
//# sourceMappingURL=index.js.map