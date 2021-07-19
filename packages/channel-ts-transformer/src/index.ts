import ts from 'typescript';

class ChannelProgramContext {
    public channelClassDeclaration?: ts.ImportSpecifier;
    public channelClassSymbol?: ts.Symbol;
    public channelInstanceSymbols: Array<ts.Symbol> = [];
    public sourceFileNode!: ts.SourceFile;
}

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.Node> {
    return (context: ts.TransformationContext) => {
        return (file: ts.Node) => {
            const programCtx = new ChannelProgramContext();
            programCtx.sourceFileNode = file as ts.SourceFile;
            return visitNodeAndChildren(file, program, context, programCtx);
        };
    };
}

function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, programCtx: ChannelProgramContext): ts.Node {
    return ts.visitEachChild(visitNode(node, program, programCtx), child => visitNodeAndChildren(child, program, context, programCtx), context);
}

function visitNode(node: ts.Node, program: ts.Program, programCtx: ChannelProgramContext): ts.Node {
    const tss = ts;
    const typeChecker = program.getTypeChecker();

    if(ts.isImportDeclaration(node)) {
        if(!ts.isStringLiteral(node.moduleSpecifier)) {
            return node;
        }
        const moduleName = node.moduleSpecifier.text;
        if(moduleName !== 'tschannel') {
            return node;
        }
        const namedImports = node.importClause?.namedBindings;
        if(namedImports && ts.isNamedImports(namedImports)) {
            const channelClassDeclaration = namedImports.elements.find(it => it.getText() === 'Channel');
            if(!channelClassDeclaration) {
                return node;
            }
            programCtx.channelClassDeclaration = channelClassDeclaration;
            programCtx.channelClassSymbol = typeChecker.getSymbolAtLocation(channelClassDeclaration?.getChildAt(0));
        }

    } else if(ts.isNewExpression(node)) {
        const symbol = typeChecker.getSymbolAtLocation(node.expression);

        if(symbol === programCtx.channelClassSymbol) {
            if(ts.isVariableDeclaration(node.parent)) {
                const variabelSymbol = typeChecker.getSymbolAtLocation(node.parent.getChildAt(0));
                if(!variabelSymbol) {
                    return node;
                }
                programCtx.channelInstanceSymbols.push(variabelSymbol);
            }
        }
    } else if(ts.isCallExpression(node)) {
        const firstChild = node.getChildAt(0);
        if(firstChild && ts.isPropertyAccessExpression(firstChild)) {
            const expression = firstChild.expression;
            if(ts.isNewExpression(expression)) {
                const classSymbol = typeChecker.getSymbolAtLocation(expression.expression);
                if(classSymbol !== programCtx.channelClassSymbol) {
                    return node;
                }
                console.log(node.getText(), node);
            } else {
                const symbol = typeChecker.getSymbolAtLocation(firstChild.expression);
                if(!symbol) {
                    return node;
                }
                const index = programCtx.channelInstanceSymbols.indexOf(symbol);
                if(index < 0) {
                    return node;
                }
                const typeArgs = node.typeArguments;
                if(!typeArgs || typeArgs.length < 1) {
                    return node;
                }
                const type = typeArgs[0];
                console.info(node.getText(), node);
            }
        }
    }
    tss.isCallExpression(node);
    return node;
}
// TODO: interface to class
// TODO: hoist class declaration
