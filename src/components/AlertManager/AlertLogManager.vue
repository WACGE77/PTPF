<template>
  <div class="alert-log-manager">
    <div class="search-bar">
      <div class="search-item">
        <label class="search-label">规则名称：</label>
        <el-input
          v-model="searchParams.rule_name"
          placeholder="请输入规则名称"
          clearable
          style="width: 180px;"
        />
      </div>
      <div class="search-item">
        <label class="search-label">时间范围：</label>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 280px;"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </div>
      <el-button type="primary" @click="handleSearch" :icon="Search">
        搜索
      </el-button>
      <el-button type="default" @click="handleReset">
        重置
      </el-button>
    </div>

    <el-table :data="data" stripe v-loading="loading">
      <el-table-column prop="rule_name" label="规则名称" min-width="150" />
      <el-table-column prop="message" label="告警消息" show-overflow-tooltip min-width="200" />
      <el-table-column label="发送时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="loadData"
        @size-change="loadData"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <!-- 空状态提示 -->
    <el-empty v-if="!loading && data.length === 0" description="暂无告警日志数据">
      <template #image>
        <el-icon :size="80"><Bell /></el-icon>
      </template>
      <template #description>
        <p>当前没有告警日志记录</p>
        <p class="empty-tips">可能的原因：</p>
        <ul>
          <li>尚未创建探针规则或规则未启用</li>
          <li>Celery定时任务未运行（无法自动探测）</li>
          <li>探针目标正常，未触发告警条件</li>
        </ul>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, Bell } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useTable } from '@/composables/useTable'

const dateRange = ref<[string, string] | null>(null)

const {
  loading,
  data,
  currentPage,
  pageSize,
  total,
  searchParams,
  loadData,
} = useTable({
  apiPath: '/alert/log/get',
  defaultSearchParams: {
    rule_name: ''
  }
})

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const handleSearch = () => {
  if (dateRange.value?.length === 2) {
    searchParams.start_time = dateRange.value[0]
    searchParams.end_time = dateRange.value[1]
  } else {
    delete searchParams.start_time
    delete searchParams.end_time
  }
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchParams.rule_name = ''
  dateRange.value = null
  delete searchParams.start_time
  delete searchParams.end_time
  currentPage.value = 1
  loadData()
}

loadData()
</script>

<style scoped>
.alert-log-manager {
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.search-item {
  display: flex;
  align-items: center;
}

.search-label {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
  white-space: nowrap;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.empty-tips {
  text-align: left;
  color: #909399;
  font-size: 13px;
  margin-top: 8px;
}

.empty-tips ul {
  margin: 4px 0 0 16px;
  padding-left: 20px;
}
</style>
