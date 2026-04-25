<template>
  <div class="danger-cmd-log-view">
    <el-page-header>
      <template #icon>
        <el-icon><Document /></el-icon>
      </template>
      <template #title>危险命令告警日志</template>
      <template #subtitle>查看SSH终端中触发的危险命令告警记录</template>
    </el-page-header>

    <el-card shadow="hover" class="mt-4">
      <template #header>
        <div class="card-header">
          <span>告警记录</span>
          <el-button type="primary" size="small" @click="loadLogs" :loading="loading">
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="logs" v-loading="loading" style="width: 100%" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="content" label="命令" min-width="200">
          <template #default="scope">
            <el-tag :type="scope.row.blocked ? 'danger' : 'info'" size="small">
              {{ scope.row.content }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="blocked" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.blocked ? 'danger' : 'success'" size="small">
              {{ scope.row.blocked ? '命中规则' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="block_message" label="匹配规则" min-width="180">
          <template #default="scope">
            <span v-if="scope.row.block_message" class="rule-text">{{ scope.row.block_message }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="user.name" label="操作用户" width="120" />
        <el-table-column prop="operation_time" label="执行时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.operation_time) }}
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && logs.length === 0" class="empty-data">
        <el-empty description="暂无告警日志，请在终端中执行命令触发告警" />
      </div>

      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, sizes, total"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import requests from '@/requests'

interface ShellOpLog {
  id: number
  operation_type: string
  content: string
  blocked: boolean
  block_message: string | null
  operation_time: string
  user: { id: number; name: string }
}

const logs = ref<ShellOpLog[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await requests.get('/api/audit/shell_op/get/', {
      page: currentPage.value,
      page_size: pageSize.value,
      blocked: 'true',
      ordering: '-operation_time'
    })
    const data = res.data
    logs.value = data.detail || data.results || []
    total.value = data.total || data.count || logs.value.length
  } catch (e: any) {
    console.error('加载告警日志失败:', e)
    ElMessage.error('加载告警日志失败')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadLogs()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadLogs()
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.danger-cmd-log-view {
  padding: 0 20px;
}
.mt-4 {
  margin-top: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.empty-data {
  text-align: center;
  padding: 40px 0;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.rule-text {
  color: #f56c6c;
  font-family: monospace;
}
.text-muted {
  color: #909399;
}
</style>
