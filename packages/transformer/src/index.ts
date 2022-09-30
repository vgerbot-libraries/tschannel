import { CHANNEL_MODULE_NAME, DEFAULT_TRANSFORMER_OPTIONS } from './consts';
import { createMemberNamesvariable, getMethodMembersFrom, getTypeNodeDecration } from './utils';
import ts, { factory } from 'typescript';
import { ChannelProgramContext } from './ChannelProgramContext';
import { TransformerOptions } from './TransformerOptions';

export { TransformerOptions };

export function channelTransformerFactory(
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
    options: Partial<TransformerOptions>
): undefined | ts.Node | Array<ts.Node> {
    const variablesMap = programCtx.variablesMap;
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== CHANNEL_MODULE_NAME) {
            return;
        }
        programCtx.recordChannelSymbolIfPossible(node);
    } else if (ts.isVariableDeclaration(node)) {
        programCtx.recordChannelVariableIfPossible(node);
    } else if (ts.isBinaryExpression(node)) {
        programCtx.recordChannelVariableByBinaryExpression(node);
    } else if (ts.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if (ts.isPropertyAccessExpression(propertyExpression)) {
            if (programCtx.isAccessingTheGetClassMethod(node, propertyExpression)) {
                return handleGetClassMethod(node, typeChecker, factory, variablesMap);
            } else if (programCtx.isAccessingDefClassMethod(node, propertyExpression)) {
                return handleDefClassMethod(node, typeChecker, options, factory);
            } else if (programCtx.isAccessingDefMethodMethod(node, propertyExpression)) {
                return handleDefMethodMethod(node, factory);
            }
        }
    }
}

function handleGetClassMethod(
    node: ts.CallExpression,
    typeChecker: ts.TypeChecker,
    factory: ts.NodeFactory,
    variablesMap: Map<ts.Type, ts.VariableDeclaration>
) {
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
        memberNames = typeNodeDeclaration.members
            .filter((it) => !!it.name)
            .map((it) => it.name?.getText())
            .filter(Boolean) as string[];
    } else {
        interfaceNode = typeChecker.getTypeFromTypeNode(typeNode);
    }
    if (!interfaceNode) {
        return;
    }
    let variable = variablesMap.get(interfaceNode);
    if (!variable) {
        if (!memberNames || memberNames.length === 0) {
            memberNames = getMethodMembersFrom(typeChecker, interfaceNode).map((it) => it.getName());
        }
        variable = variable || createMemberNamesvariable(typeNode.getText() + 'Members', memberNames, factory);
        variablesMap.set(interfaceNode, variable);
    }

    return factory.createCallExpression(node.expression, [], [classIdArg, variable.name as ts.Identifier]);
}


function handleDefClassMethod(
    node: ts.CallExpression,
    typeChecker: ts.TypeChecker,
    options: Partial<TransformerOptions>,
    factory: ts.NodeFactory
) {
    const classIdentifier = node.arguments[0] as ts.Identifier;
    const classSymbol = typeChecker.getSymbolAtLocation(classIdentifier);
    if (!classSymbol) {
        return;
    }
    let classId!: string;
    if (options.classIdStrategy === 'first-interface') {
        const classDec = classSymbol.valueDeclaration as ts.ClassDeclaration;
        if (classDec.heritageClauses && classDec.heritageClauses.length > 0) {
            for (const clause of classDec.heritageClauses) {
                const expression = clause.types[0]?.expression;
                const symbol = expression && typeChecker.getSymbolAtLocation(expression);
                const declarations = symbol?.getDeclarations();
                const declaration = declarations ? declarations[0] : undefined;
                if (!!symbol && !!declaration && ts.isInterfaceDeclaration(declaration)) {
                    classId = symbol.getName();
                    break;
                }
            }
        }
    } else if (options.classIdStrategy === 'first-parent') {
        const classDec = classSymbol.valueDeclaration as ts.ClassDeclaration;
        if (classDec.heritageClauses && classDec.heritageClauses.length > 0) {
            const firstHeritageClause = classDec.heritageClauses[0];
            const expression = firstHeritageClause?.types[0].expression;
            const symbol = expression && typeChecker.getSymbolAtLocation(expression);
            const declarations = symbol?.getDeclarations();
            const declaration = declarations ? declarations[0] : undefined;
            if (!!symbol && !!declaration && ts.isInterfaceDeclaration(declaration)) {
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

function handleDefMethodMethod(node: ts.CallExpression, factory: any) {
    const arg0 = node.arguments[0];
    if (ts.isIdentifier(arg0)) {
        const methodId = factory.createStringLiteral(arg0.text);
        return factory.createCallExpression(node.expression, [], [methodId, arg0]);
    } else if (ts.isFunctionExpression(arg0)) {
        const methodId = factory.createStringLiteral(arg0.name!.text);
        return factory.createCallExpression(node.expression, [], [methodId, arg0]);
    }
}
