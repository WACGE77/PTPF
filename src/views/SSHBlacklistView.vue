<template>
  <div class="ssh-blacklist-view">
    <el-page-header>
      <template #icon>
        <el-icon><Lock /></el-icon>
      </template>
      <template #title>
        SSH黑名单管理
      </template>
      <template #subtitle>
        管理SSH连接和命令的黑名单规则
      </template>
    </el-page-header>
    
    <el-card shadow="hover" class="mt-4">
      <SSHBlacklistManager />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import SSHBlacklistManager from '@/components/SSHBlacklistManager.vue'
import { initializeSSHBlacklist } from '@/utils/sshBlacklist'

onMounted(async () => {
  // 初始化SSH黑名单
  await initializeSSHBlacklist()
})
</script>

<style scoped>
.ssh-blacklist-view {
  padding: 0 20px;
}

.mt-4 {
  margin-top: 20px;
}
</style>