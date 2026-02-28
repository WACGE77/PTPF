<template>
  <div class="terminal-view">
    <div class="page-header">
      <h2 class="title">终端管理</h2>
    </div>
    <div class="terminal-container">
      <div class="resource-panel">
        <div class="panel-header">
          <span class="panel-title">资源</span>
          <el-input
            v-model="searchQuery"
            placeholder="搜索资源"
            clearable
            size="small"
            prefix-icon="Search"
            @input="handleSearch"
          />
        </div>
        <el-tree
          ref="resourceTreeRef"
          :data="filteredTreeData"
          :props="treeProps"
          node-key="id"
          :expand-on-click-node="false"
          :default-expand-all="true"
          @node-click="handleNodeClick"
          :filter-node-method="filterNode"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <div class="node-content">
                <el-icon class="node-icon" :class="data.type">
                  <component :is="getNodeIcon(data.type)" />
                </el-icon>
                <span class="node-label">{{ node.label }}</span>
                <el-tag v-if="data.type === 'group'" size="small" type="info">组</el-tag>
              </div>
              <div class="node-actions" @click.stop>
                <el-dropdown v-if="data.type === 'resource'" trigger="click">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="voucher in data.data.vouchers" :key="voucher.id" @click="handleConnectResourceWithVoucher(data, voucher)">
                        连接 ({{ voucher.name }})
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
      <div class="terminal-panel">
        <SSHTabs ref="sshTabsRef" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { MoreFilled, Folder, Monitor, Key, Search } from '@element-plus/icons-vue'
import SSHTabs from '@/components/SShTerminal/SSHTabs.vue'
import { resourceStore } from '@/stores/resource'
import type { Resource, Voucher } from '@/struct/resource.ts'

const store = resourceStore()
const sshTabsRef = ref()
const resourceTreeRef = ref()
const searchQuery = ref('')

const treeProps = {
  children: 'children',
  label: 'label'
}

const treeData = computed(() => {
  return store.treeData
})

const filteredTreeData = computed(() => {
  // 过滤掉凭证节点，只显示资源组和资源
  const filterOutVouchers = (nodes: any[]): any[] => {
    return nodes.filter(node => {
      if (node.type === 'voucher') {
        return false
      }
      if (node.children && node.children.length > 0) {
        node.children = filterOutVouchers(node.children)
        return node.children.length > 0 || node.type !== 'group'
      }
      return true
    })
  }

  let filteredNodes = filterOutVouchers([...treeData.value])

  // 应用搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    const filterBySearch = (nodes: any[]): any[] => {
      return nodes.filter(node => {
        const matches = node.label.toLowerCase().includes(query)
        if (node.children && node.children.length > 0) {
          node.children = filterBySearch(node.children)
          return matches || node.children.length > 0
        }
        return matches
      })
    }
    filteredNodes = filterBySearch(filteredNodes)
  }

  return filteredNodes
})

const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

const getNodeIcon = (type: string) => {
  if (type === 'group') return Folder
  if (type === 'resource') return Monitor
  return Key
}

const handleNodeClick = (data: any) => {
  if (data.type === 'resource') {
    handleConnectResource(data)
  }
}

const handleConnectResource = async (data: any) => {
  const resource = data.data as Resource
  if (!resource.vouchers || resource.vouchers.length === 0) {
    ElMessage.warning('该资源未绑定凭证，无法连接')
    return
  }
  // 使用第一个凭证进行连接
  const voucher = resource.vouchers[0]
  if (!voucher) {
    ElMessage.warning('凭证信息不存在，无法连接')
    return
  }
  // 这里应该从用户信息中获取token，暂时使用示例token
  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg2NzExMjA3LCJpYXQiOjE3Njk0MzEyMDcsImp0aSI6ImI5ZDc1ODdmM2EyZDRkYzdiYzI3OGVhNmM0OGRlM2I3IiwidXNlcl9pZCI6IjEifQ.ST8ZdChpXpyXX1WUfIr0OJhSxAbI-rE32suJoa4ngwE"
  await sshTabsRef.value.session_add(resource.id, voucher.id, token, resource.name)
}

const handleConnectResourceWithVoucher = async (data: any, voucher: Voucher) => {
  const resource = data.data as Resource
  // 这里应该从用户信息中获取token，暂时使用示例token
  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg2NzExMjA3LCJpYXQiOjE3Njk0MzEyMDcsImp0aSI6ImI5ZDc1ODdmM2EyZDRkYzdiYzI3OGVhNmM0OGRlM2I3IiwidXNlcl9pZCI6IjEifQ.ST8ZdChpXpyXX1WUfIr0OJhSxAbI-rE32suJoa4ngwE"
  await sshTabsRef.value.session_add(resource.id, voucher.id, token, resource.name)
}

const handleSearch = () => {
  // 搜索逻辑已在filteredTreeData计算属性中实现
}

onMounted(async () => {
  await store.loadAll()
})
</script>

<style scoped lang="scss">
$primary-color: #409eff;
$success-color: #67c23a;
$danger-color: #f56c6c;
$warning-color: #e6a23c;
$text-primary: #303133;
$text-regular: #606266;
$border-color: #e6e6e6;
$bg-light: #f8f9fa;

.terminal-view {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;

  .page-header {
    margin-bottom: 16px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }
  }

  .terminal-container {
    display: flex;
    border: 1px solid $border-color;
    border-radius: 6px;
    overflow: hidden;
    height: calc(100vh - 180px);
    gap: 1px;

    .resource-panel {
      width: 250px;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid $border-color;
        background: $bg-light;

        .panel-title {
          font-size: 14px;
          font-weight: 600;
          color: $text-primary;
        }

        :deep(.el-input) {
          width: 160px;
        }
      }

      :deep(.el-tree) {
        flex: 1;
        overflow: auto;
      }

      .custom-tree-node {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 8px;
        width: 100%;

        .node-content {
          display: flex;
          align-items: center;
          gap: 8px;

          .node-icon {
            font-size: 14px;
            &.group {
              color: $primary-color;
            }
            &.resource {
              color: $success-color;
            }
            &.voucher {
              color: $warning-color;
            }
          }

          .node-label {
            font-size: 13px;
          }
        }

        .node-actions {
          display: flex;
          align-items: center;
        }
      }

      :deep(.el-tree-node__content) {
        height: 32px;
      }
    }

    .terminal-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: #ffffff;
      width: calc(100% - 250px);
    }
  }
}
</style>