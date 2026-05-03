// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
    expoConfig,
    prettierConfig,
    {
        plugins: { prettier: prettierPlugin },
        rules: {
            'prettier/prettier': [
                'warn',
                {
                    semi: true,
                    singleQuote: true,
                    trailingComma: 'all',
                    tabWidth: 2,
                    printWidth: 120,
                },
            ],
        },
    },
    {
        ignores: ['dist/*'],
    },
]);
