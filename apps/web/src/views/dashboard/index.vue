<script setup>
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useI18n } from 'vue-i18n'
import { getDashboardStatsApi } from '@/api/dashboard'
import { formatDateTime } from '@/utils/format'

// 工作台（REQUIREMENTS §5.1 / #20）：欢迎语 + 4 指标卡（同比涨跌）+ 折线/饼图 +
// 快捷入口 + 最近动态。图表按需注册；文案与数据 key 走 i18n（M3 决策点 8），
// 暗色经 theme prop 联动；ECharts 非 UI 组件库，不属 §9 适配层收敛范围。

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const { t } = useI18n()
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const stats = ref(null)

onMounted(async () => {
  stats.value = await getDashboardStatsApi()
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6)
    return t('dashboard.greeting.night')
  if (hour < 12)
    return t('dashboard.greeting.morning')
  if (hour < 18)
    return t('dashboard.greeting.afternoon')
  return t('dashboard.greeting.evening')
})

// 指标卡图标由前端按 key 映射（不进数据，规避 uno safelist 同步负担，M3 决策点 8）
const CARD_META = {
  visits: { icon: 'i-carbon-view', class: 'bg-blue-500/10 text-blue-500' },
  users: { icon: 'i-carbon-user-multiple', class: 'bg-green-500/10 text-green-600' },
  orders: { icon: 'i-carbon-shopping-cart', class: 'bg-orange-500/10 text-orange-500' },
  conversion: { icon: 'i-carbon-analytics', class: 'bg-purple-500/10 text-purple-500' },
}

function formatCardValue(card) {
  return card.unit === '%' ? `${card.value}%` : Number(card.value).toLocaleString()
}

const lineOption = computed(() => {
  if (!stats.value)
    return {}
  const { dates, series } = stats.value.trend
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 48, right: 24, top: 24, bottom: 48 },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: { type: 'value' },
    series: [
      { name: t('dashboard.series.visits'), type: 'line', smooth: true, showSymbol: false, data: series.visits, areaStyle: { opacity: 0.08 } },
      { name: t('dashboard.series.orders'), type: 'line', smooth: true, showSymbol: false, data: series.orders, areaStyle: { opacity: 0.08 } },
    ],
  }
})

const pieOption = computed(() => {
  if (!stats.value)
    return {}
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        itemStyle: { borderRadius: 4 },
        label: { show: false },
        data: stats.value.pie.map(item => ({ name: t(`dashboard.source.${item.key}`), value: item.value })),
      },
    ],
  }
})

// 快捷入口：按当前账号可见菜单过滤（user 角色仅个人中心）
const QUICK_ENTRIES = [
  { path: '/system/users', icon: 'i-carbon-user-multiple', title: 'menu.system.users' },
  { path: '/system/roles', icon: 'i-carbon-user-role', title: 'menu.system.roles' },
  { path: '/system/menus', icon: 'i-carbon-list', title: 'menu.system.menus' },
  { path: '/profile', icon: 'i-carbon-user-avatar', title: 'menu.profile' },
]

function collectPaths(nodes, acc = new Set()) {
  for (const node of nodes || []) {
    if (node.path)
      acc.add(node.path)
    if (node.children?.length)
      collectPaths(node.children, acc)
  }
  return acc
}

const quickEntries = computed(() => {
  const paths = collectPaths(permissionStore.menus)
  return QUICK_ENTRIES.filter(entry => paths.has(entry.path))
})

const ACTIVITY_ICONS = {
  release: 'i-carbon-rocket',
  newUser: 'i-carbon-user-follow',
  roleChange: 'i-carbon-user-role',
  menuChange: 'i-carbon-list',
  backup: 'i-carbon-data-backup',
}
</script>

<template>
  <div class="space-y-4">
    <NCard :bordered="false">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-semibold">
            {{ greeting }}，{{ userStore.userInfo?.nickname }}！
          </div>
          <div class="mt-1 text-sm text-gray-400">
            {{ t('dashboard.welcome') }}
          </div>
        </div>
        <div class="flex gap-2">
          <NTag v-for="role in userStore.roles" :key="role" type="primary" round>
            {{ role }}
          </NTag>
        </div>
      </div>
    </NCard>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 sm:grid-cols-2">
      <NCard v-for="card in stats?.cards ?? []" :key="card.key" :bordered="false">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-400">
              {{ t(`dashboard.stats.${card.key}`) }}
            </div>
            <div class="mt-1 text-2xl font-semibold">
              {{ formatCardValue(card) }}
            </div>
            <div class="mt-1 flex items-center gap-1 text-xs">
              <span
                class="flex items-center gap-0.5"
                :class="card.trend >= 0 ? 'text-green-600' : 'text-red-500'"
              >
                <AppIcon :icon="card.trend >= 0 ? 'i-carbon-arrow-up' : 'i-carbon-arrow-down'" :size="12" />
                {{ Math.abs(card.trend) }}%
              </span>
              <span class="text-gray-400">{{ t('dashboard.stats.wow') }}</span>
            </div>
          </div>
          <div class="h-12 w-12 flex-center rounded-lg" :class="CARD_META[card.key]?.class">
            <AppIcon :icon="CARD_META[card.key]?.icon" :size="24" />
          </div>
        </div>
      </NCard>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <NCard :title="t('dashboard.charts.trend')" :bordered="false" class="xl:col-span-3">
        <VChart
          class="h-80"
          :option="lineOption"
          :theme="appStore.isDark ? 'dark' : undefined"
          autoresize
        />
      </NCard>
      <NCard :title="t('dashboard.charts.source')" :bordered="false" class="xl:col-span-2">
        <VChart
          class="h-80"
          :option="pieOption"
          :theme="appStore.isDark ? 'dark' : undefined"
          autoresize
        />
      </NCard>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <NCard :title="t('dashboard.quickEntry')" :bordered="false" class="xl:col-span-2">
        <div class="grid grid-cols-2 gap-3">
          <RouterLink
            v-for="entry in quickEntries"
            :key="entry.path"
            :to="entry.path"
            class="flex items-center gap-2 border border-gray-200 rounded px-3 py-3 text-sm text-inherit no-underline transition-colors dark:border-gray-700 hover:border-[var(--hover-color)]"
            :style="{ '--hover-color': appStore.primaryColor }"
          >
            <AppIcon :icon="entry.icon" :size="18" />
            {{ t(entry.title) }}
          </RouterLink>
        </div>
      </NCard>
      <NCard :title="t('dashboard.recent')" :bordered="false" class="xl:col-span-3">
        <div class="space-y-3">
          <div
            v-for="activity in stats?.activities ?? []"
            :key="activity.key"
            class="flex items-center gap-3 text-sm"
          >
            <span class="h-8 w-8 flex-center shrink-0 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
              <AppIcon :icon="ACTIVITY_ICONS[activity.key] ?? 'i-carbon-information'" :size="15" />
            </span>
            <span class="flex-1">{{ t(`dashboard.activities.${activity.key}`) }}</span>
            <span class="shrink-0 text-xs text-gray-400">{{ formatDateTime(activity.time) }}</span>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>
