<template>
  <div class="danger-cmd-alert-view">
    <el-page-header>
      <template #icon>
        <el-icon><Warning /></el-icon>
      </template>
      <template #title>
        危险命令告警
      </template>
      <template #subtitle>
        管理SSH危险命令检测规则与告警记录
      </template>
    </el-page-header>

    <div v-if="!hasAccess" class="no-permission">
      <el-result icon="warning" title="无访问权限" sub-title="您没有危险命令告警管理权限，请联系管理员分配权限后重试">
        <template #extra>
          <el-button type="primary" @click="router.push('/overview')">返回概览</el-button>
        </template>
      </el-result>
    </div>

    <el-card v-else shadow="hover" class="mt-4">
      <DangerCmdAlertManager />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import DangerCmdAlertManager from '@/components/DangerCmdAlertManager.vue'
import { initializeDangerCmdAlert } from '@/utils/dangerCmdAlert'
import { useRouteStore } from '@/stores/route'
import router from '@/router'

const routeStore = useRouteStore()

const hasAccess = computed(() => {
  return routeStore.hasPermission('/danger-cmd-alert')
})

onMounted(async () => {
  await initializeDangerCmdAlert()
})
</script>

<style scoped>
.danger-cmd-alert-view {
  padding: 0 20px;
}
.mt-4 {
  margin-top: 20px;
}
.no-permission {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
