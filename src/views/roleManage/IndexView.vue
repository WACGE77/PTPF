<template>
  <div class="roles-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <!-- 搜索区域 -->
          <div class="search-area">
            <el-input v-model="searchKeyword.key" placeholder="搜索角色名称或编码" clearable />
            <el-button
              type="primary"
              :loading="buttonLoading.search"
              :disabled="buttonLoading.search"
              @click="handleSearch"
            >
              搜索
            </el-button>
          </div>

          <!-- 操作区域 -->
          <div class="actions">
            <el-button
              v-if="selectedRows.length > 0"
              type="danger"
              :loading="buttonLoading.batchDelete"
              :disabled="buttonLoading.batchDelete"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedRows.length }})
            </el-button>
            <el-button
              type="primary"
              :loading="buttonLoading.add"
              :disabled="buttonLoading.add"
              @click="handleAdd"
            >
              <el-icon><component :is="getIconComponent('Plus')" /></el-icon> 添加角色
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表格：支持多选 -->
      <el-table
        :data="Roles"
        v-loading="TableLoading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column :selectable="isRowSelectable" type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="code" label="角色编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="create_date" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <!-- 编辑 -->
            <el-tooltip
              :content="row.protected ? '系统角色不可编辑' : ''"
              :disabled="!row.protected"
            >
              <el-button
                type="primary"
                link
                :disabled="row.protected || buttonLoading.edit"
                @click="handleEdit(row)"
              >
                <el-icon><component :is="getIconComponent('Edit')" /></el-icon> 编辑
              </el-button>
            </el-tooltip>

            <!-- 权限 -->
            <el-tooltip
              :content="row.protected ? '系统角色权限不可修改' : ''"
              :disabled="!row.protected"
            >
              <el-button
                type="success"
                link
                :disabled="row.protected || buttonLoading.permission"
                @click="handlePermission(row)"
              >
                <el-icon><component :is="getIconComponent('Key')" /></el-icon> 权限
              </el-button>
            </el-tooltip>

            <!-- 删除 -->
            <el-tooltip
              :content="row.protected ? '系统角色不可删除' : ''"
              :disabled="!row.protected"
            >
              <el-button
                type="danger"
                link
                :disabled="row.protected || buttonLoading.delete"
                @click="handleDelete(row)"
              >
                <el-icon><component :is="getIconComponent('Delete')" /></el-icon> 删除
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="Roles && Roles.length > 0"
        class="mt-4"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalPage"
        v-model:page-size="searchKeyword.page_size"
        v-model:current-page="searchKeyword.page_number"
        :page-sizes="[10, 20, 50, 100]"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="RoleInfoDialogVisible"
      @close="cancelRoleInfoDialog"
      :title="RoleInfoDialogTitle"
      width="600px"
    >
      <el-form ref="formRef" :model="RoleInfoformData" :rules="formRules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="RoleInfoformData.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="RoleInfoformData.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="RoleInfoformData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelRoleInfoDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="buttonLoading.submit"
          :disabled="buttonLoading.submit"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
    <!-- 授权对话框 -->
    <el-dialog
      v-model="PermissionDialogVisible"
      :title="`为【${PermissionTitle}】分配权限`"
      width="600px"
      @close="closePermissionDialog"
    >
      <el-tree
        ref="permissionTreeRef"
        v-loading="buttonLoading.permissionTree"
        node-key="id"
        :data="permissions"
        :props="{ label: 'name', children: 'children' }"
        show-checkbox
        default-expand-all
        :expand-on-click-node="false"
      />
      <template #footer>
        <el-button @click="closePermissionDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="buttonLoading.savePermission"
          @click="handleSavePermission"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { Role } from '@/struct'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'
import time from '@/utils/time'
import { getIconComponent } from '@/utils/iconMap'

// ====== 类型守卫：安全判断 Axios 错误 ======
interface AxiosErrorLike {
  response?: {
    status: number
    data?: unknown
  }
}

function isAxiosError(error: unknown): error is AxiosErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as AxiosErrorLike).response?.status !== undefined
  )
}

// ====== 按钮 loading 状态 ======
const buttonLoading = ref({
  search: false,
  batchDelete: false,
  add: false,
  edit: false,
  delete: false,
  submit: false,
  permission: false,
  savePermission: false,
  permissionTree: false,
})

const totalPage = ref<number>(0)
const TableLoading = ref(false)
const permissions = ref<any[]>([]) // 若你有 Permission 类型，建议替换 any
const currentRoleId = ref<number | null>(null)
const permissionTreeRef = ref()

const searchKeyword = ref({
  page_size: 10,
  page_number: 1,
  key: '',
})

const selectedRows = ref<Role[]>([])
const RoleInfoDialogVisible = ref(false)
const PermissionDialogVisible = ref(false)
const RoleInfoDialogTitle = ref('添加角色')
const PermissionTitle = ref<string>()
const formRef = ref()
const Roles = ref<Role[]>([])

const RoleInfoformData = ref({
  id: 0,
  name: '',
  code: '',
  description: '',
})

const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 20, message: '角色名称不能超过 20 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { max: 30, message: '角色编码不能超过 30 个字符', trigger: 'blur' },
  ],
}

// ====== 封装统一的 403 处理函数 ======
const handleApiError = (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    ElMessage.error('没有权限')
    return true // 表示已处理
  }
  return false // 未处理，可继续其他错误逻辑
}

// ====== 原有业务逻辑（仅在外层加 403 处理）======

const handleSearch = () => {
  if (buttonLoading.value.search) return
  buttonLoading.value.search = true
  getRoles().finally(() => {
    buttonLoading.value.search = false
  })
}

const isRowSelectable = (row: Role) => !row.protected

const handleSelectionChange = (rows: Role[]) => {
  selectedRows.value = rows
}

const deleteRole = async (id_list: number[]) => {
  const isBatch = id_list.length > 1
  if (isBatch ? buttonLoading.value.batchDelete : buttonLoading.value.delete) return

  if (isBatch) buttonLoading.value.batchDelete = true
  else buttonLoading.value.delete = true

  try {
    await ElMessageBox.confirm('确定要删除选中的角色吗？此操作不可恢复！', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })

    const param = { id_list }
    const result = await api.roleApi.deleteRole(param)
    if (result.data.code === 200) {
      ElMessage.success('删除成功')
      await getRoles()
    } else {
      ElMessage.error('删除失败，请重试')
    }
  } catch (err) {
    if (err !== 'cancel') {
      if (!handleApiError(err)) {
        ElMessage.error('操作异常')
      }
    }
  } finally {
    buttonLoading.value.delete = false
    buttonLoading.value.batchDelete = false
  }
}

const handlePermission = async (row: Role) => {
  if (!row.id) return
  buttonLoading.value.permissionTree = true
  try {
    const result = await api.permissionApi.getRolePermission(row.id, {})
    if (result.data.code === 200) {
      PermissionTitle.value = result.data.data.name
      PermissionDialogVisible.value = true
      currentRoleId.value = row.id
      await nextTick()
      permissionTreeRef.value.setCheckedKeys(result.data.data.perms)
    }
  } catch (err) {
    if (!handleApiError(err)) {
      ElMessage.error('获取权限失败')
    }
  } finally {
    buttonLoading.value.permissionTree = false
  }
}

const handleDelete = (row: Role) => {
  if (row.id) deleteRole([row.id])
}

const handleBatchDelete = () => {
  const selected = selectedRows.value
  if (selected.length === 0) {
    ElMessage.warning('请先选择要删除的角色')
    return
  }
  const list = selected
    .filter((item) => item.id && !item.protected)
    .map((item) => item.id!) as number[]

  if (list.length === 0) {
    ElMessage.warning('无可删除的非系统角色')
    return
  }
  deleteRole(list)
}

const handleAdd = () => {
  if (buttonLoading.value.add) return
  buttonLoading.value.add = true
  RoleInfoDialogVisible.value = true
}

const cancelRoleInfoDialog = () => {
  RoleInfoDialogVisible.value = false
  RoleInfoformData.value.id = 0
  formRef.value?.resetFields()
  buttonLoading.value.add = false
  buttonLoading.value.edit = false
  buttonLoading.value.submit = false
}

const closePermissionDialog = () => {
  PermissionDialogVisible.value = false
  currentRoleId.value = null
}

const handleEdit = (row: Role) => {
  if (buttonLoading.value.edit) return
  buttonLoading.value.edit = true
  RoleInfoDialogVisible.value = true
  Object.assign(RoleInfoformData.value, row)
}

const handleSubmit = async () => {
  if (buttonLoading.value.submit) return
  buttonLoading.value.submit = true

  try {
    await formRef.value?.validate()
    const isEdit = RoleInfoformData.value.id !== 0
    const apiCall = isEdit
      ? api.roleApi.updateRole(RoleInfoformData.value.id, RoleInfoformData.value)
      : api.roleApi.addRole(RoleInfoformData.value)

    const result = await apiCall
    if (result.data.code === 200) {
      ElMessage.success(isEdit ? '修改成功' : '添加成功')
      await getRoles()
      cancelRoleInfoDialog()
    } else {
      ElMessage.error(`${isEdit ? '修改' : '添加'}失败，请重试`)
    }
  } catch (err) {
    if (!handleApiError(err)) {
      ElMessage.error('操作失败')
    }
  } finally {
    buttonLoading.value.submit = false
  }
}

const handleSavePermission = async () => {
  if (!currentRoleId.value) return
  buttonLoading.value.savePermission = true
  try {
    const permissions = permissionTreeRef.value.getCheckedKeys()
    const result = await api.permissionApi.setRolePermission({
      role_id: currentRoleId.value,
      perm_ids: permissions,
    })
    if (result.data.code === 200) {
      ElMessage.success('授权成功')
    } else {
      ElMessage.error('授权失败，请重试')
    }
    closePermissionDialog()
  } catch (err) {
    if (!handleApiError(err)) {
      ElMessage.error('保存权限失败')
    }
  } finally {
    buttonLoading.value.savePermission = false
  }
}

const handlePageSizeChange = (size: number) => {
  searchKeyword.value.page_size = size
  searchKeyword.value.page_number = 1
  getRoles()
}

const handlePageChange = (page: number) => {
  searchKeyword.value.page_number = page
  getRoles()
}

const getRoles = async () => {
  TableLoading.value = true
  try {
    const result = await api.roleApi.getRole(searchKeyword.value)
    if (result.data.code === 200) {
      totalPage.value = result.data.data.total
      Roles.value = result.data.data.roles.map((role) => ({
        ...role,
        create_date: time.formatISODate(role.create_date),
      }))
    }
  } catch (err) {
    if (!handleApiError(err)) {
      ElMessage.error('获取角色列表失败')
    }
  } finally {
    TableLoading.value = false
  }
}

const Init = async () => {
  await getRoles()
  try {
    const result = await api.permissionApi.getPermission({})
    if (result.data.code === 200) {
      permissions.value = result.data.data
    }
  } catch (err) {
    if (!handleApiError(err)) {
      ElMessage.error('获取权限树失败')
    }
  }
}

Init()
</script>

<style scoped>
.roles-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
