import { common } from './common.js'
import { dashboard } from './dashboard.js'
import { exception } from './exception.js'
import { layout } from './layout.js'
import { login } from './login.js'
import { menu } from './menu.js'
import { profile } from './profile.js'
import { system } from './system.js'

// 语言包按模块拆分（§10），统一平铺合并；与 en-US 键集保持一致（收尾脚本校验）
export default {
  ...common,
  ...menu,
  ...layout,
  ...login,
  ...system,
  ...dashboard,
  ...profile,
  ...exception,
}
