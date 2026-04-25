<template>
  <div class="ssh-terminal-tabs">
    <div v-if="!tabs.length" class="blank-container">
      <BlankPage :flag="!tabs.length"></BlankPage>
    </div>
    <el-tabs
      v-else
      v-model="activeTab"
      @tab-remove="tab_remove"
      @tab-change="tab_change"
      closable
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
      >
        <template #label>
          <div class="tab-label">
            <span>{{ tab.resourceName }} ({{ tab.type.toUpperCase() }})</span>
            <el-tag 
              :type="getStatusTagType(tab)" 
              size="small"
              class="status-tag"
            >
              {{ getStatusText(tab) }}
            </el-tag>
            <el-dropdown @click.stop>
              <el-button size="small" text>
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="reconnectTab(tab)">重新连接</el-dropdown-item>
                  <el-dropdown-item v-if="tab.type === 'rdp'" @click="toggleFullscreen(tab)">全屏模式</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
        <div
          v-show="tab.name === activeTab"
          :ref="(el) => {
            tab.ele = el as Dom
          }"
          class="terminal-content"
        >
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
          
          <!-- MySQL 工作区 -->
          <MySQLWorkspace
            v-if="tab.type === 'mysql'"
            :mysql-shell="tab.shell"
            class="mysql-workspace-wrapper"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { More, Monitor, Connection, Loading, WarningFilled } from '@element-plus/icons-vue'
import type { Dom, terminalTab } from '@/struct/terminal.ts'
import Shell from '@/utils/terminal.ts'
import RdpShell from '@/utils/rdpTerminal.ts'
import MysqlShell from '@/utils/mysqlTerminal.ts'
import BlankPage from '@/components/SShTerminal/BlankPage.vue'
import MySQLWorkspace from '@/components/MysqlBrowser/MySQLWorkspace.vue'

const tabs = ref<any[]>([])
const activeTab = ref<string>()

const find_ele = (key: string) => {
  return tabs.value.find(tab => tab.name === key)
}

const session_add = async (resource: number, voucher: number, token: string, resourceName: string, type: 'ssh' | 'rdp' | 'mysql' = 'ssh') => {
  console.log('session_add 调用, type:', type)
  const key = `${type}_${resource}_${Date.now()}`
  let shell: any
  
  if (type === 'ssh') {
    console.log('创建 SSH Shell')
    shell = new Shell()
  } else if (type === 'rdp') {
    console.log('创建 RDP Shell')
    shell = new RdpShell()
  } else if (type === 'mysql') {
    console.log('创建 MySQL Shell')
    shell = new MysqlShell()
  } else {
    console.error('未知的连接类型:', type)
    return false
  }
  
    // 同步状态/日志到 tab 实例
    const instance = {
      name: key,
      type: type,
      resourceName: resourceName,
      resourceId: resource,
      voucherId: voucher,
      token: token,
      shell: shell,
      ele: null,
      status: 'disconnected',
      errorMessage: '',
      logs: [] as Array<{ time: number; text: string }>
    }

    shell.onStatusChange = () => {
      instance.status = shell.getStatus?.() || instance.status
      instance.errorMessage = shell.getErrorMessage?.() || ''
      tabs.value = [...tabs.value]
    }
    shell.onData = (data: any) => {
      try {
        const text = typeof data === 'string' ? data : JSON.stringify(data)
        instance.logs.push({ time: Date.now(), text })
        if (instance.logs.length > 200) instance.logs.shift()
        tabs.value = [...tabs.value]
      } catch (e) {}
    }
  
  tabs.value.push(instance)
  activeTab.value = instance.name
  await nextTick()
  if (!instance.ele) return false
  instance.shell.mount(instance.ele)
  await instance.shell.connect(resource, voucher, token)
}

const tab_remove = async (name: string) => {
  const tab = find_ele(name)
  if (!tab) return
  tab.shell.close()
  tabs.value.splice(tabs.value.indexOf(tab), 1)
}

const tab_change = async (name: string) => {
  const tab = find_ele(name)
  if (!tab) return
  activeTab.value = tab.name
}

const reconnectTab = async (tab: terminalTab) => {
  tab.shell.close()
  if (tab.ele) {
    tab.ele.innerHTML = ''
    if (tab.type === 'ssh') {
      tab.shell = new Shell()
    } else if (tab.type === 'rdp') {
      tab.shell = new RdpShell()
    } else if (tab.type === 'mysql') {
      tab.shell = new MysqlShell()
    }
    tab.shell.onStatusChange = () => {
      tab.status = tab.shell.getStatus?.() || tab.status
      tab.errorMessage = tab.shell.getErrorMessage?.() || ''
      tabs.value = [...tabs.value]
    }
    tab.shell.onData = (d: any) => {
      try {
        const text = typeof d === 'string' ? d : JSON.stringify(d)
        tab.logs = tab.logs || []
        tab.logs.push({ time: Date.now(), text })
        if (tab.logs.length > 200) tab.logs.shift()
        tabs.value = [...tabs.value]
      } catch (e) {}
    }
    tab.shell.mount(tab.ele)
  }
  await tab.shell.connect(tab.resourceId, tab.voucherId, tab.token)
}

const getStatus = (tab: terminalTab) => {
  if ('getStatus' in tab.shell) {
    return tab.shell.getStatus()
  }
  return 'connected'
}

const getErrorMessage = (tab: terminalTab) => {
  if ('getErrorMessage' in tab.shell) {
    return tab.shell.getErrorMessage()
  }
  return ''
}

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

const toggleFullscreen = (tab: terminalTab) => {
  if (tab.ele) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      tab.ele.requestFullscreen()
    }
  }
}

defineExpose({
  session_add
})

onBeforeUnmount(() => {
  tabs.value.forEach(tab => tab.shell.close())
  tabs.value.length = 0
})
</script>
<style scoped lang="scss">
$border-color: #e6e6e6;

.ssh-terminal-tabs {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .blank-container {
    flex: 1;
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
  }

  :deep(.el-tabs) {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    .el-tabs__content {
      flex: 1;
      overflow: hidden;
      padding: 0;
      display: flex;
      width: 100%;
    }

    .el-tabs__header {
      margin: 0;
    }

    .el-tab-pane {
      flex: 1;
      display: flex;
      width: 100%;
    }
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-tag {
      margin-left: 4px;
    }

    :deep(.el-button) {
      padding: 0;
      margin: 0;
      height: 20px;
    }
  }

  .terminal-content {
    flex: 1;
    width: 100%;
    height: 100%;
    position: relative;
    background-color: #000;
  }

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

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
