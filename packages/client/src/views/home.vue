<script setup>
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <el-card class="bg-[#1d1e1f] border-0">
      <div class="flex items-center">
        <el-icon class="text-2xl mr-2"><i-ep-user /></el-icon>
        <div class="flex-1">
          <div class="text-sm text-gray-400">用户总数</div>
          <div class="text-2xl mt-1">8,848</div>
        </div>
      </div>
    </el-card>
    <el-card class="bg-[#1d1e1f] border-0">
      <div class="flex items-center">
        <el-icon class="text-2xl mr-2"><i-ep-shopping-cart /></el-icon>
        <div class="flex-1">
          <div class="text-sm text-gray-400">订单总数</div>
          <div class="text-2xl mt-1">1,234</div>
        </div>
      </div>
    </el-card>
    <el-card class="bg-[#1d1e1f] border-0">
      <div class="flex items-center">
        <el-icon class="text-2xl mr-2"><i-ep-goods /></el-icon>
        <div class="flex-1">
          <div class="text-sm text-gray-400">商品总数</div>
          <div class="text-2xl mt-1">256</div>
        </div>
      </div>
    </el-card>
    <el-card class="bg-[#1d1e1f] border-0">
      <div class="flex items-center">
        <el-icon class="text-2xl mr-2"><i-ep-money /></el-icon>
        <div class="flex-1">
          <div class="text-sm text-gray-400">收入总额</div>
          <div class="text-2xl mt-1">¥ 99,999</div>
        </div>
      </div>
    </el-card>
    <el-card class="bg-[#1d1e1f] border-0">
      <template #header>
        <div class="flex items-center justify-between">
          <span>最近订单</span>
          <el-button text>查看更多</el-button>
        </div>
      </template>
      <el-table :data="[]" class="w-full">
        <el-table-column prop="id" label="订单编号" />
        <el-table-column prop="customer" label="客户名称" />
        <el-table-column prop="amount" label="订单金额" />
        <el-table-column prop="status" label="订单状态" />
        <el-table-column prop="created_at" label="创建时间" />
      </el-table>
    </el-card>
  </div>
</template>

<style>
.el-card {
  --el-card-bg-color: var(--el-bg-color-overlay);
}

.el-table {
  --el-table-border-color: var(--el-border-color-darker);
  --el-table-header-bg-color: var(--el-bg-color-overlay);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
}
</style>