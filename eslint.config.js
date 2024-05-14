/* eslint-disable no-magic-numbers */

import globals from 'globals';
import mochaPlugin from 'eslint-plugin-mocha';
import pluginJs from '@eslint/js';
import pluginNode from 'eslint-plugin-node';

export default [
  {
    languageOptions: {
      globals: globals.browser
    }
  },
  pluginJs.configs.all,
  mochaPlugin.configs.flat.all,
  pluginNode.configs.all,
  {
    rules: {
      'func-style': 'off',
      'indent': ['error', 2],
      'linebreak-style': ['error', 'windows'],
      'no-empty': 'error',
      'no-ternary': 'off',
      'no-undef': 'error',
      'no-undef-init': 'error',
      'no-unused-vars': 'error',
      'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      'semi': ['error', 'always']
    }
  }
];