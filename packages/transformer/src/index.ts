import ts, { factory } from 'typescript';
import { getTypeNodeDecration, getMethodMembersFrom, createMemberNamesvariable } from './utils';
import { CHANNEL_MODULE_NAME, DEFAULT_TRANSFORMER_OPTIONS } from './consts';
import { ChannelProgramContext } from './ChannelProgramContext';
import { TransformerOptions } from './TransformerOptions';

export default function transformer(
    program: ts.Program,
    options?: Partial<TransformerOptions>
): ts.TransformerFactory<ts.SourceFile> {
    const resolvedOptions = {
        ...DEFAULT_TRANSFORMER_OPTIONS,
        ...(options || {}),
    };
    return (context: ts.TransformationContext) => {
        return (file: ts.Node) => {
            const programCtx = new ChannelProgramContext(program.getTypeChecker());

            const sourceFileNode = ts.visitEachChild(file, visitor, context) as ts.SourceFile;

            const variableDeclarations = Array.from(programCtx.variablesMap.values());
            const variableStatements =
                variableDeclarations.length > 0 ? [factory.createVariableStatement([], variableDeclarations)] : [];
            return ts.factory.updateSourceFile(sourceFileNode, [...variableStatements, ...sourceFileNode.statements]);

            function visitor(node: ts.Node): ts.Node | Array<ts.Node> {
                const ret = visitNode(node, program, programCtx, context, resolvedOptions);
                if (!ret) {
                    return ts.visitEachChild(node, visitor, context);
                } else {
                    return ret;
                }
            }
        };
    };
}

function visitNode(
    node: ts.Node,
    program: ts.Program,
    programCtx: ChannelProgramContext,
    context: ts.TransformationContext,
    options: TransformerOptions
): undefined | ts.Node | Array<ts.Node> {
    const variablesMap = programCtx.variablesMap;
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        if(moduleName !== CHANNEL_MODULE_NAME) {
            return;
        }
        programCtx.recordChannelSymbolIfPossible(node);
    } else if (ts.isVariableDeclaration(node)) {
        programCtx.recordChannelVariableIfPossible(node);
    } else if(ts.isBinaryExpression(node)) {
        programCtx.recordChannelVariableByBinaryExpression(node);
    } else if (ts.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if (ts.isPropertyAccessExpression(propertyExpression)) {

            if(!programCtx.isAccessingTheGetClassMethod(node, propertyExpression)) {
                return;
            }

            const typeArgs = node.typeArguments;
            if (!typeArgs || typeArgs.length < 1) {
                return;
            }

            const typeNode = typeArgs[0];
            const typeNodeObj = typeChecker.getTypeFromTypeNode(typeNode);

            const typeNodeDeclaration = getTypeNodeDecration(typeNodeObj);
            if (!typeNodeDeclaration) {
                return;
            }
            if (node.arguments.length > 1) {
                return;
            }

            const classIdArg = node.arguments[0] || factory.createStringLiteral(typeNode.getText());

            let interfaceNode: ts.Type;
            let memberNames: undefined | string[];
            if (ts.isClassDeclaration(typeNodeDeclaration)) {
                const modifiers = (typeNodeDeclaration as ts.ClassDeclaration).modifiers;
                const isAbstract = !!modifiers && modifiers.some((it) => it.kind === ts.SyntaxKind.AbstractKeyword);
                if (!isAbstract) {
                    return factory.createCallExpression(
                        node.expression,
                        [],
                        [classIdArg, factory.createRegularExpressionLiteral(typeNode.getText())]
                    );
                }
                interfaceNode = typeChecker.getTypeAtLocation(typeNodeDeclaration);
                memberNames = typeNodeDeclaration.members.filter((it) => !!it.name).map((it) => it.name!.getText());
            } else {
                interfaceNode = typeChecker.getTypeFromTypeNode(typeNode);
            }
            if (!interfaceNode) {
                return;
            }
            let variable = variablesMap.get(interfaceNode);
            if (!variable) {
                if (!memberNames || memberNames.length === 0) {
                    memberNames = getMethodMembersFrom(typeChecker, interfaceNode).map(it => it.getName());
                }
                variable = variable || createMemberNamesvariable(typeNode.getText() + 'Members', memberNames, factory);
                variablesMap.set(interfaceNode, variable);
            }

            return factory.createCallExpression(node.expression, [], [classIdArg, variable.name as ts.Identifier]);
        }
    }
}
