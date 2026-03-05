<template>
  <div class="audit-view">
    <div class="page-header">
      <h2 class="title">审计日志</h2>
    </div>

    <div class="audit-tabs">
      <el-tabs v-model="activeTab" class="audit-tabs-container">
        <el-tab-pane label="登录日志" name="login">
          <LoginLogTab />
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="opera">
          <OperaLogTab />
        </el-tab-pane>
        <el-tab-pane label="会话日志" name="session">
          <SessionLogTab />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoginLogTab from '@/components/Audit/LoginLogTab.vue'
import OperaLogTab from '@/components/Audit/OperaLogTab.vue'
import SessionLogTab from '@/components/Audit/SessionLogTab.vue'

const activeTab = ref('login')
</script>

<style scoped lang="scss">
$primary-color: #409eff;
$text-primary: #303133;
$text-regular: #606266;
$border-color: #e6e6e6;
$bg-light: #f8f9fa;

.audit-view {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }
  }

  .audit-tabs {
    background-color: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .audit-tabs-container {
      min-height: 600px;
    }
  }
}
</style>
