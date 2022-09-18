import ts from 'typescript';
import { CHANNEL_MODULE_NAME } from './consts';

export function getTypeNodeDecration(typeNodeObj: ts.Type) {
    let declarations;
    if (!!typeNodeObj.aliasSymbol) {
        declarations = typeNodeObj.aliasSymbol.getDeclarations();
    } else {
        declarations = typeNodeObj.getSymbol()?.getDeclarations();
    }

    return declarations ? declarations[0] : undefined;
}

export function createMemberNamesvariable(variableName: string, memberNames: string[], factory: ts.NodeFactory) {
    const memberNameLiterals = memberNames.map((it) => {
        return factory.createStringLiteral(it);
    });

    const membersArrayExpression = factory.createArrayLiteralExpression(memberNameLiterals);

    const membersVariableName = factory.createUniqueName(variableName);

    return factory.createVariableDeclaration(
        membersVariableName,
        undefined,
        undefined,
        membersArrayExpression
    );
}

export function getMethodMembersFrom(typeChecker: ts.TypeChecker, typeNode: ts.Type) {
    const members = typeChecker.getPropertiesOfType(typeNode);
    return members.filter((it) => it.valueDeclaration !== undefined && ts.isMethodSignature(it.valueDeclaration));
}

export function getSymbolFromChannel(program: ts.Program, name: string) {
    const typeChecker = program.getTypeChecker();

    const source = program.getSourceFile(`/${CHANNEL_MODULE_NAME}.ts`);
    if (!source) {
        return;
    }
    const symbol = typeChecker.getSymbolAtLocation(source);
    if (!symbol) {
        return;
    }
    const exports = typeChecker.getExportsOfModule(symbol);
    const ChannelClassSymbol = exports.find((it) => {
        return it.getName() === 'Channel';
    });
    return ChannelClassSymbol?.members?.get(name as ts.__String);
}
