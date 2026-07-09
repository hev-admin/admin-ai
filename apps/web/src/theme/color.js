function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? [...value].map(ch => ch + ch).join('') : value
  const num = Number.parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHex(rgb) {
  return `#${rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

function mix(hex, other, weight) {
  const from = hexToRgb(hex)
  const to = hexToRgb(other)
  return rgbToHex(from.map((v, i) => v + (to[i] - v) * weight))
}

/** 主色派生 hover / pressed 变体用的轻量色彩工具，避免引入色彩库 */
export function lighten(hex, weight = 0.1) {
  return mix(hex, '#ffffff', weight)
}

export function darken(hex, weight = 0.1) {
  return mix(hex, '#000000', weight)
}
