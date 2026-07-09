/**
 * 可空字符串字段归一：'' / undefined → null（表单按「完整提交」语义，空值即清空）。
 * 配合 z.preprocess 使用：`z.preprocess(emptyToNull, z.string().nullable())`
 */
export function emptyToNull(value) {
  return value === '' || value === undefined ? null : value
}
