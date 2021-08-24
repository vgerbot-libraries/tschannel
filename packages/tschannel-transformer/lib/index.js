"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
class ChannelProgramContext {
    constructor() {
        this.interfaceImplMap = new Map();
    }
}
const CHANNEL_MODULE_NAME = '@tschannel/core';
;
const DEFAULT_TRANSFORMER_OPTIONS = {};
function transformer(program, options) {
    const resolvedOptions = Object.assign(Object.assign({}, DEFAULT_TRANSFORMER_OPTIONS), (options || {}));
    return (context) => {
        return (file) => {
            const programCtx = new ChannelProgramContext();
            const sourceFileNode = typescript_1.default.visitEachChild(file, visitor, context);
            return typescript_1.default.factory.updateSourceFile(sourceFileNode, [
                ...sourceFileNode.statements,
                ...programCtx.interfaceImplMap.values()
            ]);
            function visitor(node) {
                const ret = visitNode(node, program, programCtx, context, resolvedOptions);
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
function visitNode(node, program, programCtx, context, options) {
    var _a, _b, _c;
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if (typescript_1.default.isImportDeclaration(node)) {
        if (!typescript_1.default.isStringLiteral(node.moduleSpecifier)) {
            return;
        }
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== CHANNEL_MODULE_NAME) {
            return;
        }
        const namedImports = (_a = node.importClause) === null || _a === void 0 ? void 0 : _a.namedBindings;
        if (namedImports && typescript_1.default.isNamedImports(namedImports)) {
            const channelClassDeclaration = namedImports.elements.find((it) => {
                const propertyName = it.propertyName;
                if (propertyName) {
                    return propertyName.text === 'Channel';
                }
                return it.name.text === 'Channel';
            });
            if (!channelClassDeclaration) {
                return;
            }
            const channelClassType = typeChecker.getTypeAtLocation(channelClassDeclaration);
            const channelClassSymbol = channelClassType.getSymbol();
            programCtx.channelClassSymbol = channelClassSymbol;
            programCtx.rclassSymbol = (_b = channelClassSymbol === null || channelClassSymbol === void 0 ? void 0 : channelClassSymbol.members) === null || _b === void 0 ? void 0 : _b.get('rclass');
        }
    }
    else if (typescript_1.default.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if (typescript_1.default.isPropertyAccessExpression(propertyExpression)) {
            const propertyName = propertyExpression.name.text;
            if (propertyName !== 'rclass') {
                return;
            }
            const propertyType = typeChecker.getTypeAtLocation(propertyExpression);
            if (!propertyType) {
                return;
            }
            const propertySymbol = propertyType.getSymbol();
            if (!propertySymbol || propertySymbol !== programCtx.rclassSymbol) {
                return;
            }
            const typeArgs = node.typeArguments;
            if (!typeArgs || typeArgs.length < 1) {
                return;
            }
            const typeNode = typeArgs[0];
            const typeNodeObj = typeChecker.getTypeFromTypeNode(typeNode);
            const declarations = (_c = typeNodeObj.getSymbol()) === null || _c === void 0 ? void 0 : _c.getDeclarations();
            if (!declarations || declarations.length < 1) {
                return;
            }
            const typeNodeDeclaration = declarations[0];
            if (!typeNodeDeclaration) {
                return;
            }
            if (node.arguments.length > 1) {
                return;
            }
            let classIdArg = node.arguments[0];
            if (!classIdArg) {
                classIdArg = factory.createStringLiteral(typeNode.getText());
            }
            if (typescript_1.default.isClassDeclaration(typeNodeDeclaration)) {
                return factory.createCallExpression(node.expression, [], [
                    classIdArg,
                    factory.createRegularExpressionLiteral(typeNode.getText())
                ]);
            }
            const className = factory.createUniqueName(typeNode.getText() + 'Impl');
            const type = typeChecker.getTypeFromTypeNode(typeNode);
            const members = typeChecker.getPropertiesOfType(type);
            const classMembers = members
                .filter(it => typescript_1.default.isMethodSignature(it.valueDeclaration))
                .map(it => {
                return factory.createMethodDeclaration([], [], undefined, it.getName(), undefined, [], [], undefined, factory.createBlock([], false));
            });
            const classExpression = factory.createClassExpression([], [], className, [], [factory.createHeritageClause(typescript_1.default.SyntaxKind.ImplementsKeyword, [])], classMembers);
            return factory.createCallExpression(node.expression, [], [
                classIdArg,
                classExpression
            ]);
        }
    }
}
//# sourceMappingURL=index.js.map