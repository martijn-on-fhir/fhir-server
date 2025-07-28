import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{ts}"]},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules:
      {
        '@typescript-eslint/strict-boolean-expressions': 0,
        '@typescript-eslint/explicit-function-return-type': 2,
        '@typescript-eslint/restrict-template-expressions': 0,
        '@typescript-eslint/no-invalid-void-type': 0,
        '@typescript-eslint/dot-notation': 0,
        '@typescript-eslint/return-await': 0,
        '@typescript-eslint/space-before-function-paren': 0,
        'no-prototype-builtins': 0,
        '@typescript-eslint/no-explicit-any': 0,
        'no-trailing-spaces': [2, {'skipBlankLines': true}],
        'no-multiple-empty-lines': [2, {
          'max': 1,
          'maxEOF': 1
        }],
        'no-console': 0,
        'no-fallthrough': 0,
        'padded-blocks': [0, 'never'],
        'object-curly-spacing': [0, 'always'],
        'padding-line-between-statements': [
          'error',
          {
            blankLine: 'always',
            prev: '*',
            next: 'block'
          },
          {
            blankLine: 'always',
            prev: 'block',
            next: '*'
          },
          {
            blankLine: 'always',
            prev: '*',
            next: 'block-like'
          },
          {
            blankLine: 'always',
            prev: 'block-like',
            next: '*'
          },
        ],
        '@typescript-eslint/naming-convention': [2,
          {
            selector: 'variableLike',
            format: ['camelCase'],
            leadingUnderscore: 'allow'
          },
          {
            selector: 'classMethod',
            format: ['camelCase'],
            leadingUnderscore: 'allow'
          },
          {
            selector: 'classProperty',
            format: ['camelCase'],
            leadingUnderscore: 'allow'
          },
          {
            selector: 'class',
            format: ['PascalCase'],
            leadingUnderscore: 'allow'
          }
        ]
      }
  }
];
