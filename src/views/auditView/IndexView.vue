<template>
  <div class="audit-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审计日志</span>
        </div>
      </template>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="登录日志" name="login">
          <div class="tab-content">
            <!-- 搜索区域：仅保留关键字输入 -->
            <div class="search-area">
              <el-input
                v-model="searchKeyword.login.key"
                placeholder="按用户名或IP搜索"
                clearable
                style="width: 280px; margin-right: 10px"
                @keyup.enter="handleSearch"
              />
              <el-button type="primary" :loading="buttonLoading.search" @click="handleSearch">
                搜索
              </el-button>
            </div>

            <!-- 登录日志表格 -->
            <el-table :data="loginLogs" v-loading="tableLoading.login" stripe style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="user.name" label="用户名" />
              <el-table-column prop="ip" label="IP地址" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'succeed' ? 'success' : 'danger'">
                    {{ row.status === 'succeed' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="date" label="登录时间" width="180" />
            </el-table>

            <!-- 分页 -->
            <el-pagination
              v-if="loginLogs && loginLogs.length > 0"
              class="mt-4"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalPage.login"
              v-model:page-size="searchKeyword.login.page_size"
              v-model:current-page="searchKeyword.login.page_number"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handlePageSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="会话日志" name="session">
          <div class="tab-content">
            <!-- 搜索区域：仅保留关键字输入 -->
            <div class="search-area">
              <el-input
                v-model="searchKeyword.session.key"
                placeholder="按用户名或IP搜索"
                clearable
                style="width: 280px; margin-right: 10px"
                @keyup.enter="handleSearch"
              />
              <el-button type="primary" :loading="buttonLoading.search" @click="handleSearch">
                搜索
              </el-button>
            </div>

            <!-- 会话日志表格 -->
            <el-table
              :data="sessionLogs"
              v-loading="tableLoading.session"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="user.name" label="用户名" />
              <el-table-column label="资源信息">
                <template #default="{ row }">
                  <div>
                    <div>{{ row.resource.name }}</div>
                    <small class="text-muted">{{ row.resource.ip }}</small>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="voucher.username" label="凭证" />
              <el-table-column prop="ip" label="客户端IP" />
              <el-table-column prop="start_time" label="开始时间" width="180" />
              <el-table-column prop="end_time" label="结束时间" width="180" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                    {{ row.status === 'active' ? '活跃' : '关闭' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <el-pagination
              v-if="sessionLogs && sessionLogs.length > 0"
              class="mt-4"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalPage.session"
              v-model:page-size="searchKeyword.session.page_size"
              v-model:current-page="searchKeyword.session.page_number"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handlePageSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="operation">
          <div class="tab-content">
            <!-- 搜索区域：仅保留关键字输入 -->
            <div class="search-area">
              <el-input
                v-model="searchKeyword.operation.key"
                placeholder="按用户名或IP搜索"
                clearable
                style="width: 280px; margin-right: 10px"
                @keyup.enter="handleSearch"
              />
              <el-button type="primary" :loading="buttonLoading.search" @click="handleSearch">
                搜索
              </el-button>
            </div>

            <!-- 操作日志表格 -->
            <el-table
              :data="operationLogs"
              v-loading="tableLoading.operation"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="user.name" label="用户名" />
              <el-table-column prop="operation" label="操作内容" min-width="200" />
              <el-table-column prop="ip" label="IP地址" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status ? 'success' : 'danger'">
                    {{ row.status ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="date" label="操作时间" width="180" />
            </el-table>

            <!-- 分页 -->
            <el-pagination
              v-if="operationLogs && operationLogs.length > 0"
              class="mt-4"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalPage.operation"
              v-model:page-size="searchKeyword.operation.page_size"
              v-model:current-page="searchKeyword.operation.page_number"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handlePageSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { getIconComponent } from '@/utils/iconMap'
import type { LoginRecord, SessionRecord, OperationRecord } from '@/struct/index'

// 图标
const Refresh = getIconComponent('RefreshRight')

// 响应式数据
const activeTab = ref('login')

// 日志数据
const loginLogs = ref<LoginRecord[]>([])
const sessionLogs = ref<SessionRecord[]>([])
const operationLogs = ref<OperationRecord[]>([])

// 分页数据
const totalPage = reactive({
  login: 0,
  session: 0,
  operation: 0,
})

// 搜索关键词（只保留 key + 分页）
const searchKeyword = reactive({
  login: {
    key: '',
    page_number: 1,
    page_size: 10,
  },
  session: {
    key: '',
    page_number: 1,
    page_size: 10,
  },
  operation: {
    key: '',
    page_number: 1,
    page_size: 10,
  },
})

// 加载状态
const tableLoading = reactive({
  login: false,
  session: false,
  operation: false,
})

const buttonLoading = reactive({
  search: false,
})

// 方法
const handleTabChange = (tab: any) => {
  activeTab.value = tab.props.name
  loadData()
}

const handleSearch = () => {
  const currentTab = activeTab.value
  searchKeyword[currentTab].page_number = 1
  loadData()
}

const handlePageSizeChange = (size: number) => {
  const currentTab = activeTab.value
  searchKeyword[currentTab].page_size = size
  searchKeyword[currentTab].page_number = 1
  loadData()
}

const handlePageChange = (page: number) => {
  const currentTab = activeTab.value
  searchKeyword[currentTab].page_number = page
  loadData()
}

const loadData = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('未登录，请先登录系统')
    return
  }

  const currentTab = activeTab.value
  tableLoading[currentTab] = true

  try {
    let res
    const params = {
      desc: true,
      key: searchKeyword[currentTab].key || '',
      page_size: searchKeyword[currentTab].page_size,
      page_number: searchKeyword[currentTab].page_number,
    }

    switch (currentTab) {
      case 'login':
        res = await api.auditApi.getAllLogin(params)
        if (res.data.code === 200) {
          loginLogs.value = res.data.data.logs || []
          totalPage.login = res.data.data.total || 0
        }
        break
      case 'session':
        res = await api.auditApi.getAllSession(params)
        if (res.data.code === 200) {
          sessionLogs.value = res.data.data.logs || []
          totalPage.session = res.data.data.total || 0
        }
        break
      case 'operation':
        res = await api.auditApi.getALLOpera(params)
        if (res.data.code === 200) {
          operationLogs.value = res.data.data.logs || []
          totalPage.operation = res.data.data.total || 0
        }
        break
    }

    if (res && res.data.code !== 200) {
      ElMessage.error(res.data.msg || '获取日志失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('没有权限')
  } finally {
    tableLoading[currentTab] = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.audit-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-content {
  padding: 20px 0;
}

.search-area {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.mt-4 {
  margin-top: 20px;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}
</style>
