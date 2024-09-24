module.exports = {
    extends: [
        //  Use the recommended rules from the @typescript-eslint/eslint-plugin
        'plugin:@typescript-eslint/recommended',
        // Use eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin
        // that would conflict with prettier
        'prettier',
        // Enables eslint-plugin-prettier and eslint-config-prettier
        'plugin:prettier/recommended'
    ],
    rules: {
        'prettier/prettier': 'error',
        'no-var-require': 'off',
        'no-console': 'off',
        'no-bitwise': 'off',
        quotes: ['error', 'single'],
        'max-len': ['error', 120],
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/ban-types': 'off',
        'arrow-parens': 'off'
    },
    overrides: [
        {
            files: ['*.js'],
            parserOptions: {
                ecmaVersion: 2020,
                parser: null
            },
            rules: {
                '@typescript-eslint/no-var-requires': 'off'
            }
        },
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                    impliedStrict: true
                },
                project: ['./tsconfig.json', 'test/tsconfig.json'],
                tsconfigRootDir: __dirname
            }
        }
    ]
};
