module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'prettier'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: [
        'node'
    ],
    rules: {
        // Règles générales
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': ['error', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],

        // Règles de style
        'indent': ['error', 2],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],

        // Règles Node.js
        'node/no-unpublished-require': 'off',
        'node/no-missing-require': 'error',
        'node/no-extraneous-require': 'error',

        // Règles de sécurité
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',

        // Règles async/await
        'no-async-promise-executor': 'error',
        'no-await-in-loop': 'warn',
        'prefer-promise-reject-errors': 'error',

        // Règles de performance
        'no-loop-func': 'error',
        'no-inner-declarations': 'error'
    },
    overrides: [
        {
            files: ['tests/**/*.js', '**/*.test.js'],
            env: {
                jest: true
            },
            rules: {
                'no-console': 'off'
            }
        },
        {
            files: ['frontend/**/*.js', 'frontend/**/*.jsx'],
            env: {
                browser: true,
                node: false
            },
            extends: [
                'eslint:recommended',
                'prettier'
            ],
            rules: {
                'no-undef': 'error'
            }
        }
    ]
};
