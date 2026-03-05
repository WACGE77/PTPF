<template>
  <div class="login-log-tab">
    <div class="tab-header">
      <el-input
        v-model="user"
        placeholder="搜索用户"
        prefix-icon="el-icon-user"
        class="search-input"
      />
      <el-input
        v-model="ip"
        placeholder="搜索IP"
        prefix-icon="el-icon-s-flag"
        class="search-input"
      />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        class="date-picker"
      />
      <el-checkbox v-model="selfOnly" label="只看自己的">只看自己的</el-checkbox>
      <el-button type="primary" @click="searchLogs" class="search-button">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
    </div>

    <div class="log-content">
      <el-table
        v-loading="auditStore.isLoading"
        :data="auditStore.formattedLoginLogs"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user.name" label="用户" width="120" />
        <el-table-column prop="ip" label="IP地址" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'succeed' ? 'success' : 'danger'">
              {{ scope.row.status === 'succeed' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="登录时间" />
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="auditStore.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useAuditStore } from '@/stores/audit.ts'

const auditStore = useAuditStore()
const selfOnly = ref(false)
const user = ref('')
const ip = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const searchLogs = () => {
  loadLogs()
}

const loadLogs = () => {
  const params: Record<string, any> = {
    page_number: currentPage.value,
    page_size: pageSize.value,
    self: selfOnly.value,
    desc: true
  }
  
  if (user.value) {
    params.user = user.value
  }
  
  if (ip.value) {
    params.ip = ip.value
  }
  
  if (dateRange.value) {
    params.start_time = dateRange.value[0].toISOString()
    params.end_time = dateRange.value[1].toISOString()
  }
  
  auditStore.getLoginLogs(params)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadLogs()
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped lang="scss">
$primary-color: #409eff;

.login-log-tab {
  padding: 20px;

  .tab-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    .search-input {
      width: 200px;
    }

    .date-picker {
      width: 300px;
    }

    .search-button {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .log-content {
    .pagination-container {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
