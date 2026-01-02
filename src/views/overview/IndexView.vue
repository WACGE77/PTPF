<template>
  <div class="overview-page">
    <!-- 页面标题 -->
    <div class="page-title">概览</div>

    <div class="content-wrapper">
      <!-- 左侧：最近会话 -->
      <div class="left-panel">
        <div class="panel-header">最近会话</div>
        <el-table
          :data="sessions"
          border
          style="width: 100%"
          v-loading="loading"
          fit
          :show-overflow-tooltip="true"
        >
          <el-table-column prop="id" label="ID" min-width="60" />
          <el-table-column prop="user.name" label="用户" min-width="100" />
          <el-table-column prop="resource.name" label="目标" min-width="140" />
          <el-table-column prop="voucher.username" label="系统用户" min-width="100" />
          <el-table-column prop="resource.ip" label="远端地址" min-width="130" />
          <!-- <el-table-column prop="protocol" label="协议" min-width="70" /> -->
        </el-table>

        <!-- 空数据提示 -->
        <div v-if="!loading && sessions.length === 0" class="empty-state">暂无数据</div>
      </div>

      <!-- 右侧：个人信息 + 最近登录 -->
      <div class="right-panel">
        <!-- 个人信息 -->
        <div class="panel">
          <div class="panel-header">个人信息</div>
          <div class="user-info">
            <el-avatar size="40" :src="userPro.user.avatar" />
            <div class="info-content">
              <div>
                用户名：<span>{{ userPro.user.name }}</span>
              </div>
              <div>
                邮箱：<span>{{ userPro.user.email }}</span>
              </div>
              <div>
                登录日期：<span>{{ loginRecords[0]?.date }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近登录 -->
        <div class="panel mt-20">
          <div class="panel-header">最近登录</div>
          <el-table
            :data="loginRecords"
            border
            style="width: 100%"
            fit
            :show-overflow-tooltip="true"
          >
            <el-table-column prop="ip" label="登录IP" min-width="150" />
            <el-table-column prop="date" label="登录日期" min-width="140" />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { userPro } from '@/main'
import { ref } from 'vue'
import api from '@/api'
import time from '@/utils/time'
import type { LoginRecord, SessionRecord } from '@/struct/index'
const loading = ref(false)

const loginRecords = ref<LoginRecord[]>([])
const sessions = ref<SessionRecord[]>([])
const loginInfo = async () => {
  const result = await api.auditApi.getSelfLogin({ page_size: 10, desc: true })
  if (result.data.code == 200) {
    loginRecords.value = result.data.data
    for (const record of loginRecords.value) {
      record.date = time.formatISODate(record.date)
    }
  }
}
const sessionlog = async () => {
  const result = await api.auditApi.getSelfSession({ page_size: 10, desc: true })
  if (result.data.code == 200) {
    sessions.value = result.data.data
    for (const item of sessions.value) {
      item.start_time = time.formatISODate(item.start_time)
      item.end_time = time.formatISODate(item.end_time)
    }
  }
}
loginInfo()
sessionlog()
</script>

<style scoped>
.overview-page {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  flex-wrap: wrap; /* 小屏自动换行 */
}

.left-panel {
  flex: 2; /* 占比更大 */
  min-width: 600px; /* 防止在中等屏幕过度压缩 */
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.right-panel {
  flex: 1;
  min-width: 300px; /* 保证右侧最小可读宽度 */
}

.panel-header {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.info-content span {
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
