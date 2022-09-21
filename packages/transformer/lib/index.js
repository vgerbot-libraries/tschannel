"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importStar(require("typescript"));
const utils_1 = require("./utils");
const consts_1 = require("./consts");
const ChannelProgramContext_1 = require("./ChannelProgramContext");
function transformer(program, options) {
    const resolvedOptions = Object.assign(Object.assign({}, consts_1.DEFAULT_TRANSFORMER_OPTIONS), (options || {}));
    return (context) => {
        return (file) => {
            const programCtx = new ChannelProgramContext_1.ChannelProgramContext(program.getTypeChecker());
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
exports.default = transformer;
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
    else if (typescript_1.default.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if (typescript_1.default.isPropertyAccessExpression(propertyExpression)) {
            if (!programCtx.is_accessing_get_class_method(node, propertyExpression)) {
                return;
            }
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
                const isAbstract = !!modifiers && modifiers.some((it) => it.kind === typescript_1.default.SyntaxKind.AbstractKeyword);
                if (!isAbstract) {
                    return factory.createCallExpression(node.expression, [], [classIdArg, factory.createRegularExpressionLiteral(typeNode.getText())]);
                }
                interfaceNode = typeChecker.getTypeAtLocation(typeNodeDeclaration);
                memberNames = typeNodeDeclaration.members.filter((it) => !!it.name).map((it) => it.name.getText());
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
    }
}
//# sourceMappingURL=index.js.map