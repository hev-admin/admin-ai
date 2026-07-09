import { defineConfig, presetIcons, presetWind3 } from 'unocss'
import { collectMenuIcons } from '../server/seed/data.js'

// 运行时新增菜单图标的手工扩展位（M6 #39）：种子内图标已经 collectMenuIcons 自动
// 派生；经「菜单管理」界面新增的图标存于数据库、静态扫描与种子推导均不可达，需在此登记
const extraSafelist = []

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
  },
  // 菜单图标名存于数据库、运行时动态拼接类名，UnoCSS 静态扫描不可达，需 safelist 兜底。
  // 种子部分从 seed/data.js 单一来源派生（增删图标无需改本文件），运行时新增见 extraSafelist
  safelist: [...collectMenuIcons(), ...extraSafelist],
})
