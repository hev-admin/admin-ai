function pad(value) {
  return String(value).padStart(2, '0')
}

/** ISO 时间字符串 → `YYYY-MM-DD HH:mm:ss` 本地时间显示（列表用） */
export function formatDateTime(value) {
  if (!value)
    return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return '—'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
