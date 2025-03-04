<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <el-container class="h-screen overflow-hidden">
    <el-aside width="200px" class="h-full flex flex-col">
      <div class="flex items-center justify-center h-16 shrink-0">
        <h1 class="text-xl font-bold">Admin AI</h1>
      </div>
      <el-menu :default-active="route.path" router class="flex-1 border-0">
        <el-menu-item index="/">
          <el-icon><i-ep-home-filled /></el-icon>
          <span>首页</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="h-full">
      <el-header class="border-b border-[#2d2d2d] flex items-center justify-between">
        <div class="flex items-center">
          <el-breadcrumb>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <el-dropdown>
          <span class="flex items-center cursor-pointer">
            <el-avatar :size="32" class="mr-2" />
            管理员
            <el-icon class="ml-1"><i-ep-arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人设置</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="p-0">
        <el-scrollbar>
          <div class="p-4">
            <router-view></router-view>
          </div>
        </el-scrollbar>
      </el-main>
    </el-container>
  </el-container>
</template>

<style>
.el-header {
  height: 64px;
  background-color: var(--el-bg-color-overlay);
}
</style>