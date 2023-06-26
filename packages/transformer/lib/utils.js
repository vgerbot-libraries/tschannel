"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeArguments = exports.getMethodMembersFrom = exports.createMemberNamesvariable = exports.getTypeNodeDecration = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
function getTypeNodeDecration(typeNodeObj) {
    var _a;
    let declarations;
    if (!!typeNodeObj.aliasSymbol) {
        declarations = typeNodeObj.aliasSymbol.getDeclarations();
    }
    else {
        declarations = (_a = typeNodeObj.getSymbol()) === null || _a === void 0 ? void 0 : _a.getDeclarations();
    }
    return declarations ? declarations[0] : undefined;
}
exports.getTypeNodeDecration = getTypeNodeDecration;
function createMemberNamesvariable(variableName, memberNames, factory) {
    const memberNameLiterals = memberNames.map(it => {
        return factory.createStringLiteral(it);
    });
    const membersArrayExpression = factory.createArrayLiteralExpression(memberNameLiterals);
    const membersVariableName = factory.createUniqueName(variableName);
    return factory.createVariableDeclaration(membersVariableName, undefined, undefined, membersArrayExpression);
}
exports.createMemberNamesvariable = createMemberNamesvariable;
function getMethodMembersFrom(typeChecker, typeNode) {
    const members = typeChecker.getPropertiesOfType(typeNode);
    return members.filter(it => it.valueDeclaration !== undefined && typescript_1.default.isMethodSignature(it.valueDeclaration));
}
exports.getMethodMembersFrom = getMethodMembersFrom;
function getTypeArguments(node) {
    let typeArgs = node.typeArguments;
    if (!typeArgs || typeArgs.length < 1) {
        const original = node.original;
        if (!!original && typescript_1.default.isCallExpression(original)) {
            typeArgs = original.typeArguments;
        }
    }
    return typeArgs;
}
exports.getTypeArguments = getTypeArguments;
//# sourceMappingURL=utils.js.map