"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const path_1 = tslib_1.__importDefault(require("path"));
function transformer(program) {
    return (context) => {
        return (file) => visitNodeAndChildren(file, program, context);
    };
}
exports.default = transformer;
function visitNodeAndChildren(node, program, context) {
    return typescript_1.default.visitEachChild(visitNode(node, program), child => visitNodeAndChildren(child, program, context), context);
}
function visitNode(node, program) {
    console.info(node.getText(), node.getSourceFile().fileName);
    const typeChecker = program.getTypeChecker();
    if (isChannelRemoteCallExpression(node, typeChecker)) {
        console.info(node.getFullText());
    }
    return node;
}
const CHANNEL_TS_DIR = path_1.default.resolve(__dirname, '../node_modules/channel-ts');
console.log(CHANNEL_TS_DIR);
function isChannelRemoteCallExpression(node, typeChecker) {
    if (!typescript_1.default.isCallExpression(node)) {
        return false;
    }
    const signature = typeChecker.getResolvedSignature(node);
    if (!signature) {
        return false;
    }
    const declaration = signature.getDeclaration();
    if (!declaration || typescript_1.default.isJSDocSignature(declaration)) {
        return false;
    }
    const sourceFileName = declaration.getSourceFile().fileName;
    console.log(sourceFileName);
    const isDeclaredInChannelTs = sourceFileName.indexOf(CHANNEL_TS_DIR) > -1;
    if (isDeclaredInChannelTs) {
        console.error("channel-ts::", node.getText());
    }
    return false;
}
//# sourceMappingURL=index.js.map