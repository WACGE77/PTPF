<template>
  <div class="users-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <!-- 搜索区域 -->
          <div class="search-area">
            <el-input v-model="searchKeyword.key" placeholder="搜索用户名 / 昵称" clearable />
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
              <el-icon><component :is="getIconComponent('Plus')" /></el-icon>
              添加用户
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表格 -->
      <el-table
        :data="Users"
        v-loading="TableLoading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" :selectable="isRowSelectable" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="account" label="账号" />
        <el-table-column prop="name" label="昵称" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone_number" label="电话" />
        <el-table-column prop="create_date" label="创建时间" width="180" />

        <!-- 操作列 -->
        <el-table-column label="操作" width="400" fixed="right">
          <template #default="{ row }">
            <!-- 编辑 -->
            <el-tooltip
              :content="row.protected ? '系统用户不可编辑' : ''"
              :disabled="!row.protected"
            >
              <el-button
                type="primary"
                link
                :disabled="row.protected || buttonLoading.edit"
                @click="!row.protected && handleEdit(row)"
              >
                <el-icon><component :is="getIconComponent('Edit')" /></el-icon>
                编辑
              </el-button>
            </el-tooltip>

            <!-- 分配角色 -->
            <el-tooltip
              :content="row.protected ? '系统用户角色不可修改' : ''"
              :disabled="!row.protected"
            >
              <el-button
                type="success"
                link
                :disabled="row.protected || buttonLoading.role"
                @click="!row.protected && handleRole(row)"
              >
                <el-icon><component :is="getIconComponent('User')" /></el-icon>
                角色
              </el-button>
            </el-tooltip>

            <!-- 重置密码 -->
            <el-tooltip
              :content="row.protected ? '系统用户不可重置密码' : ''"
              :disabled="!row.protected"
            >
              <el-button
                type="warning"
                link
                :disabled="row.protected || buttonLoading.resetPwd"
                @click="!row.protected && handleResetPassword(row)"
              >
                <el-icon><component :is="getIconComponent('Lock')" /></el-icon>
                重置密码
              </el-button>
            </el-tooltip>

            <!-- 删除 -->
            <el-tooltip
              :content="row.protected ? '系统用户不可删除' : ''"
              :disabled="!row.protected"
            >
              <el-button
                type="danger"
                link
                :disabled="row.protected || buttonLoading.delete"
                @click="!row.protected && handleDelete(row)"
              >
                <el-icon><component :is="getIconComponent('Delete')" /></el-icon>
                删除
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="Users && Users.length > 0"
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

    <!-- 新增 / 编辑用户 -->
    <el-dialog
      v-model="UserDialogVisible"
      :title="UserDialogTitle"
      width="600px"
      @close="cancelUserDialog"
    >
      <el-form ref="formRef" :model="UserFormData" :rules="computedFormRules" label-width="100px">
        <el-form-item label="用户名" prop="account">
          <el-input v-model="UserFormData.account" />
        </el-form-item>

        <el-form-item label="昵称" prop="name">
          <el-input v-model="UserFormData.name" />
        </el-form-item>

        <!-- 仅在“添加用户”时显示密码 -->
        <el-form-item v-if="UserDialogTitle === '添加用户'" label="密码" prop="password">
          <el-input
            v-model="UserFormData.password"
            type="password"
            show-password
            placeholder="请输入至少6位密码"
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="UserFormData.email" />
        </el-form-item>
        <el-form-item label="手机" prop="phone_number">
          <el-input v-model="UserFormData.phone_number" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelUserDialog">取消</el-button>
        <el-button type="primary" :loading="buttonLoading.submit" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配角色 -->
    <el-dialog
      v-model="RoleDialogVisible"
      :title="`为【${RoleDialogTitle}】分配角色`"
      width="600px"
      @close="closeRoleDialog"
    >
      <el-checkbox-group v-model="checkedRoles">
        <el-checkbox v-for="role in roleList" :key="role.id" :label="role.id">
          {{ role.name }}
        </el-checkbox>
      </el-checkbox-group>

      <template #footer>
        <el-button @click="closeRoleDialog">取消</el-button>
        <el-button type="primary" :loading="buttonLoading.saveRole" @click="handleSaveRole">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'
import time from '@/utils/time'
import { getIconComponent } from '@/utils/iconMap'
import type { User, Role } from '@/struct/index'
import type { FormItemRule } from 'element-plus'

// ====== 类型守卫：用于安全判断 Axios 错误 ======
interface AxiosErrorLike {
  response?: {
    status: number
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

/* ===== 按钮 loading ===== */
const buttonLoading = ref({
  search: false,
  add: false,
  edit: false,
  delete: false,
  batchDelete: false,
  submit: false,
  role: false,
  saveRole: false,
  resetPwd: false,
})

/* ===== 表格分页 ===== */
const TableLoading = ref(false)
const totalPage = ref(0)
const searchKeyword = ref({
  page_size: 10,
  page_number: 1,
  key: '',
})
const Users = ref<User[]>([])
const selectedRows = ref<User[]>([])
const roleList = ref<Role[]>([])

/* ===== 对话框 ===== */
const UserDialogVisible = ref(false)
const RoleDialogVisible = ref(false)
const UserDialogTitle = ref('添加用户')
const RoleDialogTitle = ref('')
const currentUserId = ref<number | null>(null)
const formRef = ref()
const UserFormData = ref({
  id: 0,
  account: '',
  name: '',
  email: '',
  phone_number: '',
  password: '',
})

// 基础规则（不含密码）
const baseFormRules = {
  account: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

// 动态规则：添加时才校验密码
const computedFormRules = computed(() => {
  const rules: Record<string, FormItemRule[]> = { ...baseFormRules }
  if (UserDialogTitle.value === '添加用户') {
    rules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码至少6位', trigger: 'blur' },
    ]
  }
  return rules
})

const checkedRoles = ref<number[]>([])

/* ===== 表格 ===== */
const isRowSelectable = (row: User) => !row.protected
const handleSelectionChange = (rows: User[]) => {
  selectedRows.value = rows
}

/* ===== 搜索 ===== */
const handleSearch = () => {
  if (buttonLoading.value.search) return
  buttonLoading.value.search = true
  getUsers().finally(() => {
    buttonLoading.value.search = false
  })
}

/* ===== CRUD ===== */
const handleAdd = () => {
  if (buttonLoading.value.add) return
  buttonLoading.value.add = true
  UserDialogTitle.value = '添加用户'
  UserDialogVisible.value = true
}

const handleEdit = (row: User) => {
  if (row.protected || buttonLoading.value.edit) return
  buttonLoading.value.edit = true
  UserDialogTitle.value = '编辑用户'
  Object.assign(UserFormData.value, {
    id: row.id,
    account: row.account,
    name: row.name,
    email: row.email,
    phone_number: row.phone_number,
    password: '',
  })
  UserDialogVisible.value = true
}

const handleDelete = async (row: User) => {
  if (row.protected) return
  try {
    await ElMessageBox.confirm('确定删除该用户吗？', '提示', { type: 'warning' })
    buttonLoading.value.delete = true
    await api.userApi.deleteUser({ id_list: [row.id] })
    ElMessage.success('删除成功')
    await getUsers()
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 403) {
      ElMessage.error('没有权限')
    } else if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  } finally {
    buttonLoading.value.delete = false
  }
}

const handleBatchDelete = async () => {
  const ids = selectedRows.value.filter((item) => !item.protected).map((item) => item.id)
  if (ids.length === 0) {
    ElMessage.warning('无可删除的用户')
    return
  }
  try {
    await ElMessageBox.confirm('确定批量删除用户吗？', '提示', { type: 'warning' })
    buttonLoading.value.batchDelete = true
    await api.userApi.deleteUser({ id_list: ids })
    ElMessage.success('删除成功')
    await getUsers()
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 403) {
      ElMessage.error('没有权限')
    } else if (err !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  } finally {
    buttonLoading.value.batchDelete = false
  }
}

/* ===== 提交 ===== */
const handleSubmit = async () => {
  if (buttonLoading.value.submit) return
  buttonLoading.value.submit = true
  try {
    await formRef.value.validate()

    if (UserFormData.value.id === 0) {
      // 添加用户
      const { account, name, email, phone_number, password } = UserFormData.value
      await api.userApi.addUser({ account, name, email, phone_number, password })
      ElMessage.success('添加成功')
    } else {
      // 编辑用户
      const { id, account, name, email, phone_number } = UserFormData.value
      await api.userApi.updateUser(id, { account, name, email, phone_number })
      ElMessage.success('修改成功')
    }

    await getUsers()
    cancelUserDialog()
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 403) {
      ElMessage.error('没有权限')
    } else {
      ElMessage.error('操作失败，请重试')
    }
    console.error(err)
  } finally {
    buttonLoading.value.submit = false
  }
}

const cancelUserDialog = () => {
  UserDialogVisible.value = false
  UserFormData.value = {
    id: 0,
    account: '',
    name: '',
    email: '',
    phone_number: '',
    password: '',
  }
  formRef.value?.resetFields()
  buttonLoading.value.add = false
  buttonLoading.value.edit = false
}

/* ===== 角色分配 ===== */
const handleRole = async (row: User) => {
  if (!row.id || row.protected || buttonLoading.value.role) return
  buttonLoading.value.role = true
  currentUserId.value = row.id
  RoleDialogTitle.value = row.name
  RoleDialogVisible.value = true
  try {
    const result = await api.permissionApi.getUserRole(currentUserId.value)
    checkedRoles.value = result.data.data.user.roles
    roleList.value = result.data.data.all_roles
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 403) {
      ElMessage.error('没有权限')
    } else {
      ElMessage.error('获取角色失败')
    }
    closeRoleDialog()
  } finally {
    buttonLoading.value.role = false
  }
}

const handleSaveRole = async () => {
  if (!currentUserId.value || buttonLoading.value.saveRole) return
  buttonLoading.value.saveRole = true
  try {
    await api.permissionApi.setUserRole(currentUserId.value, { id_list: checkedRoles.value })
    ElMessage.success('角色分配成功')
    closeRoleDialog()
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 403) {
      ElMessage.error('没有权限')
    } else {
      ElMessage.error('保存失败')
    }
  } finally {
    buttonLoading.value.saveRole = false
  }
}

const closeRoleDialog = () => {
  RoleDialogVisible.value = false
  checkedRoles.value = []
}

/* ===== 重置密码 ===== */
const handleResetPassword = async (row: User) => {
  if (!row.id || row.protected || buttonLoading.value.resetPwd) return
  try {
    const { value: newPassword } = await ElMessageBox.prompt(
      `为【${row.account}】设置新密码`,
      '重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPattern: /^(?=.*\S).{6,}$/,
        inputErrorMessage: '密码不能为空且至少6位',
      },
    )
    if (!newPassword) return
    buttonLoading.value.resetPwd = true
    await api.userApi.resetAnyPassword(row.id, { password: newPassword })
    ElMessage.success('密码重置成功')
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 403) {
      ElMessage.error('没有权限')
    } else if (err !== 'cancel') {
      ElMessage.error('重置失败')
    }
  } finally {
    buttonLoading.value.resetPwd = false
  }
}

/* ===== 分页 ===== */
const handlePageSizeChange = (size: number) => {
  searchKeyword.value.page_size = size
  searchKeyword.value.page_number = 1
  getUsers()
}

const handlePageChange = (page: number) => {
  searchKeyword.value.page_number = page
  getUsers()
}

/* ===== 获取数据 ===== */
const getUsers = async () => {
  TableLoading.value = true
  try {
    const result = await api.userApi.getUser(searchKeyword.value)
    totalPage.value = result.data.data.total
    Users.value = result.data.data.users
    Users.value.forEach((u) => {
      u.create_date = time.formatISODate(u.create_date)
    })
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 403) {
      ElMessage.error('没有权限')
    } else {
      ElMessage.error('获取用户列表失败')
    }
  } finally {
    TableLoading.value = false
  }
}

getUsers()
</script>

<style scoped>
.users-page {
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
  gap: 8px;
}

.actions {
  display: flex;
  gap: 12px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
