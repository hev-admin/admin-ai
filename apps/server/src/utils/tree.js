/**
 * 将平铺列表按 parentId 组装为树；入参顺序即兄弟节点顺序
 * （调用方先按 sort 升序排好，REQUIREMENTS §4.5）。
 */
export function buildTree(items, { idKey = 'id', parentKey = 'parentId', childrenKey = 'children' } = {}) {
  const nodeMap = new Map()
  const roots = []
  items.forEach((item) => {
    nodeMap.set(item[idKey], { ...item, [childrenKey]: [] })
  })
  nodeMap.forEach((node) => {
    const parent = node[parentKey] ? nodeMap.get(node[parentKey]) : null
    if (parent)
      parent[childrenKey].push(node)
    else
      roots.push(node)
  })
  return roots
}
