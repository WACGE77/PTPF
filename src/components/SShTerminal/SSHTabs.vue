<template>
  <div class="ssh-terminal-tabs">
    <BlankPage :flag="!tabs.length"></BlankPage>
    <el-tabs
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
            <span>{{ tab.resourceName }}</span>
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
import BlankPage from '@/components/SShTerminal/BlankPage.vue'

const tabs = ref<Array<terminalTab & { resourceName: string, resourceId: number, voucherId: number, token: string }>>([])
const activeTab = ref<string>()

const find_ele = (key: string) => {
  return tabs.value.find(tab => tab.name === key)
}

const session_add = async (resource: number, voucher: number, token: string, resourceName: string) => {
  // 生成唯一的标签页名称，允许一个资源开多个终端
  const key = `${resource}_${Date.now()}`
  const instance = {
    name: key,
    resourceName: resourceName,
    resourceId: resource,
    voucherId: voucher,
    token: token,
    shell: new Shell(),
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

const reconnectTab = async (tab: any) => {
  // 关闭当前连接
  tab.shell.close()
  // 清空终端内容
  if (tab.ele) {
    tab.ele.innerHTML = ''
    // 创建新的终端实例
    tab.shell = new Shell()
    // 重新挂载终端元素
    tab.shell.mount(tab.ele)
  }
  // 重新连接
  await tab.shell.connect(tab.resourceId, tab.voucherId, tab.token)
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
