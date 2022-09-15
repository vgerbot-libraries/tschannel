import ts, { factory } from 'typescript';

class ChannelProgramContext {
    public channelClassSymbol?: ts.Symbol;
    public remoteClassSymbol?: ts.Symbol;
    public variablesMap = new Map<ts.Type, ts.VariableDeclaration>();
}

const CHANNEL_MODULE_NAME = '@vgerbot/channel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransformerOptions {
    // EMPTY
}

const DEFAULT_TRANSFORMER_OPTIONS = {
    // EMPTY
};

export default function transformer(
    program: ts.Program,
    options?: Partial<TransformerOptions>
): ts.TransformerFactory<ts.SourceFile> {
    const resolvedOptions = {
        ...DEFAULT_TRANSFORMER_OPTIONS,
        ...(options || {})
    };
    return (context: ts.TransformationContext) => {
        return (file: ts.Node) => {
            const programCtx = new ChannelProgramContext();
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
    if (ts.isImportDeclaration(node)) {
        if (!ts.isStringLiteral(node.moduleSpecifier)) {
            return;
        }
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== CHANNEL_MODULE_NAME) {
            return;
        }
        const namedImports = node.importClause?.namedBindings;
        if (namedImports && ts.isNamedImports(namedImports)) {
            const channelClassDeclaration = namedImports.elements.find(it => {
                const propertyName = it.propertyName;
                if (propertyName) {
                    return propertyName.text === 'Channel';
                }
                return it.name.text === 'Channel';
            }) as ts.ImportSpecifier;
            if (!channelClassDeclaration) {
                return;
            }
            const channelClassType = typeChecker.getTypeAtLocation(channelClassDeclaration);
            const channelClassSymbol = channelClassType.getSymbol();
            programCtx.channelClassSymbol = channelClassSymbol;
            programCtx.remoteClassSymbol = channelClassSymbol?.members?.get('get_class' as ts.__String);
        }
    } else if (ts.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if (ts.isPropertyAccessExpression(propertyExpression)) {
            const propertyName = propertyExpression.name.text;
            if (propertyName !== 'get_class') {
                return;
            }
            const propertyType = typeChecker.getTypeAtLocation(propertyExpression);
            if (!propertyType) {
                return;
            }
            const propertySymbol = propertyType.getSymbol();
            if (!propertySymbol || propertySymbol !== programCtx.remoteClassSymbol) {
                return;
            }
            const typeArgs = node.typeArguments;
            if (!typeArgs || typeArgs.length < 1) {
                return;
            }

            const typeNode = typeArgs[0];
            const typeNodeObj = typeChecker.getTypeFromTypeNode(typeNode);
            const declarations = typeNodeObj.getSymbol()?.getDeclarations();
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
            let interfaceNode: ts.Type;
            let memberNames: undefined | string[];
            if (ts.isClassDeclaration(typeNodeDeclaration)) {
                const modifiers = (typeNodeDeclaration as ts.ClassDeclaration).modifiers;
                const isAbstract = !!modifiers && modifiers.some(it => it.kind === ts.SyntaxKind.AbstractKeyword);
                if (!isAbstract) {
                    return factory.createCallExpression(
                        node.expression,
                        [],
                        [classIdArg, factory.createRegularExpressionLiteral(typeNode.getText())]
                    );
                }
                interfaceNode = typeChecker.getTypeAtLocation(typeNodeDeclaration);
                memberNames = typeNodeDeclaration.members.filter(it => !!it.name).map(it => it.name!.getText());
            } else {
                interfaceNode = typeChecker.getTypeFromTypeNode(typeNode);
            }
            if (!interfaceNode) {
                return;
            }
            let variable = variablesMap.get(interfaceNode);
            if (!variable) {
                const members = typeChecker.getPropertiesOfType(interfaceNode);
                if (!memberNames || memberNames.length === 0) {
                    memberNames = members
                        .filter(it => it.valueDeclaration !== undefined && ts.isMethodSignature(it.valueDeclaration))
                        .map(it => {
                            return it.getName();
                        });
                }

                const memberNameLiterals = memberNames.map(it => {
                    return factory.createStringLiteral(it);
                });

                const membersArrayExpression = factory.createArrayLiteralExpression(memberNameLiterals);

                const membersVariableName = factory.createUniqueName(typeNode.getText() + 'Members');

                variable = factory.createVariableDeclaration(
                    membersVariableName,
                    undefined,
                    undefined,
                    membersArrayExpression
                );
                variablesMap.set(interfaceNode, variable);
            }

            return factory.createCallExpression(node.expression, [], [classIdArg, variable.name as ts.Identifier]);
        }
    }
}
