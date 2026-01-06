<template>
  <div class="web-terminal-page">
    <!-- 左侧资源树 -->
    <div class="sidebar">
      <el-card class="tree-card">
        <template #header>
          <span>资源列表</span>
          <el-button
            type="text"
            size="small"
            :icon="Refresh"
            :loading="buttonLoading.refresh"
            @click="loadResources"
            style="float: right"
          >
            刷新
          </el-button>
        </template>

        <div v-if="loadingTree">加载中...</div>
        <div v-else-if="errorTree" class="error">{{ errorTree }}</div>
        <ul v-else class="resource-tree">
          <li
            v-for="node in resourceTree"
            :key="node.id"
            class="tree-node"
            :class="{ disabled: !node.status }"
          >
            <div class="node-header" @click="toggleNode(node)">
              <el-icon
                ><component :is="getIconComponent(node.expanded ? 'ArrowDown' : 'ArrowRight')"
              /></el-icon>
              <strong>{{ node.name }}</strong>
              <span class="ip" v-if="node.ipv4_address">
                {{ node.ipv4_address }}:{{ node.port }}
              </span>
            </div>
            <ul v-show="node.expanded" class="voucher-list">
              <li
                v-for="voucher in node.vouchers"
                :key="voucher.id"
                class="voucher-item"
                @click="openTerminal(node, voucher)"
              >
                {{ voucher.username }}@{{ voucher.code }}
              </li>
            </ul>
          </li>
        </ul>
      </el-card>
    </div>

    <!-- 右侧终端区域 -->
    <div class="main">
      <el-card class="terminal-card">
        <!-- Tabs -->
        <div class="tabs-area">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-item"
            :class="{ active: activeTabId === tab.id }"
          >
            <span class="tab-title" @click="switchTab(tab.id)">{{ tab.title }}</span>
            <el-icon class="tab-close" @click.stop="closeTab(tab.id)"><Close /></el-icon>
          </div>
          <span v-if="tabs.length === 0" class="empty-hint">请选择左侧主机凭证以连接终端</span>
        </div>

        <!-- Terminal Containers -->
        <div
          v-for="(tab, index) in tabs"
          :key="tab.id"
          v-show="activeTabId === tab.id"
          :ref="
            (el) => {
              if (el) terminalRefs.set(tab.id, el as HTMLElement) // ✅ 去掉 .value
            }
          "
          class="terminal-instance"
        ></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import 'xterm/css/xterm.css'
import api from '@/api'
import { getIconComponent } from '@/utils/iconMap'
import type { Resource, Voucher, TerminalData } from '@/struct/index'
import { Shell } from '@/utils/terminal'

// 扩展 Resource 接口，添加 expanded 属性
interface ResourceNode extends Resource {
  expanded: boolean
}

// 图标
const Refresh = getIconComponent('RefreshRight')
const Close = getIconComponent('Close')

// 资源树状态
const buttonLoading = ref({ refresh: false })
const resourceTree = ref<ResourceNode[]>([])
const loadingTree = ref(false)
const errorTree = ref<string | null>(null)

// Tabs 管理
interface Tab {
  id: string
  title: string
  shell: Shell
  auth: TerminalData
}

const tabs = ref<Tab[]>([])
const activeTabId = ref<string | null>(null)
const terminalRefs = ref<Map<string, HTMLElement>>(new Map())

// ====== 方法 ======
const loadResources = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('未登录，请先登录系统')
    return
  }

  buttonLoading.value.refresh = true
  loadingTree.value = true
  errorTree.value = null

  try {
    const res = await api.resourceApi.getResource({})
    if (res.data.code === 200) {
      resourceTree.value = (res.data.data.resources || []).map((r: Resource) => ({
        ...r,
        expanded: false,
      }))
    } else {
      errorTree.value = res.data.msg || '加载失败'
      ElMessage.error(res.data.msg || '获取资源失败')
    }
  } catch (err) {
    console.error(err)
    errorTree.value = '网络请求失败'
    ElMessage.error('获取资源列表失败')
  } finally {
    loadingTree.value = false
    buttonLoading.value.refresh = false
  }
}

const toggleNode = (node: ResourceNode) => {
  node.expanded = !node.expanded
}

const generateId = () => Math.random().toString(36).substring(2, 10)

const openTerminal = async (host: ResourceNode, voucher: Voucher) => {
  if (!host.status) {
    ElMessage.warning('该主机当前不可用')
    return
  }

  if (!voucher.id) {
    ElMessage.error('凭证ID无效')
    return
  }

  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('会话已过期，请重新登录')
    return
  }

  const auth = {
    type: 0,
    data: {
      token,
      resource_id: host.id,
      voucher_id: voucher.id,
    },
  }

  const title = `${voucher.username}@${host.name}`
  const id = generateId()
  const shell = new Shell()

  const newTab: Tab = { id, title, shell, auth }
  tabs.value.push(newTab)
  activeTabId.value = id

  // 等待 DOM 更新并重试获取容器
  await nextTick()

  let containerEl = terminalRefs.value.get(id)
  let retryCount = 0
  const maxRetries = 10

  while (!containerEl && retryCount < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 20))
    containerEl = terminalRefs.value.get(id)
    retryCount++
  }

  if (containerEl) {
    try {
      shell.mount(containerEl)
      shell.connect(auth)
      console.log('Terminal opened successfully for tab:', id)
    } catch (error) {
      console.error('Failed to mount/connect terminal:', error)
      ElMessage.error('终端初始化失败')
      closeTab(id)
    }
  } else {
    ElMessage.error('终端容器未就绪，请重试')
    console.error(
      'Failed to get terminal container for tab:',
      id,
      'after',
      maxRetries,
      'retries. Available refs:',
      Array.from(terminalRefs.value.keys()),
    )
    closeTab(id)
  }
}

const switchTab = (id: string) => {
  activeTabId.value = id
}

const closeTab = (id: string) => {
  console.log('Closing tab:', id)
  const index = tabs.value.findIndex((t) => t.id === id)
  if (index === -1) {
    console.warn('Tab not found:', id)
    return
  }

  const tab = tabs.value[index]
  if (tab) {
    try {
      tab.shell?.close?.()
      console.log('Shell closed for tab:', id)
    } catch (error) {
      console.error('Error closing shell:', error)
    }
  }
  tabs.value.splice(index, 1)
  terminalRefs.value.delete(id) // 删除对应的 ref
  console.log('Tab closed and cleaned up:', id)

  if (tabs.value.length > 0) {
    const nextIndex = Math.min(index, tabs.value.length - 1)
    activeTabId.value = tabs.value[nextIndex]?.id || null
    console.log('Switched to tab:', activeTabId.value)
  } else {
    activeTabId.value = null
    console.log('No more tabs')
  }
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('请先登录系统')
    return
  }
  loadResources()
})

onBeforeUnmount(() => {
  tabs.value.forEach((tab) => tab.shell.close?.())
})
</script>

<style scoped>
.web-terminal-page {
  display: flex;
  /* 不再强制 100vh，改用 min-height + max-height 控制 */
  min-height: 500px;
  height: calc(100vh - 80px); /* 根据实际顶部栏调整 */
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.tree-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
}

/* ========== 资源树样式（不变） ========== */
.resource-tree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tree-node {
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #f9fafc;
}

.tree-node.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.node-header {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #333;
}

.node-header:hover:not(.disabled) {
  background-color: #f0f7ff;
}

.ip {
  font-size: 12px;
  color: #888;
  margin-left: auto;
}

.voucher-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.voucher-item {
  padding: 8px 12px 8px 32px;
  cursor: pointer;
  font-size: 13px;
  color: #1890ff;
}

.voucher-item:hover {
  background-color: #e6f7ff;
}

/* ========== 右侧主区域 ========== */
.main {
  flex: 1;
}

.terminal-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  /*max-height: 700px; /* ← 可按需调整，比如 600px / 80vh 等 */
}

.tabs-area {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  min-height: 40px;
  flex-wrap: wrap;
}

.tab-item {
  display: flex;
  align-items: center;
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.tab-item.active {
  background: #409eff;
  border-color: #409eff;
}

.tab-title {
  padding: 6px 10px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
}

.tab-item.active .tab-title {
  color: white;
}

.tab-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #c0c4cc;
  color: white;
  cursor: pointer;
}

.tab-item.active .tab-close {
  background: rgba(255, 255, 255, 0.3);
}

.tab-close:hover {
  background: #ff4d4f !important;
}

.empty-hint {
  color: #999;
  font-size: 13px;
}

/* ✅ 关键修复：给 terminal-card 的 body 区域显式高度 */
:deep(.terminal-card .el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ✅ 让终端实例的直接父容器（即 el-card__body）成为定位上下文 */
:deep(.terminal-card .el-card__body > div:not(.tabs-area)) {
  flex: 1;
  position: relative;
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
}

/* ✅ 终端实例填满这个容器 */
.terminal-instance {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.error {
  color: #f56c6c;
  padding: 12px;
}
</style>
