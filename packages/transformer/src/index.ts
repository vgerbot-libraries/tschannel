import ts from 'typescript';

class ChannelProgramContext {
    public channelClassSymbol?: ts.Symbol;
    public rclassSymbol?: ts.Symbol;
    public sourceFileNode!: ts.SourceFile;
    public interfaceImplMap: Map<ts.Symbol, ts.ClassDeclaration> = new Map();
}

const CHANNEL_MODULE_NAME = '@vgerbot/channel';

export interface TransformerOptions {
};

const DEFAULT_TRANSFORMER_OPTIONS = {
};

export default function transformer(program: ts.Program, options?: Partial<TransformerOptions>): ts.TransformerFactory<ts.SourceFile> {
    const resolvedOptions = {
        ...DEFAULT_TRANSFORMER_OPTIONS,
        ...(options || {})
    };
    return (context: ts.TransformationContext) => {
        return (file: ts.Node) => {
            const programCtx = new ChannelProgramContext();
            const sourceFileNode = ts.visitEachChild(file, visitor, context) as ts.SourceFile;
            return ts.factory.updateSourceFile(
                sourceFileNode, [
                    ...sourceFileNode.statements,
                    ...programCtx.interfaceImplMap.values()
                ]
            );

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
            }) as ts.ImportSpecifier;
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
            if(node.arguments.length > 1) {
                return;
            }
            let classIdArg = node.arguments[0];
            if(!classIdArg) {
                classIdArg = factory.createStringLiteral(typeNode.getText())
            }
            const className = factory.createUniqueName(typeNode.getText()+'Impl');
            let memberNames: string[];
            if(ts.isClassDeclaration(typeNodeDeclaration)) {
                const modifiers = (typeNodeDeclaration as ts.ClassDeclaration).modifiers;
                const isAbstract = !!modifiers && modifiers.some(it => it.kind === ts.SyntaxKind.AbstractKeyword);
                if(!isAbstract) {
                    return factory.createCallExpression(node.expression, [], [
                        classIdArg,
                        factory.createRegularExpressionLiteral(typeNode.getText())
                    ]);
                }
                memberNames = typeNodeDeclaration.members
                    .filter(it => !!it.name)
                    .map(it => {
                        return it.name!.getText();
                    });
            } else {
                // const classIdentifier = createRemoteClassExpression(typeNode, typeChecker, factory, programCtx);
                const type = typeChecker.getTypeFromTypeNode(typeNode);
                const members = typeChecker.getPropertiesOfType(type);
                memberNames = members
                    .filter(it => ts.isMethodSignature(it.valueDeclaration))
                    .map(it => {
                        return it.getName();
                    });
            }

            const classMembers = memberNames.map(it => {
                return factory.createMethodDeclaration(
                    [],
                    [],
                    undefined,
                    it,
                    undefined,
                    [],
                    [],
                    undefined,
                    factory.createBlock([], false)
                );
            })

            const classExpression = factory.createClassExpression(
                [], [], className, [],
                [factory.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [])],
                classMembers
            );

            return factory.createCallExpression(node.expression, [], [
                classIdArg,
                classExpression
            ]);
        }
    }
}
// function createRemoteClassExpression(typeNode: ts.TypeNode, typeChecker: ts.TypeChecker, factory: ts.NodeFactory, programCtx: ChannelProgramContext): ts.Identifier | undefined {
//     const type = typeChecker.getTypeFromTypeNode(typeNode);
//     const symbol = type.getSymbol();
//     if(!symbol) {
//         return;
//     }
//     const typeDeclarations = symbol.declarations;
//     if(typeDeclarations.length === 0) {
//         return;
//     }
//     let classDeclaration: ts.ClassDeclaration;
//     if(programCtx.interfaceImplMap.has(symbol)) {
//         classDeclaration = programCtx.interfaceImplMap.get(symbol) as ts.ClassDeclaration;
//     } else {
//         const members = typeChecker.getPropertiesOfType(type);
//         const classMembers = members
//             .filter(it => ts.isMethodSignature(it.valueDeclaration))
//             .map(it => {
//                 return factory.createMethodDeclaration(
//                     [],
//                     [],
//                     undefined,
//                     it.getName(),
//                     undefined,
//                     [],
//                     [],
//                     undefined,
//                     factory.createBlock([], false)
//                 );
//             });
//         const className = factory.createUniqueName(typeNode.getText()+'Impl');
//         classDeclaration = factory.createClassDeclaration(
//             [], [], className, [],
//             [factory.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [])],
//             classMembers
//         );
//         programCtx.interfaceImplMap.set(symbol, classDeclaration);
//     }
//     return classDeclaration.name;
// }
