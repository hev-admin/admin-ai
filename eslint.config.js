import { readFileSync } from 'node:fs'
import antfu from '@antfu/eslint-config'

const autoImportGlobals = JSON.parse(
  readFileSync('./packages/frontend/.eslintrc-auto-import.json', 'utf-8'),
)

export default antfu({
  vue: true,
  // unocss: {
  //   configFile: './packages/frontend/uno.config.js',
  // },
  javascript: {
    overrides: {
      'no-console': 'warn',
    },
  },
  formatters: {
    css: true,
    html: true,
    markdown: true,
  },
}, {
  files: ['packages/frontend/**/*.{js,vue}'],
  languageOptions: {
    globals: autoImportGlobals.globals,
  },
}, {
  files: ['packages/backend/**/*.js'],
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  },
})
