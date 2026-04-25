<template>
  <div class="alert-manager">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="SMTP配置" name="smtp">
        <SmtpConfigManager />
      </el-tab-pane>
      <el-tab-pane label="探针规则" name="rules">
        <ProbeRuleManager />
      </el-tab-pane>
      <el-tab-pane label="告警方式" name="methods">
        <AlertMethodManager />
      </el-tab-pane>
      <el-tab-pane label="告警模板" name="templates">
        <AlertTemplateManager />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SmtpConfigManager from './AlertManager/SmtpConfigManager.vue'
import ProbeRuleManager from './AlertManager/ProbeRuleManager.vue'
import AlertMethodManager from './AlertManager/AlertMethodManager.vue'
import AlertTemplateManager from './AlertManager/AlertTemplateManager.vue'

const activeTab = ref('smtp')
</script>

<style scoped>
.alert-manager {
  width: 100%;
}
</style>
