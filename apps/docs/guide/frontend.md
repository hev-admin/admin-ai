# 前端指南

面向在本模板上做二次开发的场景：新增页面与菜单、使用权限指令、定制主题、新增语言、切换 UI 组件库。

## 新增页面与菜单

菜单即路由：页面能否访问由菜单数据决定（动态路由从 `GET /api/auth/user` 返回的菜单树生成），新增页面 = 创建组件 + 登记菜单节点。

### 1. 创建视图组件

约定路径 `src/views/<模块>/<页面>/index.vue`：

```vue
<script setup>
// 页面逻辑
</script>

<template>
  <div>demo page</div>
</template>
```

页面 SFC 统一叫 `index.vue` 即可——动态路由注册时会把「路由 name」设置为组件的显式 `name`（解决同名推断冲突），KeepAlive 缓存按它匹配，无需手动命名。

### 2. 登记菜单节点

用 super 账号进「系统管理 → 菜单管理」新增（或修改 `apps/server/seed/data.js` 后重新播种）：

| 字段     | 填写                                                                       |
| -------- | -------------------------------------------------------------------------- |
| 类型     | 目录（仅侧边栏分组）/ 菜单（注册路由）/ 按钮（权限码载体）                 |
| 名称     | **i18n key**（如 `menu.demo`），不是最终文案                               |
| 路由路径 | 如 `/demo`；以 `http` 开头视为外链——不注册路由，侧边栏点击新窗口打开       |
| 组件路径 | 相对 `src/views/` 且省略 `.vue`，如 `demo/index`；未实现时回退「建设中」页 |
| 图标     | UnoCSS 图标类名，如 `i-carbon-rocket`（见下方 safelist 注意项）            |
| 隐藏     | 勾选后不出现在侧边栏，但路由仍注册、可直达（如个人中心 `/profile`）        |
| 缓存     | 勾选后页面进入 keep-alive（多标签页往返保留状态）                          |

::: warning 运行时新增的图标需登记 safelist
菜单图标类名存在数据库、运行时动态拼接，UnoCSS 静态扫描不可达。**种子内的图标已自动覆盖**——`apps/web/uno.config.js` 从 `seed/data.js` 派生 safelist（单一来源，改 seed 无需同步）；仅**经菜单管理界面新增**的图标要在 `uno.config.js` 的 `extraSafelist` 中登记，否则不渲染。
:::

### 3. 补语言包

菜单名称是 i18n key，两份语言包都要加（**平铺 key，不要写嵌套对象**——i18n 实例用自定义 `messageResolver` 按整串 key 查找）：

```js
// src/locales/zh-CN/menu.js
export const menu = {
  // ...
  'menu.demo': '演示页面',
}
```

`en-US/menu.js` 同步补齐，zh / en 键集必须一致。

### 4. 按钮级权限（可选）

在菜单节点下挂「按钮」类型子节点，权限码按 `sys:<资源>:<动作>` 约定（如 `demo:export`）；页面内用 `v-permission` 控制显隐，server 对应接口挂 `requirePermission('demo:export')`（见[后端指南](./backend.md#新增接口)），形成前后端双重校验。

### 5. 分配权限并生效

「角色管理 → 分配权限」勾选新节点。生效时机有差异：

- **菜单与前端按钮显隐**：刷新页面即生效（`getUserInfo` 实时查库）；
- **server 端权限校验**：读 JWT 载荷，需重新登录后新 token 才携带新权限码；
- **super 账号**：前后端均短路放行，无需重登。

### 页面内取数与操作

列表页直接组合 Pro\* 组件（三个系统管理页面即范例，`src/views/system/` 可对照参考）：

- **`ProSearchForm`**：`fields` 配置搜索项（`input`（默认）/ `select` / `date`，支持 `field-<key>` 插槽承接特殊控件），`@search` 回调收到压缩掉空值的查询对象；
- **`ProTable`**：`columns` 列配置（支持 `render` 函数、`selection` / `index` 特殊列）+ `fetchData({ page, pageSize })`（返回 `{ list, total }`）；`ref.reload()` 刷新；`toolbar` / `toolbar-right` 插槽放操作按钮；树形等一次性数据源传 `paginated: false`；
- **`ProModalForm`**：`fields` schema 渲染表单（`input` / `password` / `textarea` / `number` / `select` / `radio` / `switch` / `tree-select` / `date`），`initialValues` 回填，`onSubmit` 返回 Promise、成功自动关闭，字段可用 `show(model)` 做联动显隐。

接口模块放 `src/api/<模块>.js`，统一 import `@/utils/request`（拦截器已处理 token、解包与错误提示）。

## 权限指令与工具函数

```vue
<template>
  <!-- 单个权限码：无权限时元素被移除（非隐藏） -->
  <NButton v-permission="'sys:user:add'">
    新增
  </NButton>

  <!-- 数组＝任一命中即通过 -->
  <NButton v-permission="['sys:user:edit', 'sys:user:add']">
    编辑
  </NButton>
</template>
```

逻辑分支里用工具函数（与指令共用同一实现）：

```js
import { hasPermission } from '@/utils/permission'

if (hasPermission('sys:user:export'))
  doExport()
```

规则：`super` 角色短路放行（与后端中间件语义对齐）；传空值 / 空数组视为不需要权限。指令在 `mounted` 时一次性判定——登录期内权限码不变（内嵌 JWT），无需响应式重挂载。

## 主题定制

主题相关代码收敛在 `src/theme/`，分「UI 无关的 token 定义」与「UI 库映射」两层：

```
src/theme/
├── tokens.js   # themePresets 预设主题色、themeTokens（圆角等设计值）—— UI 无关
├── color.js    # lighten / darken 派生工具
├── naive.js    # toNaiveTheme / toNaiveThemeOverrides —— Naive UI 映射，换库仅重写此文件
└── index.js    # useTheme()：从 app store 读状态并输出当前 UI 库主题配置
```

常见定制：

- **加一个预设主题色**：`tokens.js` 的 `themePresets` 加 `{ key, color }`，语言包补 `layout.themeColor.<key>` 文案（zh / en 两份），顶栏色板自动出现新色块；
- **改全局圆角等设计值**：改 `themeTokens`，经 `toNaiveThemeOverrides` 全局生效；
- **默认主色**：`themePresets[0]` 即默认色。

亮暗模式为三态 `light | dark | auto`（`auto` 经 `matchMedia` 跟随系统），存于 app store 的 `themeMode`，`isDark` 是派生值——图表等消费点只读 `isDark`，不感知模式语义。`collapsed / themeMode / primaryColor / locale` 由 pinia-plugin-persistedstate 持久化，刷新后保持。

## 新增语言

以新增日语 `ja-JP` 为例：

1. **拷贝语言包目录**：`src/locales/en-US/` → `src/locales/ja-JP/`，逐文件翻译（按模块拆分：common / menu / login / layout / system / dashboard / profile / exception）。**必须保持平铺 key**（`'menu.system'` 与 `'menu.system.users'` 需共存，嵌套对象无法同时表达）；
2. **注册语言**：`src/locales/index.js` 中 import 新包、`messages` 加 `'ja-JP'`、`SUPPORTED_LOCALES` 加 `{ value: 'ja-JP', label: '日本語' }`（label 用目标语言书写，不进语言包）——顶栏语言切换器以它为数据源，自动出现新选项；
3. **组件库 locale 映射**：`src/locales/naive.js` 的 `NAIVE_LOCALES` 加 Naive UI 对应项（`jaJP` / `dateJaJP`），日期选择器等组件文案随之联动；
4. **键集校验**：新语言包键集必须与 zh-CN 完全一致（缺 key 会回退中文）——`apps/web/tests/locales.test.js` 的键集一致性测试已常驻（`pnpm --filter @admin-ai/web test`），把新语言包纳入其断言即可持续回归。

语言选择持久化在 app store（`locale` 字段），`App.vue` 中 watch 接线到 i18n 实例与 `<html lang>`。组件外（守卫、工具函数）用 `translate(key)`，等价组件内 `useI18n().t`。

## UI 组件库切换

目标等级是**设计时受控切换**（Naive UI → Ant Design Vue / Element Plus），不是运行时开关——组件 API、表单校验模型、主题系统差异过大，「零改动切换」不现实。本模板通过收敛耦合面，把迁移成本控制在「替换适配层实现 + 按清单批量替换」。

### 结构性保证

- `stores` / `utils` / `router` / `api` 目录**禁止 import UI 库**，UI 依赖只出现在 `views` / `layouts` / `components`；
- 反馈类 API（message / notification / dialog / loadingBar）一律经 `useFeedback()` 门面，全项目只有它一处实现方；
- 增删改查一律基于 Pro\* 组件，不散用 UI 库原始表格 / 表单组合；
- 图标统一 `<AppIcon>`（UnoCSS preset-icons），不依赖 UI 库图标包；布局与间距用 UnoCSS 原子类，不用 UI 库栅格组件；
- 全局 Provider（NConfigProvider）仅在 `App.vue` 一处。

### 适配点清单

| 适配点         | 位置                             | 改造内容                                                                                            |
| -------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| 依赖与自动导入 | `apps/web/vite.config.js`        | 更换依赖包；`NaiveUiResolver` → `AntDesignVueResolver` / `ElementPlusResolver`                      |
| 反馈门面       | `src/composables/useFeedback.js` | 重写底层实现（antdv：`message` / `Modal` 静态方法；element-plus：`ElMessage` 等）                   |
| Pro\* 组件     | `src/components/Pro*.vue`        | 内部的表单 / 表格 / 弹窗组件与校验调用替换，**对外 API 保持不变**                                   |
| 主题映射       | `src/theme/naive.js`             | 重写为目标库形态（antdv：ConfigProvider theme token；element-plus：CSS 变量覆盖）；`tokens.js` 不动 |
| 组件库 locale  | `src/locales/naive.js`           | 重写语言包映射（zhCN / enUS → 目标库对应导出）                                                      |
| 全局 Provider  | `src/App.vue`                    | NConfigProvider 换为目标库 Provider，消费同一套 theme / locale 映射                                 |
| 展示型组件     | `views` / `layouts` 内           | 按前缀全局检索 `<N`（NTag / NAvatar / NStatistic…），逐个替换为目标库前缀                           |

### 切换流程

1. 更换依赖与 unplugin-vue-components 的 resolver；
2. 重写适配实现：`useFeedback` 底层、Pro\* 组件内部、`theme/naive.js` 映射、`locales/naive.js` 映射；
3. 按组件前缀全局检索直接使用的展示型组件，逐个替换；
4. 回归验证：三账号 RBAC 全流程、主题切换（亮 / 暗 / 主题色）、国际化联动（含组件库内建文案）。
