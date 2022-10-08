"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelTransformerFactory = void 0;
const tslib_1 = require("tslib");
const consts_1 = require("./consts");
const utils_1 = require("./utils");
const typescript_1 = tslib_1.__importStar(require("typescript"));
const ChannelProgramContext_1 = require("./ChannelProgramContext");
exports.default = channelTransformerFactory;
function channelTransformerFactory(program, options) {
    const resolvedOptions = Object.assign(Object.assign({}, consts_1.DEFAULT_TRANSFORMER_OPTIONS), (options || {}));
    return (context) => {
        const channelSymbols = findChannelSymbols(program);
        return (file) => {
            if (!channelSymbols) {
                return file;
            }
            const findChannelModule = file.statements.find(it => {
                if (typescript_1.default.isImportDeclaration(it)) {
                    if (typescript_1.default.isStringLiteralLike(it.moduleSpecifier)) {
                        const moduleName = it.moduleSpecifier.text;
                        return moduleName === consts_1.CHANNEL_MODULE_NAME;
                    }
                }
                return false;
            });
            if (!findChannelModule) {
                return file;
            }
            const programCtx = new ChannelProgramContext_1.ChannelProgramContext(program.getTypeChecker(), channelSymbols);
            const sourceFileNode = typescript_1.default.visitEachChild(file, visitor, context);
            const variableDeclarations = Array.from(programCtx.variablesMap.values());
            const variableStatements = variableDeclarations.length > 0 ? [typescript_1.factory.createVariableStatement([], variableDeclarations)] : [];
            return typescript_1.default.factory.updateSourceFile(sourceFileNode, [...variableStatements, ...sourceFileNode.statements]);
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
exports.channelTransformerFactory = channelTransformerFactory;
function findChannelSymbols(program) {
    const typeChecker = program.getTypeChecker();
    const channelFiles = program.getSourceFiles().filter(it => {
        const fileSymbol = typeChecker.getSymbolAtLocation(it);
        if (!fileSymbol) {
            return false;
        }
        const symbolName = fileSymbol.getName();
        if (symbolName.indexOf('packages/core/dist') > -1) {
            return true;
        }
        if (symbolName.indexOf('packages/core/src') > -1) {
            return true;
        }
        if (symbolName.indexOf(consts_1.CHANNEL_MODULE_NAME) > -1) {
            return true;
        }
        return false;
    });
    let channelMethodSymbol;
    let channelClassSymbol;
    channelFiles.some(it => {
        var _a, _b;
        const fileSymbol = typeChecker.getSymbolAtLocation(it);
        channelClassSymbol = channelClassSymbol || ((_a = fileSymbol === null || fileSymbol === void 0 ? void 0 : fileSymbol.exports) === null || _a === void 0 ? void 0 : _a.get('Channel'));
        channelMethodSymbol = channelMethodSymbol || ((_b = fileSymbol === null || fileSymbol === void 0 ? void 0 : fileSymbol.exports) === null || _b === void 0 ? void 0 : _b.get('channel'));
        return !!channelClassSymbol && !!channelMethodSymbol;
    });
    if (channelClassSymbol && channelMethodSymbol) {
        return { channelClassSymbol, channelMethodSymbol };
    }
}
function visitNode(node, program, programCtx, context, options) {
    const variablesMap = programCtx.variablesMap;
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if (typescript_1.default.isImportDeclaration(node) && typescript_1.default.isStringLiteralLike(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== consts_1.CHANNEL_MODULE_NAME) {
            return;
        }
        programCtx.recordChannelSymbolIfPossible(node);
    }
    else if (typescript_1.default.isVariableDeclaration(node)) {
        programCtx.recordChannelVariableIfPossible(node);
    }
    else if (typescript_1.default.isBinaryExpression(node)) {
        programCtx.recordChannelVariableByBinaryExpression(node);
    }
    else if (typescript_1.default.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if (typescript_1.default.isPropertyAccessExpression(propertyExpression)) {
            if (programCtx.isAccessingTheGetClassMethod(node, propertyExpression)) {
                return handleGetClassMethod(node, typeChecker, factory, variablesMap);
            }
            else if (programCtx.isAccessingDefClassMethod(node, propertyExpression)) {
                return handleDefClassMethod(node, typeChecker, options, factory);
            }
            else if (programCtx.isAccessingDefMethodMethod(node, propertyExpression)) {
                return handleDefMethodMethod(node, factory);
            }
        }
    }
}
function handleGetClassMethod(node, typeChecker, factory, variablesMap) {
    const typeArgs = node.typeArguments;
    if (!typeArgs || typeArgs.length < 1) {
        return;
    }
    const typeNode = typeArgs[0];
    const typeNodeObj = typeChecker.getTypeFromTypeNode(typeNode);
    const typeNodeDeclaration = (0, utils_1.getTypeNodeDecration)(typeNodeObj);
    if (!typeNodeDeclaration) {
        return;
    }
    if (node.arguments.length > 1) {
        return;
    }
    const classIdArg = node.arguments[0] || factory.createStringLiteral(typeNode.getText());
    let interfaceNode;
    let memberNames;
    if (typescript_1.default.isClassDeclaration(typeNodeDeclaration)) {
        const modifiers = typeNodeDeclaration.modifiers;
        const isAbstract = !!modifiers && modifiers.some(it => it.kind === typescript_1.default.SyntaxKind.AbstractKeyword);
        if (!isAbstract) {
            return factory.createCallExpression(node.expression, [], [classIdArg, factory.createRegularExpressionLiteral(typeNode.getText())]);
        }
        interfaceNode = typeChecker.getTypeAtLocation(typeNodeDeclaration);
        memberNames = typeNodeDeclaration.members
            .filter(it => !!it.name)
            .map(it => { var _a; return (_a = it.name) === null || _a === void 0 ? void 0 : _a.getText(); })
            .filter(Boolean);
    }
    else {
        interfaceNode = typeChecker.getTypeFromTypeNode(typeNode);
    }
    if (!interfaceNode) {
        return;
    }
    let variable = variablesMap.get(interfaceNode);
    if (!variable) {
        if (!memberNames || memberNames.length === 0) {
            memberNames = (0, utils_1.getMethodMembersFrom)(typeChecker, interfaceNode).map(it => it.getName());
        }
        variable = variable || (0, utils_1.createMemberNamesvariable)(typeNode.getText() + 'Members', memberNames, factory);
        variablesMap.set(interfaceNode, variable);
    }
    return factory.createCallExpression(node.expression, [], [classIdArg, variable.name]);
}
function handleDefClassMethod(node, typeChecker, options, factory) {
    var _a;
    const classIdentifier = node.arguments[0];
    const classSymbol = typeChecker.getSymbolAtLocation(classIdentifier);
    if (!classSymbol) {
        return;
    }
    let classId;
    if (options.classIdStrategy === 'first-interface') {
        const classDec = classSymbol.valueDeclaration;
        if (classDec.heritageClauses && classDec.heritageClauses.length > 0) {
            for (const clause of classDec.heritageClauses) {
                const expression = (_a = clause.types[0]) === null || _a === void 0 ? void 0 : _a.expression;
                const symbol = expression && typeChecker.getSymbolAtLocation(expression);
                const declarations = symbol === null || symbol === void 0 ? void 0 : symbol.getDeclarations();
                const declaration = declarations ? declarations[0] : undefined;
                if (!!symbol && !!declaration && typescript_1.default.isInterfaceDeclaration(declaration)) {
                    classId = symbol.getName();
                    break;
                }
            }
        }
    }
    else if (options.classIdStrategy === 'first-parent') {
        const classDec = classSymbol.valueDeclaration;
        if (classDec.heritageClauses && classDec.heritageClauses.length > 0) {
            const firstHeritageClause = classDec.heritageClauses[0];
            const expression = firstHeritageClause === null || firstHeritageClause === void 0 ? void 0 : firstHeritageClause.types[0].expression;
            const symbol = expression && typeChecker.getSymbolAtLocation(expression);
            if (!!symbol) {
                classId = symbol.getName();
            }
        }
    }
    if (!classId) {
        classId = classSymbol.getName();
    }
    const classIdArg = factory.createStringLiteral(classId);
    return factory.createCallExpression(node.expression, [], [classIdArg, classIdentifier]);
}
function handleDefMethodMethod(node, factory) {
    const arg0 = node.arguments[0];
    if (typescript_1.default.isIdentifier(arg0)) {
        const methodId = factory.createStringLiteral(arg0.text);
        return factory.createCallExpression(node.expression, [], [methodId, arg0]);
    }
    else if (typescript_1.default.isFunctionExpression(arg0) && arg0.name) {
        const methodId = factory.createStringLiteral(arg0.name.text);
        return factory.createCallExpression(node.expression, [], [methodId, arg0]);
    }
}
//# sourceMappingURL=index.js.map