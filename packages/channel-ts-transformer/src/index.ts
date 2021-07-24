import ts from 'typescript';

class ChannelProgramContext {
    public channelClassDeclaration?: ts.ImportSpecifier;
    public channelClassSymbol?: ts.Symbol;
    public channelInstanceDeclarations: Array<ts.Declaration> = [];
    public sourceFileNode!: ts.SourceFile;
}

const CHANNEL_MODULE_NAME = 'tschannel';

export interface TransformerOptions {
};

const DEFAULT_TRANSFORMER_OPTIONS = {
};

export default function transformer(program: ts.Program, options?: Partial<TransformerOptions>): ts.TransformerFactory<ts.Node> {
    const resolvedOptions = {
        ...DEFAULT_TRANSFORMER_OPTIONS,
        ...(options || {})
    };
    return (context: ts.TransformationContext) => {
        return (file: ts.Node) => {
            const programCtx = new ChannelProgramContext();
            programCtx.sourceFileNode = file as ts.SourceFile;
            return ts.visitEachChild(file, visitor, context);

            function visitor(node: ts.Node): ts.Node | Array<ts.Node> {
                const ret = visitNode(node, program, programCtx, context, resolvedOptions);
                if(!ret) {
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
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if(ts.isPropertyAssignment(node)) {
        resolveInitializerExpression(node, typeChecker, programCtx);
    } else if((ts.isParameter(node) || ts.isPropertyDeclaration(node) || ts.isVariableDeclaration(node))) {
        const type = node.type as ts.TypeReferenceNode | null;
        if(type) {
            const typeSymbol = typeChecker.getSymbolAtLocation(type.typeName);
            if(typeSymbol === programCtx.channelClassSymbol) {
                const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
                if(!variableSymbol) {
                    return;
                }
                programCtx.channelInstanceDeclarations.push(variableSymbol.valueDeclaration);
            }
        } else if(node.initializer) {
            resolveInitializerExpression(node, typeChecker, programCtx);
        }
    } else if (ts.isImportDeclaration(node)) {
        if (!ts.isStringLiteral(node.moduleSpecifier)) {
            return;
        }
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== CHANNEL_MODULE_NAME) {
            return;
        }
        const namedImports = node.importClause?.namedBindings;
        if (namedImports && ts.isNamedImports(namedImports)) {
            const channelClassDeclaration = namedImports.elements.find((it) => it.getText() === 'Channel');
            if (!channelClassDeclaration) {
                return;
            }
            programCtx.channelClassDeclaration = channelClassDeclaration;
            programCtx.channelClassSymbol = typeChecker.getSymbolAtLocation(
                channelClassDeclaration?.getChildAt(0)
            );
        }
    } else if (ts.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if(ts.isPropertyAccessExpression(propertyExpression)) {
            const propertyName = propertyExpression.name.text;
            if(propertyName !== 'rclass') {
                return;
            }
            const ownerExpression = propertyExpression.expression;
            if(ts.isNewExpression(ownerExpression)) {
                const classSymbol = typeChecker.getSymbolAtLocation(ownerExpression.expression);
                if (classSymbol !== programCtx.channelClassSymbol) {
                    return;
                }
            } else {
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
            const declarations = typeNodeObj.getSymbol()?.getDeclarations();
            if(!declarations || declarations.length < 1) {
                return;
            }
            const typeNodeDeclaration = declarations[0];
            if(!typeNodeDeclaration) {
                return;
            }
            let classIdArg = node.arguments[0];
            if(!classIdArg) {
                classIdArg = factory.createStringLiteral(typeNode.getText())
            }
            if(ts.isClassDeclaration(typeNodeDeclaration)) {
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
function createRemoteClassExpression(typeNode: ts.TypeNode, typeChecker: ts.TypeChecker, factory: ts.NodeFactory) {
    const className = ts.factory.createUniqueName(typeNode.getText());
    const type = typeChecker.getTypeFromTypeNode(typeNode);
    const members = typeChecker.getPropertiesOfType(type);
    const classMembers = members
        .filter(it => ts.isMethodSignature(it.valueDeclaration))
        .map(it => {
            return factory.createMethodDeclaration(
                [],
                [],
                undefined,
                it.getName(),
                undefined,
                [],
                [],
                undefined,
                factory.createBlock([], false)
            );
        });
    const classExpression = factory.createClassExpression(
        [],
        [],
        className,
        [],
        [ts.factory.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [])],
        classMembers
    );
    return classExpression;
}

function resolveInitializerExpression(
    node: ts.PropertyAssignment | ts.ParameterDeclaration | ts.PropertyDeclaration | ts.VariableDeclaration,
    typeChecker: ts.TypeChecker,
    programCtx: ChannelProgramContext
) {
    const initializer = node.initializer;
    if(!initializer) {
        return;
    }
    if(ts.isNewExpression(initializer)) {
        const typeSymbol = typeChecker.getSymbolAtLocation(initializer.expression);
        if(typeSymbol === programCtx.channelClassSymbol) {
            const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
            if(!variableSymbol) {
                return;
            }
            programCtx.channelInstanceDeclarations.push(variableSymbol.valueDeclaration);
        }
    }
}
