"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
class ChannelProgramContext {
    constructor() {
        this.channelInstanceSymbols = [];
        this.localStack = new LocalStack();
    }
}
class LocalStack {
    constructor() {
        this.locals = [];
    }
    put(locals) {
        this.locals.unshift(locals);
    }
    pop() {
        this.locals.shift();
    }
    get(name) {
        const scopeLocals = this.locals.find(it => it.has(name));
        if (scopeLocals) {
            return scopeLocals.get(name);
        }
    }
    clear() {
        this.locals.length = 0;
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
    const tss = typescript_1.default;
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
            console.log(node.getText(), node);
            const typeNode = typeArgs[0];
            const className = typescript_1.default.factory.createUniqueName(typeNode.getText());
            const type = typeChecker.getTypeFromTypeNode(typeNode);
            const members = typeChecker.getPropertiesOfType(type);
            const classMembers = members
                .filter(it => typescript_1.default.isMethodSignature(it.valueDeclaration))
                .map(it => {
                return factory.createMethodDeclaration([], [], undefined, it.name, undefined, [], [], undefined, undefined);
            });
            const classExpression = factory.createClassExpression([], [], className, [], [typescript_1.default.factory.createHeritageClause(typescript_1.default.SyntaxKind.ImplementsKeyword, [])], classMembers);
            console.info(typeNode.getText(), members.map(it => it.getName()));
            return factory.createCallExpression(node.expression, [], [
                classExpression
            ]);
        }
    }
}
//# sourceMappingURL=index.js.map