<template>
  <div class="alert-view">
    <el-page-header>
      <template #icon>
        <el-icon><Monitor /></el-icon>
      </template>
      <template #title>
        探针监控
      </template>
      <template #subtitle>
        管理主机和端口探针监控规则及告警配置
      </template>
    </el-page-header>
    
    <el-card shadow="hover" class="mt-4">
      <AlertManager />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Monitor } from '@element-plus/icons-vue'
import AlertManager from '@/components/AlertManager.vue'
</script>

<style scoped>
.alert-view {
  padding: 0 20px;
}

.mt-4 {
  margin-top: 20px;
}
</style>
