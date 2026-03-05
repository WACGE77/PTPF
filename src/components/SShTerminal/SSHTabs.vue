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
            <el-dropdown @click.stop>
              <el-button size="small" text>
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="reconnectTab(tab)">重新连接</el-dropdown-item>
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
          style="flex: 1; width: 100%; height: 100%;"
        >
          <!-- RDP 连接状态显示 -->
          <div v-if="tab.type === 'rdp'" class="rdp-status-container">
            <div v-if="getRdpStatus(tab) === 'disconnected'" class="status disconnected">
              <el-button type="primary" @click="reconnectTab(tab)">连接</el-button>
            </div>
            <div v-else-if="getRdpStatus(tab) === 'connecting'" class="status connecting">
              <el-loading text="连接中..." />
            </div>
            <div v-else-if="getRdpStatus(tab) === 'error'" class="status error">
              <el-alert
                title="连接失败"
                type="error"
                :description="getRdpErrorMessage(tab)"
                show-icon
              />
              <el-button type="primary" @click="reconnectTab(tab)">重新连接</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { More } from '@element-plus/icons-vue'
import type { Dom, terminalTab } from '@/struct/terminal.ts'
import Shell from '@/utils/terminal.ts'
import RdpShell from '@/utils/rdpTerminal.ts'
import BlankPage from '@/components/SShTerminal/BlankPage.vue'

const tabs = ref<Array<terminalTab>>([])
const activeTab = ref<string>()

const find_ele = (key: string) => {
  return tabs.value.find(tab => tab.name === key)
}

const session_add = async (resource: number, voucher: number, token: string, resourceName: string, type: 'ssh' | 'rdp' = 'ssh') => {
  // 生成唯一的标签页名称，允许一个资源开多个终端
  const key = `${type}_${resource}_${Date.now()}`
  let shell: Shell | RdpShell
  
  if (type === 'ssh') {
    shell = new Shell()
  } else {
    shell = new RdpShell()
  }
  
  const instance: terminalTab = {
    name: key,
    type: type,
    resourceName: resourceName,
    resourceId: resource,
    voucherId: voucher,
    token: token,
    shell: shell,
    ele: null
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
  // 关闭当前连接
  tab.shell.close()
  // 清空终端内容
  if (tab.ele) {
    tab.ele.innerHTML = ''
    // 创建新的终端实例
    if (tab.type === 'ssh') {
      tab.shell = new Shell()
    } else {
      tab.shell = new RdpShell()
    }
    // 重新挂载终端元素
    tab.shell.mount(tab.ele)
  }
  // 重新连接
  await tab.shell.connect(tab.resourceId, tab.voucherId, tab.token)
}

const getRdpStatus = (tab: terminalTab) => {
  if (tab.type === 'rdp' && 'getStatus' in tab.shell) {
    return tab.shell.getStatus()
  }
  return 'connected'
}

const getRdpErrorMessage = (tab: terminalTab) => {
  if (tab.type === 'rdp' && 'getErrorMessage' in tab.shell) {
    return tab.shell.getErrorMessage()
  }
  return ''
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
      padding: 8px;
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

    :deep(.el-button) {
      padding: 0;
      margin: 0;
      height: 20px;
    }
  }
}
</style>
