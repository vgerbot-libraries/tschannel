import ts from 'typescript';

class ChannelProgramContext {
    public channelClassDeclaration?: ts.ImportSpecifier;
    public channelClassSymbol?: ts.Symbol;
    public channelInstanceDeclarations: Array<ts.Declaration> = [];
    public sourceFileNode!: ts.SourceFile;
}

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.Node> {
    // console.log('create transformer', program);
    return (context: ts.TransformationContext) => {
        // console.log('transformer context', context);
        return (file: ts.Node) => {
            const programCtx = new ChannelProgramContext();
            programCtx.sourceFileNode = file as ts.SourceFile;
            return ts.visitEachChild(file, visitor, context);

            function visitor(node: ts.Node): ts.Node | Array<ts.Node> {
                const ret = visitNode(node, program, programCtx, context);
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
    context: ts.TransformationContext
): undefined | ts.Node | Array<ts.Node> {
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;
    if(ts.isPropertyAssignment(node)) {
        const initializer = node.initializer;
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
    } if((ts.isParameter(node) || ts.isPropertyDeclaration(node) || ts.isVariableDeclaration(node)) && node.type) {
        const type = node.type as ts.TypeReferenceNode;
        const typeSymbol = typeChecker.getSymbolAtLocation(type.typeName);
        if(typeSymbol === programCtx.channelClassSymbol) {
            const variableSymbol = typeChecker.getSymbolAtLocation(node.name);
            if(!variableSymbol) {
                return;
            }
            programCtx.channelInstanceDeclarations.push(variableSymbol.valueDeclaration);
        }
    } else if (ts.isImportDeclaration(node)) {
        if (!ts.isStringLiteral(node.moduleSpecifier)) {
            return;
        }
        const moduleName = node.moduleSpecifier.text;
        if (moduleName !== 'tschannel') {
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
            const classExpression = createRemoteClassExpression(typeNode, typeChecker, factory);
            let classIdArg = node.arguments[0];
            if(!classIdArg) {
                classIdArg = factory.createStringLiteral(typeNode.getText())
            }
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

