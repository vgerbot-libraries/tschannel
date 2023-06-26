import ts from 'typescript';

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
    const memberNameLiterals = memberNames.map(it => {
        return factory.createStringLiteral(it);
    });

    const membersArrayExpression = factory.createArrayLiteralExpression(memberNameLiterals);

    const membersVariableName = factory.createUniqueName(variableName);

    return factory.createVariableDeclaration(membersVariableName, undefined, undefined, membersArrayExpression);
}

export function getMethodMembersFrom(typeChecker: ts.TypeChecker, typeNode: ts.Type) {
    const members = typeChecker.getPropertiesOfType(typeNode);
    return members.filter(it => it.valueDeclaration !== undefined && ts.isMethodSignature(it.valueDeclaration));
}

export function getTypeArguments(node: ts.CallExpression) {
    let typeArgs = node.typeArguments;
    if (!typeArgs || typeArgs.length < 1) {
        const original = (node as any).original;
        if (!!original && ts.isCallExpression(original)) {
            typeArgs = original.typeArguments;
        }
    }
    return typeArgs;
}
