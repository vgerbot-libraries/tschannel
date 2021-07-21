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
            return typescript_1.default.visitEachChild(file, visitor, context);
            function visitor(node) {
                const ret = visitNode(node, program, programCtx, context);
                if (!ret) {
                    return typescript_1.default.visitEachChild(node, visitor, context);
                }
                else {
                    return ret;
                }
            }
        };
    };
}
exports.default = transformer;
function visitNode(node, program, programCtx, context) {
    var _a;
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if (typescript_1.default.isImportDeclaration(node)) {
        if (!typescript_1.default.isStringLiteral(node.moduleSpecifier)) {
            return;
        }
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== 'tschannel') {
            return;
        }
        const namedImports = (_a = node.importClause) === null || _a === void 0 ? void 0 : _a.namedBindings;
        if (namedImports && typescript_1.default.isNamedImports(namedImports)) {
            const channelClassDeclaration = namedImports.elements.find((it) => it.getText() === 'Channel');
            if (!channelClassDeclaration) {
                return;
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
                    return;
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
                    return;
                }
            }
            else {
                const symbol = typeChecker.getSymbolAtLocation(firstChild.expression);
                if (!symbol) {
                    return;
                }
                const index = programCtx.channelInstanceSymbols.indexOf(symbol);
                if (index < 0) {
                    return;
                }
            }
            const typeArgs = node.typeArguments;
            if (!typeArgs || typeArgs.length < 1) {
                return;
            }
            const typeNode = typeArgs[0];
            const classExpression = createRemoteClassExpression(typeNode, typeChecker, factory);
            let classIdArg = node.arguments[0];
            if (!classIdArg) {
                classIdArg = factory.createStringLiteral(typeNode.getText());
            }
            return factory.createCallExpression(node.expression, [], [
                classIdArg,
                classExpression
            ]);
        }
    }
}
function createRemoteClassExpression(typeNode, typeChecker, factory) {
    const className = typescript_1.default.factory.createUniqueName(typeNode.getText());
    const type = typeChecker.getTypeFromTypeNode(typeNode);
    const members = typeChecker.getPropertiesOfType(type);
    const classMembers = members
        .filter(it => typescript_1.default.isMethodSignature(it.valueDeclaration))
        .map(it => {
        return factory.createMethodDeclaration([], [], undefined, it.getName(), undefined, [], [], undefined, factory.createBlock([], false));
    });
    const classExpression = factory.createClassExpression([], [], className, [], [typescript_1.default.factory.createHeritageClause(typescript_1.default.SyntaxKind.ImplementsKeyword, [])], classMembers);
    return classExpression;
}
//# sourceMappingURL=index.js.map