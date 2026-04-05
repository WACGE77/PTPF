<template>
  <div class="terminal-view">
    <!-- 顶部导航栏 -->
    <div class="terminal-header">
      <div class="header-left">
        <h2 class="terminal-title">WEB终端</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="goToManagePage">
          <el-icon><House /></el-icon>
          回到管理页面
        </el-button>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧资源列表 -->
      <div class="resource-sidebar">
        <div class="sidebar-header">
          <h3>资源列表</h3>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索资源"
            clearable
            size="small"
            class="search-input"
          >
            <template #prefix>
              <el-icon class="el-input__icon"><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <el-tree
          v-if="resources.length > 0"
          :data="resources"
          node-key="id"
          default-expand-all
          :filter-node-method="filterNode"
          class="resource-tree"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <div class="node-info">
                <el-icon class="node-icon">
                  <Monitor v-if="data.protocol?.name === 'RDP'" />
                  <Connection v-else />
                </el-icon>
                <span class="node-label">{{ data.name }}</span>
                <el-tag size="small" type="info" class="protocol-tag">
                  {{ data.protocol?.name || 'SSH' }}
                </el-tag>
              </div>
              <el-dropdown @click.stop trigger="click">
                <el-button size="small" type="primary" text>
                  <el-icon><Connection /></el-icon>
                  连接
                </el-button>
                <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-for="voucher in getResourceVouchers(data)"
                    :key="`current_${voucher.id}`"
                    @click="connectResource(data, voucher)"
                  >
                    <el-icon><Key /></el-icon>
                    {{ voucher.name }} ({{ voucher.username }})
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!getResourceVouchers(data)?.length" disabled>
                    暂无可用凭证
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
              </el-dropdown>
            </div>
          </template>
        </el-tree>
        <div v-else class="no-resources">
          <el-empty description="暂无资源" />
        </div>
      </div>
      
      <!-- 右侧终端区域 -->
      <div class="terminal-content">
        <div v-if="!tabs.length" class="terminal-placeholder">
          <el-empty description="请从左侧选择资源和凭证进行连接" />
        </div>
        <el-tabs
          v-else
          v-model="activeTab"
          @tab-remove="tabRemove"
          @tab-change="tabChange"
          closable
          class="terminal-tabs"
        >
          <el-tab-pane
            v-for="tab in tabs"
            :key="tab.name"
            :name="tab.name"
          >
            <template #label>
              <div class="tab-label">
                <span class="tab-title">{{ tab.resourceName }}</span>
                <span class="tab-voucher">({{ tab.voucherName }})</span>
                <el-tag 
                  :type="getStatusTagType(tab)" 
                  size="small"
                  class="status-tag"
                >
                  {{ getStatusText(tab) }}
                </el-tag>
                <el-dropdown @click.stop trigger="click">
                  <el-button size="small" text class="tab-more-btn">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="reconnectTab(tab)">
                        <el-icon><RefreshRight /></el-icon>
                        重新连接
                      </el-dropdown-item>
                      <el-dropdown-item v-if="tab.type === 'rdp'" @click="toggleFullscreen(tab)">
                        <el-icon><FullScreen /></el-icon>
                        全屏模式
                      </el-dropdown-item>
                      <el-dropdown-item divided @click="tabRemove(tab.name)" style="color: #F56C6C">
                        <el-icon><Close /></el-icon>
                        关闭连接
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            <div
              v-show="tab.name === activeTab"
              :ref="(el) => { tab.ele = el as Dom }"
              class="terminal-area"
            >
              <!-- RDP状态覆盖层 -->
              <div v-if="tab.type === 'rdp' && getStatus(tab) !== 'connected'" class="rdp-status-overlay">
                <div v-if="getStatus(tab) === 'disconnected'" class="status-content">
                  <el-icon :size="48"><Monitor /></el-icon>
                  <p>远程桌面已断开</p>
                  <el-button type="primary" @click="reconnectTab(tab)">
                    <el-icon><Connection /></el-icon>
                    重新连接
                  </el-button>
                </div>
                <div v-else-if="getStatus(tab) === 'connecting'" class="status-content">
                  <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
                  <p>正在连接远程桌面...</p>
                </div>
                <div v-else-if="getStatus(tab) === 'error'" class="status-content">
                  <el-icon :size="48"><WarningFilled /></el-icon>
                  <p>连接失败</p>
                  <el-alert
                    v-if="getErrorMessage(tab)"
                    :title="getErrorMessage(tab)"
                    type="error"
                    show-icon
                    :closable="false"
                    class="error-alert"
                  />
                  <el-button type="primary" @click="reconnectTab(tab)">
                    <el-icon><Connection /></el-icon>
                    重新连接
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { 
  Search, Connection, Close, Monitor, Key, Link, House, 
  More, RefreshRight, FullScreen, Loading, WarningFilled 
} from '@element-plus/icons-vue'
import Shell from '@/utils/terminal.ts'
import RdpShell from '@/utils/rdpTerminal.ts'
import type { Dom, terminalTab } from '@/struct/terminal.ts'
import api from '@/api'
import type { Voucher } from '@/struct/resource.ts'

// 资源列表
const resources = ref<any[]>([])
const searchKeyword = ref('')

// Tabs状态
const tabs = ref<any[]>([])
const activeTab = ref<string>()

// 加载资源列表
const loadResources = async () => {
  try {
    const response = await api.resourceApi.getResource({})
    if (response.data && response.data.code === 200) {
      resources.value = response.data.detail || []
    }
  } catch (error) {
    console.error('加载资源失败:', error)
  }
}

// 获取资源的凭证列表
const getResourceVouchers = (resource: any): Voucher[] => {
  return resource.vouchers || []
}

// 过滤资源
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.name.toLowerCase().includes(value.toLowerCase())
}



// 连接资源
const connectResource = async (resource: any, voucher: Voucher) => {
  const type = resource.protocol?.name?.toLowerCase() === 'rdp' ? 'rdp' : 'ssh'
  const key = `${type}_${resource.id}_${voucher.id}_${Date.now()}`
  
  // 检查是否已存在相同的连接
  const existingTab = tabs.value.find(
    tab => tab.resourceId === resource.id && tab.voucherId === voucher.id
  )
  if (existingTab) {
    activeTab.value = existingTab.name
    return
  }
  
  // 创建新终端
  let shell: Shell | RdpShell
  if (type === 'ssh') {
    shell = new Shell()
  } else {
    shell = new RdpShell()
  }
  
  shell.onStatusChange = () => {
    tabs.value = [...tabs.value]
  }
  
  const token = localStorage.getItem('token') || ''
  
  const instance = {
    name: key,
    type,
    resourceName: resource.name,
    resourceId: resource.id,
    voucherId: voucher.id,
    voucherName: voucher.name,
    token,
    shell,
    ele: null
  }
  
  tabs.value.push(instance)
  activeTab.value = instance.name
  
  await nextTick()
  if (instance.ele) {
    instance.shell.mount(instance.ele)
    await instance.shell.connect(resource.id, voucher.id, token)
  }
}

// 查找tab
const findTab = (name: string) => {
  return tabs.value.find(tab => tab.name === name)
}

// 移除tab
const tabRemove = (name: string) => {
  const tab = findTab(name)
  if (!tab) return
  tab.shell.close()
  tabs.value.splice(tabs.value.indexOf(tab), 1)
  
  // 如果关闭的是当前激活的tab，切换到其他tab
  if (activeTab.value === name && tabs.value.length > 0) {
    activeTab.value = tabs.value[tabs.value.length - 1].name
  }
}

// 切换tab
const tabChange = (name: string) => {
  activeTab.value = name
}

// 重新连接tab
const reconnectTab = async (tab: terminalTab) => {
  tab.shell.close()
  if (tab.ele) {
    tab.ele.innerHTML = ''
    if (tab.type === 'ssh') {
      tab.shell = new Shell()
    } else {
      tab.shell = new RdpShell()
    }
    tab.shell.onStatusChange = () => {
      tabs.value = [...tabs.value]
    }
    tab.shell.mount(tab.ele)
  }
  await tab.shell.connect(tab.resourceId, tab.voucherId, tab.token)
}

// 获取状态
const getStatus = (tab: terminalTab) => {
  if ('getStatus' in tab.shell) {
    return tab.shell.getStatus()
  }
  return 'connected'
}

// 获取错误信息
const getErrorMessage = (tab: terminalTab) => {
  if ('getErrorMessage' in tab.shell) {
    return tab.shell.getErrorMessage()
  }
  return ''
}

// 获取状态文本
const getStatusText = (tab: terminalTab): string => {
  const status = getStatus(tab)
  const statusTextMap: Record<string, string> = {
    'disconnected': '已断开',
    'connecting': '连接中',
    'connected': '已连接',
    'error': '错误'
  }
  return statusTextMap[status] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (tab: terminalTab): 'success' | 'warning' | 'danger' | 'info' => {
  const status = getStatus(tab)
  const tagTypeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    'disconnected': 'info',
    'connecting': 'warning',
    'connected': 'success',
    'error': 'danger'
  }
  return tagTypeMap[status] || 'info'
}

// 全屏切换
const toggleFullscreen = (tab: terminalTab) => {
  if (tab.ele) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      tab.ele.requestFullscreen()
    }
  }
}

// 监听搜索关键词变化
watch(searchKeyword, (val) => {
  // el-tree会自动处理过滤
})

// 回到管理页面
const goToManagePage = () => {
  window.location.href = '/' 
}

// 生命周期
onMounted(() => {
  loadResources()
})

onBeforeUnmount(() => {
  tabs.value.forEach(tab => tab.shell.close())
  tabs.value = []
})
</script>

<style scoped lang="scss">
.terminal-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f5f7fa;
  
  .terminal-header {
    height: 60px;
    background-color: #fff;
    border-bottom: 1px solid #e6e8eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    
    .header-left {
      .terminal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }
    
    .header-right {
      display: flex;
      gap: 10px;
    }
  }
  
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    
    .resource-sidebar {
      width: 350px;
      height: 100%;
      background-color: #fff;
      border-right: 1px solid #e6e8eb;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    
      .sidebar-header {
        padding: 16px;
        border-bottom: 1px solid #e6e8eb;
        
        h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .search-input {
          width: 100%;
        }
      }
      
      .resource-tree {
        flex: 1;
        overflow: auto;
        padding: 8px;
        
        .tree-node {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          
          .node-info {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1;
            min-width: 0;
            
            .node-icon {
              font-size: 14px;
              color: #409eff;
            }
            
            .node-label {
              font-size: 13px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            .protocol-tag {
              flex-shrink: 0;
            }
          }
        }
      }
      
      .no-resources {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .terminal-content {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      
      .terminal-placeholder {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #fafafa;
      }
      
      .terminal-tabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        :deep(.el-tabs__header) {
          margin: 0;
          background-color: #fff;
          border-bottom: 1px solid #e6e8eb;
        }
        
        :deep(.el-tabs__content) {
          flex: 1;
          overflow: hidden;
          padding: 0;
        }
        
        :deep(.el-tab-pane) {
          height: 100%;
        }
        
        .tab-label {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .tab-title {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 13px;
          }
          
          .tab-voucher {
            font-size: 11px;
            color: #909399;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .status-tag {
            margin-left: 4px;
          }
          
          .tab-more-btn {
            padding: 0;
            margin: 0;
            height: 20px;
            width: 20px;
          }
        }
        
        .terminal-area {
          width: 100%;
          height: 100%;
          position: relative;
          background-color: #000;
          
          .rdp-status-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.85);
            z-index: 10;
            
            .status-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
              color: #fff;
              
              p {
                margin: 0;
                font-size: 16px;
              }
              
              .loading-icon {
                animation: spin 1s linear infinite;
              }
              
              .error-alert {
                max-width: 300px;
                margin-top: 8px;
              }
            }
          }
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
