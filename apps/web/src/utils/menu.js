/**
 * 在菜单树中查找 path 所在节点的祖先链（含自身），供面包屑渲染与侧边栏默认展开。
 * 未命中返回空数组。
 */
export function findMenuChain(nodes, path) {
  for (const node of nodes || []) {
    if (node.path === path)
      return [node]
    if (node.children?.length) {
      const chain = findMenuChain(node.children, path)
      if (chain.length)
        return [node, ...chain]
    }
  }
  return []
}
