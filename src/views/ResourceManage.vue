<template>
  <div class="resource-manage-page">
    <div class="page-header">
      <h2 class="title">资源管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddResourceGroup">
          <component :is="getIconComponent('Plus')" />
          <span>新增系统组</span>
        </el-button>
        <el-button type="success" @click="handleAddResource">
          <component :is="getIconComponent('Plus')" />
          <span>新增资源</span>
        </el-button>
        <el-button type="warning" @click="handleAddVoucher">
          <component :is="getIconComponent('Plus')" />
          <span>新增凭证</span>
        </el-button>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="resource-panel">
        <div class="panel-header">
          <span class="panel-title">资源</span>
        </div>
        <el-tree
          ref="resourceTreeRef"
          :data="resourceTreeData"
          :props="treeProps"
          node-key="id"
          :expand-on-click-node="false"
          :default-expand-all="true"
          @node-click="handleResourceNodeClick"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <div class="node-content">
                <el-icon class="node-icon" :class="data.type">
                  <component :is="getNodeIcon(data.type)" />
                </el-icon>
                <span class="node-label">{{ node.label }}</span>
                <el-tag v-if="data.type === 'group'" size="small" type="info">组</el-tag>
                <el-tag v-if="data.type === 'resource'" :type="data.status ? 'success' : 'danger'" size="small">
                  {{ data.status ? '在线' : '离线' }}
                </el-tag>
              </div>
              <div class="node-actions" @click.stop>
                <el-dropdown v-if="data.type === 'group'" trigger="click">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleAddSubGroup(data)">添加子组</el-dropdown-item>
                      <el-dropdown-item @click="handleAddResourceToGroup(data)">添加资源</el-dropdown-item>
                      <el-dropdown-item @click="handleEditGroup(data)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleDeleteGroup(data)" divided style="color: #F56C6C">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-dropdown v-if="data.type === 'resource'" trigger="click">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleBindVoucher(data)">绑定凭证</el-dropdown-item>
                      <el-dropdown-item @click="handleEditResource(data)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleDeleteResource(data)" divided style="color: #F56C6C">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <div class="voucher-panel">
        <div class="panel-header">
          <span class="panel-title">凭证</span>
        </div>
        <el-tree
          ref="voucherTreeRef"
          :data="voucherTreeData"
          :props="treeProps"
          node-key="id"
          :expand-on-click-node="false"
          :default-expand-all="true"
          @node-click="handleVoucherNodeClick"
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
                <el-dropdown v-if="data.type === 'group'" trigger="click">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleAddSubGroup(data)">添加子组</el-dropdown-item>
                      <el-dropdown-item @click="handleAddVoucherToGroup(data)">添加凭证</el-dropdown-item>
                      <el-dropdown-item @click="handleEditGroup(data)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleDeleteGroup(data)" divided style="color: #F56C6C">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-dropdown v-if="data.type === 'voucher'" trigger="click">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleEditVoucher(data)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleDeleteVoucher(data)" divided style="color: #F56C6C">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <div class="detail-panel">
        <ResourceDetail 
          :node="selectedDetail"
          @bind-voucher="handleBindVoucher"
          @edit="handleEditFromDetail"
          @delete="handleDeleteFromDetail"
        />
      </div>
    </div>

    <el-dialog
      v-model="groupDialogVisible"
      :title="groupDialogTitle"
      width="500px"
      @close="closeGroupDialog"
    >
      <GroupForm
        ref="groupFormRef"
        :group="currentGroup"
        :parent-id="currentParentId"
        @success="handleGroupSuccess"
      />
      <template #footer>
        <ConfirmCancelBtnGroup
          :quit="closeGroupDialog"
          :submit="submitGroupForm"
          :destruct="destructGroupForm"
        />
      </template>
    </el-dialog>

    <el-dialog
      v-model="resourceDialogVisible"
      :title="resourceDialogTitle"
      width="500px"
      @close="closeResourceDialog"
    >
      <ResourceForm
        ref="resourceFormRef"
        :resource="currentResource"
        :group-id="currentGroupId"
        @success="handleResourceSuccess"
      />
      <template #footer>
        <ConfirmCancelBtnGroup
          :quit="closeResourceDialog"
          :submit="submitResourceForm"
          :destruct="destructResourceForm"
        />
      </template>
    </el-dialog>

    <el-dialog
      v-model="voucherDialogVisible"
      :title="voucherDialogTitle"
      width="500px"
      @close="closeVoucherDialog"
    >
      <VoucherForm
        ref="voucherFormRef"
        :voucher="currentVoucher"
        :group-id="currentGroupId"
        @success="handleVoucherSuccess"
      />
      <template #footer>
        <ConfirmCancelBtnGroup
          :quit="closeVoucherDialog"
          :submit="submitVoucherForm"
          :destruct="destructVoucherForm"
        />
      </template>
    </el-dialog>

    <el-dialog
      v-model="bindVoucherDialogVisible"
      title="绑定凭证"
      width="500px"
      @close="closeBindVoucherDialog"
    >
      <BindVoucher
        ref="bindVoucherRef"
        :resource="bindVoucherResource"
        :all-vouchers="store.vouchers"
        @success="handleBindVoucherSuccess"
      />
      <template #footer>
        <ConfirmCancelBtnGroup
          :quit="closeBindVoucherDialog"
          :submit="submitBindVoucher"
          :destruct="destructBindVoucher"
        />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'
import { getIconComponent } from '@/utils/iconMap.ts'
import ConfirmCancelBtnGroup from '@/components/common/ConfirmCancelButton.vue'
import GroupForm from '@/components/ResourceManage/GroupForm.vue'
import ResourceForm from '@/components/ResourceManage/ResourceForm.vue'
import VoucherForm from '@/components/ResourceManage/VoucherForm.vue'
import BindVoucher from '@/components/ResourceManage/BindVoucher.vue'
import ResourceDetail from '@/components/ResourceManage/ResourceDetail.vue'
import { resourceStore } from '@/stores/resource'
import requests from '@/requests'
import type { ResourceGroup, Resource as ResourceType, Voucher, TreeNode } from '@/struct/resource.ts'
import { Folder, Monitor, Key } from '@element-plus/icons-vue'

const request_error = requests.request_error

const store = resourceStore()

const resourceTreeRef = ref()
const voucherTreeRef = ref()

const treeProps = {
  children: 'children',
  label: 'label'
}

const selectedResource = ref<ResourceType | null>(null)
const selectedVoucher = ref<Voucher | null>(null)

interface TreeDataNode {
  id: number
  label: string
  type: 'group' | 'resource' | 'voucher'
  children?: TreeDataNode[]
  data: ResourceGroup | ResourceType | Voucher
  status?: boolean
}

const getNodeIcon = (type: string) => {
  if (type === 'group') return Folder
  if (type === 'resource') return Monitor
  return Key
}

const resourceTreeData = computed<TreeDataNode[]>(() => {
  return store.buildResourceTree() as TreeDataNode[]
})

const voucherTreeData = computed<TreeDataNode[]>(() => {
  return store.buildVoucherTree() as TreeDataNode[]
})

const selectedDetail = computed<TreeNode | null>(() => {
  if (selectedResource.value) {
    return {
      id: selectedResource.value.id,
      label: selectedResource.value.name,
      type: 'resource',
      data: selectedResource.value
    }
  }
  if (selectedVoucher.value) {
    return {
      id: selectedVoucher.value.id,
      label: selectedVoucher.value.name,
      type: 'voucher',
      data: selectedVoucher.value
    }
  }
  return null
})

const handleResourceNodeClick = (data: TreeDataNode) => {
  if (data.type === 'resource') {
    selectedResource.value = data.data as ResourceType
    selectedVoucher.value = null
  }
}

const handleVoucherNodeClick = (data: TreeDataNode) => {
  if (data.type === 'voucher') {
    selectedVoucher.value = data.data as Voucher
    selectedResource.value = null
  }
}

const groupDialogVisible = ref(false)
const groupDialogTitle = ref('新增资源组')
const groupFormRef = ref()
const currentGroup = ref<ResourceGroup | undefined>()
const currentParentId = ref<number | null>(null)

const resourceDialogVisible = ref(false)
const resourceDialogTitle = ref('新增资源')
const resourceFormRef = ref()
const currentResource = ref<ResourceType | undefined>()
const currentGroupId = ref<number>(0)

const voucherDialogVisible = ref(false)
const voucherDialogTitle = ref('新增凭证')
const voucherFormRef = ref()
const currentVoucher = ref<Voucher | undefined>()

const bindVoucherDialogVisible = ref(false)
const bindVoucherRef = ref()
const bindVoucherResource = ref<ResourceType | null>(null)

const handleAddResourceGroup = () => {
  groupDialogTitle.value = '新增资源组'
  currentGroup.value = undefined
  currentParentId.value = null
  groupDialogVisible.value = true
}

const handleAddSubGroup = (data: TreeDataNode) => {
  const group = data.data as ResourceGroup
  groupDialogTitle.value = '新增子资源组'
  currentGroup.value = undefined
  currentParentId.value = group.id
  groupDialogVisible.value = true
}

const handleAddResourceToGroup = (data: TreeDataNode) => {
  const group = data.data as ResourceGroup
  resourceDialogTitle.value = '新增资源'
  currentResource.value = undefined
  currentGroupId.value = group.id
  resourceDialogVisible.value = true
}

const handleAddResource = () => {
  const firstGroup = store.groups[0]
  resourceDialogTitle.value = '新增资源'
  currentResource.value = undefined
  currentGroupId.value = firstGroup?.id || 0
  resourceDialogVisible.value = true
}

const handleAddVoucher = () => {
  const firstGroup = store.groups[0]
  voucherDialogTitle.value = '新增凭证'
  currentVoucher.value = undefined
  currentGroupId.value = firstGroup?.id || 0
  voucherDialogVisible.value = true
}

const handleEditGroup = (data: TreeDataNode) => {
  groupDialogTitle.value = '编辑资源组'
  currentGroup.value = data.data as ResourceGroup
  currentParentId.value = null
  groupDialogVisible.value = true
}

const handleDeleteGroup = async (data: TreeDataNode) => {
  try {
    await ElMessageBox.confirm('此操作将永久删除该资源组及其所有子资源，是否继续？', '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await store.deleteGroup([(data.data as ResourceGroup).id])
    ElMessage.success('删除成功')
  } catch (err) {
    request_error(err)
  }
}

const handleAddVoucherToGroup = (data: TreeDataNode) => {
  const group = data.data as ResourceGroup
  voucherDialogTitle.value = '新增凭证'
  currentVoucher.value = undefined
  currentGroupId.value = group.id
  voucherDialogVisible.value = true
}

const handleEditVoucherGroup = (data: TreeDataNode) => {
  groupDialogTitle.value = '编辑资源组'
  currentGroup.value = data.data as ResourceGroup
  currentParentId.value = null
  groupDialogVisible.value = true
}

const handleDeleteVoucherGroup = async (data: TreeDataNode) => {
  try {
    await ElMessageBox.confirm('此操作将永久删除该资源组及其所有凭证，是否继续？', '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await store.deleteGroup([(data.data as ResourceGroup).id])
    ElMessage.success('删除成功')
  } catch (err) {
    request_error(err)
  }
}

const closeGroupDialog = () => {
  groupDialogVisible.value = false
  groupFormRef.value?.init()
}

const submitGroupForm = async () => {
  groupFormRef.value?.submit()
}

const destructGroupForm = async () => {}

const handleGroupSuccess = () => {
  closeGroupDialog()
  store.loadAll()
}

const handleResourceSuccess = () => {
  closeResourceDialog()
  store.loadAll()
}

const handleVoucherSuccess = () => {
  closeVoucherDialog()
  store.loadAll()
}

const handleBindVoucherSuccess = () => {
  closeBindVoucherDialog()
  store.loadAll()
}

const handleEditResource = (data: TreeDataNode) => {
  resourceDialogTitle.value = '编辑资源'
  currentResource.value = data.data as ResourceType
  currentGroupId.value = 0
  resourceDialogVisible.value = true
}

const handleDeleteResource = async (data: TreeDataNode) => {
  try {
    await ElMessageBox.confirm('此操作将永久删除该资源，是否继续？', '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await store.deleteResource([(data.data as ResourceType).id])
    ElMessage.success('删除成功')
    if (selectedResource.value?.id === (data.data as ResourceType).id) {
      selectedResource.value = null
    }
  } catch (err) {
    request_error(err)
  }
}

const closeResourceDialog = () => {
  resourceDialogVisible.value = false
  resourceFormRef.value?.init()
}

const submitResourceForm = async () => {
  resourceFormRef.value?.submit()
}

const destructResourceForm = async () => {}

const handleEditVoucher = (data: TreeDataNode) => {
  voucherDialogTitle.value = '编辑凭证'
  currentVoucher.value = data.data as Voucher
  currentGroupId.value = 0
  voucherDialogVisible.value = true
}

const handleDeleteVoucher = async (data: TreeDataNode) => {
  try {
    await ElMessageBox.confirm('此操作将永久删除该凭证，是否继续？', '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await store.deleteVoucher([(data.data as Voucher).id])
    ElMessage.success('删除成功')
    if (selectedVoucher.value?.id === (data.data as Voucher).id) {
      selectedVoucher.value = null
    }
  } catch (err) {
    request_error(err)
  }
}

const closeVoucherDialog = () => {
  voucherDialogVisible.value = false
  voucherFormRef.value?.init()
}

const submitVoucherForm = async () => {
  voucherFormRef.value?.submit()
}

const destructVoucherForm = async () => {}

const handleBindVoucher = (data: TreeDataNode | ResourceType) => {
  if ('data' in data) {
    // 从资源树点击，data是TreeDataNode类型
    bindVoucherResource.value = data.data as ResourceType
  } else {
    // 从详情面板点击，data是ResourceType类型
    bindVoucherResource.value = data
  }
  bindVoucherDialogVisible.value = true
}

const closeBindVoucherDialog = () => {
  bindVoucherDialogVisible.value = false
  bindVoucherResource.value = null
}

const submitBindVoucher = async () => {
  bindVoucherRef.value?.submit()
}

const destructBindVoucher = async () => {}

const handleEditFromDetail = (type: 'resource' | 'voucher', data: any) => {
  if (type === 'resource') {
    resourceDialogTitle.value = '编辑资源'
    currentResource.value = data
    currentGroupId.value = data.group
    resourceDialogVisible.value = true
  } else {
    voucherDialogTitle.value = '编辑凭证'
    currentVoucher.value = data
    currentGroupId.value = data.group
    voucherDialogVisible.value = true
  }
}

const handleDeleteFromDetail = async (type: 'resource' | 'voucher', data: any) => {
  if (type === 'resource') {
    try {
      await ElMessageBox.confirm('此操作将永久删除该资源，是否继续？', '删除确认', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await store.deleteResource([data.id])
      ElMessage.success('删除成功')
      selectedResource.value = null
    } catch (err) {
      request_error(err)
    }
  } else {
    try {
      await ElMessageBox.confirm('此操作将永久删除该凭证，是否继续？', '删除确认', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await store.deleteVoucher([data.id])
      ElMessage.success('删除成功')
      selectedVoucher.value = null
    } catch (err) {
      request_error(err)
    }
  }
}

onMounted(() => {
  console.log('ResourceManage component mounted')
  try {
    store.loadAll()
    console.log('loadAll called successfully')
  } catch (error) {
    console.error('Error loading resources:', error)
  }
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

.resource-manage-page {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }

    :deep(.el-button) {
      --el-button-border-radius: 6px;
      height: 40px;
      padding: 0 16px;
    }
  }

  .content-wrapper {
    display: flex;
    gap: 16px;
    height: calc(100vh - 180px);
  }

  .resource-panel,
  .voucher-panel {
    flex: 1;
    border: 1px solid $border-color;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .detail-panel {
    width: 350px;
    border: 1px solid $border-color;
    border-radius: 6px;
    overflow: auto;
  }

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

  :deep(.el-dialog) {
    .el-dialog__header {
      padding: 16px 20px;
      border-bottom: 1px solid $border-color;
    }

    .el-dialog__body {
      padding: 20px;
    }

    .el-dialog__footer {
      padding: 12px 20px;
      border-top: 1px solid $border-color;
    }
  }
}
</style>
