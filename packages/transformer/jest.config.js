module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: './coverage',
    coverageReporters: [
        "text",
        "cobertura",
        "lcov"
    ],
    collectCoverageFrom: [
        "src/**/*.ts"
    ],
    testRegex: /test\/specs\/.+\.spec\.[jt]s$/.source
};
