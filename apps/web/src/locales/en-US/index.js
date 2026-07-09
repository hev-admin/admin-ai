import { common } from './common.js'
import { dashboard } from './dashboard.js'
import { exception } from './exception.js'
import { layout } from './layout.js'
import { login } from './login.js'
import { menu } from './menu.js'
import { profile } from './profile.js'
import { system } from './system.js'

// Flat-key merge; key set must stay identical with zh-CN (checked by a script at milestone wrap-up)
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
