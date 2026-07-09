// UI 无关的主题 token 定义（REQUIREMENTS §8）：
// 仅此处定义设计值，UI 库相关映射见同目录 naive.js；切换 UI 库时 token 不变、只重写映射。

/** 预设主题色（主色切换全局生效）；名称文案见语言包 layout.themeColor.<key> */
export const themePresets = [
  { key: 'blue', color: '#2080f0' },
  { key: 'green', color: '#18a058' },
  { key: 'purple', color: '#722ed1' },
  { key: 'orange', color: '#f0a020' },
  { key: 'red', color: '#d03050' },
  { key: 'cyan', color: '#0fa5ae' },
]

export const defaultPrimaryColor = themePresets[0].color

export const themeTokens = {
  borderRadius: '4px',
}
