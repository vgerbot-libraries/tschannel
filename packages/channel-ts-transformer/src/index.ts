import ts from 'typescript';

class ChannelProgramContext {
    public channelClassDeclaration?: ts.ImportSpecifier;
    public channelClassSymbol?: ts.Symbol;
    public channelInstanceSymbols: Array<ts.Symbol> = [];
    public sourceFileNode!: ts.SourceFile;
    public readonly localStack = new LocalStack();
}

class LocalStack {
    private readonly locals: Array<Map<string, ts.Symbol>> = [];
    put(locals: Map<string, ts.Symbol>) {
        this.locals.unshift(locals);
    }
    pop() {
        this.locals.shift();
    }
    get(name: string): ts.Symbol | undefined {
        const scopeLocals = this.locals.find(it => it.has(name));
        if(scopeLocals) {
            return scopeLocals.get(name);
        }
    }
    clear() {
        this.locals.length = 0;
    }
}

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.Node> {
    return (context: ts.TransformationContext) => {
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
    const tss = ts;
    const typeChecker = program.getTypeChecker();
    const factory = context.factory;

    if (ts.isImportDeclaration(node)) {
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
    } else if (ts.isNewExpression(node)) {
        const symbol = typeChecker.getSymbolAtLocation(node.expression);

        if (symbol === programCtx.channelClassSymbol) {
            if (ts.isVariableDeclaration(node.parent)) {
                const variabelSymbol = typeChecker.getSymbolAtLocation(node.parent.getChildAt(0));
                if (!variabelSymbol) {
                    return;
                }
                programCtx.channelInstanceSymbols.push(variabelSymbol);
            }
        }
    } else if (ts.isCallExpression(node)) {
        const firstChild = node.getChildAt(0);
        if (firstChild && ts.isPropertyAccessExpression(firstChild)) {
            const expression = firstChild.expression;
            if (ts.isNewExpression(expression)) {
                const classSymbol = typeChecker.getSymbolAtLocation(expression.expression);
                if (classSymbol !== programCtx.channelClassSymbol) {
                    return;
                }
            } else {
                const symbol = typeChecker.getSymbolAtLocation(firstChild.expression);
                if (!symbol) {
                    return;
                }
                const index = programCtx.channelInstanceSymbols.indexOf(symbol);
                if (index < 0) {
                    return;
                }
            }
            const typeArgs = node.typeArguments;
            if (!typeArgs || typeArgs.length < 1) {
                return;
            }
            console.log(node.getText(), node);

            const typeNode = typeArgs[0];
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
                        it.name,
                        undefined,
                        [],
                        [], // parameters
                        undefined,
                        undefined
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
            console.info(typeNode.getText(), members.map(it => it.getName()));
            return factory.createCallExpression(node.expression, [], [
                classExpression
            ]);
        }
    }
}
// TODO: interface to class
// TODO: hoist class declaration
