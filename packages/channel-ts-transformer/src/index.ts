import ts from 'typescript';
import path from 'path';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.Node> {
    return (context: ts.TransformationContext) => {
        return (file: ts.Node) => visitNodeAndChildren(file, program, context);
    };
}

function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
    return ts.visitEachChild(visitNode(node, program), child => visitNodeAndChildren(child, program, context), context);
}

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
    // if(node.getText() === 'channel.rclass') {
    //     debugger;
    // }
    console.info(node.getText(), node.getSourceFile().fileName);
    const typeChecker = program.getTypeChecker();
    if(isChannelRemoteCallExpression(node, typeChecker)) {
        console.info(node.getFullText());
    }
    return node;
}
const CHANNEL_TS_DIR = path.resolve(__dirname, '../node_modules/channel-ts');
console.log(CHANNEL_TS_DIR);

function isChannelRemoteCallExpression(node: ts.Node, typeChecker: ts.TypeChecker): node is ts.CallExpression {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    const signature = typeChecker.getResolvedSignature(node);
    if (!signature) {
        return false;
    }
    const declaration = signature.getDeclaration();
    if(!declaration || ts.isJSDocSignature(declaration)) {
        return false;
    }
    const sourceFileName = declaration.getSourceFile().fileName;
    console.log(sourceFileName);
    const isDeclaredInChannelTs = sourceFileName.indexOf(CHANNEL_TS_DIR) > -1;
    if(isDeclaredInChannelTs) {
        console.error("channel-ts::", node.getText());
    }
    return false;
}
