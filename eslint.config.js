import { existsSync, readFileSync } from 'node:fs'
import antfu from '@antfu/eslint-config'

// apps/web 由 unplugin-auto-import 生成的全局名单（vite dev/build 时更新）
const autoImportFile = new URL('./apps/web/.eslintrc-auto-import.json', import.meta.url)
const autoImportGlobals = existsSync(autoImportFile)
  ? JSON.parse(readFileSync(autoImportFile, 'utf-8')).globals
  : {}

export default antfu(
  {
    unocss: true,
    formatters: true,
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'apps/server/data/**',
      'apps/server/generated/**',
      'apps/server/prisma/migrations/**',
      'apps/docs/.vitepress/cache/**',
      'apps/web/.eslintrc-auto-import.json',
    ],
  },
  {
    files: ['apps/web/**'],
    languageOptions: {
      globals: { ...autoImportGlobals },
    },
  },
  {
    // 同构包不能 import node:process（需兼容浏览器），经 globalThis.process 带守卫访问
    files: ['packages/request/**'],
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
  {
    // 服务端与种子脚本允许 console 输出日志
    files: ['apps/server/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // 测试运行器用 Node 内置 node:test（M6 决策点 1：零依赖、离线可用），关闭 vitest 假设
    files: ['**/tests/**'],
    rules: {
      'test/no-import-node-test': 'off',
    },
  },
)
