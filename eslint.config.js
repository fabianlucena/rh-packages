/* eslint-disable no-magic-numbers */

import globals from 'globals';
import mochaPlugin from 'eslint-plugin-mocha';
import pluginJs from '@eslint/js';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  pluginJs.configs.all,
  mochaPlugin.configs.flat.all,
  {
    rules: {
      'class-methods-use-this': 'off',
      'func-style': 'off',
      'indent': ['error', 2],
      'linebreak-style': ['error', 'windows'],
      'no-empty': 'error',
      'no-ternary': 'off',
      'no-undef': 'error',
      'no-undef-init': 'error',
      'no-underscore-dangle': 'off',
      'no-unused-vars': 'error',
      'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
      'one-var': 'off',
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'semi': ['error', 'always'],
      'sort-imports': 'off',
      'sort-keys': 'off',
      'sort-vars': 'off',
    }
  }
];