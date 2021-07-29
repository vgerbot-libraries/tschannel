"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
class ChannelProgramContext {
    constructor() {
        this.channelInstanceDeclarations = [];
    }
    isChannelType(node) {
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
            programCtx.sourceFileNode = file;
            return typescript_1.default.visitEachChild(file, visitor, context);
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
    var _a, _b;
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if (typescript_1.default.isPropertyAssignment(node)) {
        resolveInitializerExpression(node, typeChecker, programCtx);
    }
    else if ((typescript_1.default.isParameter(node) || typescript_1.default.isPropertyDeclaration(node) || typescript_1.default.isVariableDeclaration(node))) {
        const type = node.type;
        if (type) {
            const typeSymbol = typeChecker.getSymbolAtLocation(type.typeName);
            if (typeSymbol === programCtx.channelClassSymbol) {
                const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
                if (!variableSymbol) {
                    return;
                }
                programCtx.channelInstanceDeclarations.push(variableSymbol.valueDeclaration);
            }
        }
        else if (node.initializer) {
            resolveInitializerExpression(node, typeChecker, programCtx);
        }
    }
    else if (typescript_1.default.isImportDeclaration(node)) {
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
            programCtx.channelClassDeclaration = channelClassDeclaration;
            programCtx.channelClassSymbol = typeChecker.getSymbolAtLocation(channelClassDeclaration.name);
        }
    }
    else if (typescript_1.default.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if (typescript_1.default.isPropertyAccessExpression(propertyExpression)) {
            const propertyName = propertyExpression.name.text;
            if (propertyName !== 'rclass') {
                return;
            }
            const ownerExpression = propertyExpression.expression;
            if (typescript_1.default.isNewExpression(ownerExpression)) {
                const classSymbol = typeChecker.getSymbolAtLocation(ownerExpression.expression);
                if (classSymbol !== programCtx.channelClassSymbol) {
                    return;
                }
            }
            else {
                const symbol = typeChecker.getSymbolAtLocation(ownerExpression);
                if (!symbol) {
                    return;
                }
                const index = programCtx.channelInstanceDeclarations.indexOf(symbol.valueDeclaration);
                if (index < 0) {
                    return;
                }
            }
            const typeArgs = node.typeArguments;
            if (!typeArgs || typeArgs.length < 1) {
                return;
            }
            const typeNode = typeArgs[0];
            const typeNodeObj = typeChecker.getTypeFromTypeNode(typeNode);
            const declarations = (_b = typeNodeObj.getSymbol()) === null || _b === void 0 ? void 0 : _b.getDeclarations();
            if (!declarations || declarations.length < 1) {
                return;
            }
            const typeNodeDeclaration = declarations[0];
            if (!typeNodeDeclaration) {
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
            const classExpression = createRemoteClassExpression(typeNode, typeChecker, factory);
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
function resolveInitializerExpression(node, typeChecker, programCtx) {
    var _a;
    const errorType = typeChecker.getTypeAtLocation(undefined);
    const type = typeChecker.getTypeAtLocation(node);
    if (type !== errorType) {
        const aliasSymbol = type.aliasSymbol;
        let isTypeMatch = false;
        if (aliasSymbol) {
            const intersectionDeclarations = (_a = aliasSymbol.declarations) === null || _a === void 0 ? void 0 : _a.filter(it => typescript_1.default.isInterfaceDeclaration(it));
            if (!intersectionDeclarations) {
                return;
            }
            isTypeMatch = intersectionDeclarations.some(it => {
                if (!typescript_1.default.isTypeAliasDeclaration(it)) {
                    return;
                }
                if (!typescript_1.default.isIntersectionTypeNode(it.type)) {
                    return;
                }
                const types = it.type.types;
                return types.some(it => {
                    if (!typescript_1.default.isTypeReferenceNode(it)) {
                        return;
                    }
                    const symbol = typeChecker.getSymbolAtLocation(it.typeName);
                    if (programCtx.channelClassSymbol === symbol) {
                        return true;
                    }
                });
            });
        }
        else if (type.getSymbol() === programCtx.channelClassSymbol) {
            isTypeMatch = true;
        }
        if (isTypeMatch) {
            const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
            const nodeDeclarations = variableSymbol === null || variableSymbol === void 0 ? void 0 : variableSymbol.getDeclarations();
            if (!nodeDeclarations) {
                return;
            }
            programCtx.channelInstanceDeclarations.push(...nodeDeclarations);
            return;
        }
    }
    const initializer = node.initializer;
    if (!initializer) {
        return;
    }
    if (typescript_1.default.isNewExpression(initializer)) {
        const typeSymbol = typeChecker.getSymbolAtLocation(initializer.expression);
        if (typeSymbol === programCtx.channelClassSymbol) {
            const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
            if (!variableSymbol) {
                return;
            }
            programCtx.channelInstanceDeclarations.push(variableSymbol.valueDeclaration);
        }
    }
    else if (typescript_1.default.isIdentifier(initializer)) {
        const initializerSymbol = typeChecker.getSymbolAtLocation(initializer);
        if (!initializerSymbol) {
            return;
        }
        const declarations = initializerSymbol.getDeclarations();
        if (!declarations || declarations.length < 1) {
            return;
        }
        const declaration = declarations[0];
        if (programCtx.channelInstanceDeclarations.indexOf(declaration) === -1) {
            return;
        }
        const nodeSymbol = typeChecker.getSymbolAtLocation(node.name);
        const nodeDeclarations = nodeSymbol === null || nodeSymbol === void 0 ? void 0 : nodeSymbol.getDeclarations();
        if (!nodeDeclarations) {
            return;
        }
        programCtx.channelInstanceDeclarations.push(...nodeDeclarations);
    }
    else if (typescript_1.default.isAsExpression(initializer)) {
        const typeNode = initializer.type;
        const classSymbol = typeChecker.getSymbolAtLocation(typeNode.typeName);
        if (programCtx.channelClassSymbol !== classSymbol) {
            return;
        }
        const nodeSymbol = typeChecker.getSymbolAtLocation(node.name);
        const nodeDeclarations = nodeSymbol === null || nodeSymbol === void 0 ? void 0 : nodeSymbol.getDeclarations();
        if (!nodeDeclarations) {
            return;
        }
        programCtx.channelInstanceDeclarations.push(...nodeDeclarations);
    }
}
//# sourceMappingURL=index.js.map