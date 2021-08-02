import ts from 'typescript';

class ChannelProgramContext {
    public channelClassSymbol?: ts.Symbol;
    public rclassSymbol?: ts.Symbol;
    public sourceFileNode!: ts.SourceFile;
    public isChannelType(node: ts.Node) {

    }
}

const CHANNEL_MODULE_NAME = '@tschannel/core';

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
            const channelClassDeclaration = namedImports.elements.find((it) => {
                const propertyName = it.propertyName;
                if(propertyName) {
                    return propertyName.text === 'Channel';
                }
                return it.name.text === 'Channel'
            });
            if (!channelClassDeclaration) {
                return;
            }
            const channelClassType = typeChecker.getTypeAtLocation(channelClassDeclaration);
            const channelClassSymbol = channelClassType.getSymbol();
            programCtx.channelClassSymbol = channelClassSymbol;
            programCtx.rclassSymbol = channelClassSymbol?.members?.get('rclass' as ts.__String);
        }
    } else if (ts.isCallExpression(node)) {
        const propertyExpression = node.expression;
        if(ts.isPropertyAccessExpression(propertyExpression)) {
            const propertyName = propertyExpression.name.text;
            if(propertyName !== 'rclass') {
                return;
            }
            const propertyType = typeChecker.getTypeAtLocation(propertyExpression);
            if(!propertyType) {
                return;
            }
            const propertySymbol = propertyType.getSymbol();
            if(!propertySymbol || propertySymbol !== programCtx.rclassSymbol) {
                return;
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
