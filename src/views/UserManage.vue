<template>
  <div class="user-manage-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="title">用户管理</h2>
      <el-button type="primary" @click="openAddDialog">
        <component :is="getIconComponent('Plus')" />
        <span class="btn-text">新增用户</span>
      </el-button>
    </div>

    <!-- 搜索栏：多字段独立输入框 -->
    <div class="search-bar">
      <div class="search-item">
        <label class="search-label">昵称：</label>
        <el-input
          v-model="searchForm.name"
          placeholder="请输入昵称"
          clearable
          style="width: 180px;"
        />
      </div>
      <div class="search-item">
        <label class="search-label">邮箱：</label>
        <el-input
          v-model="searchForm.email"
          placeholder="请输入邮箱"
          clearable
          style="width: 220px;"
        />
      </div>
      <div class="search-item">
        <label class="search-label">手机号：</label>
        <el-input
          v-model="searchForm.phone_number"
          placeholder="请输入手机号"
          clearable
          style="width: 180px;"
        />
      </div>
      <el-button type="primary" @click="searchUser">搜索</el-button>
      <el-button type="default" @click="resetSearch">重置</el-button>
    </div>

    <!-- 用户表格 -->
    <el-table :data="userList" border stripe>
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="account" label="登录账户" min-width="120" />
      <el-table-column prop="name" label="昵称" min-width="120" />
      <el-table-column prop="phone_number" label="手机号" min-width="130" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column prop="status" label="状态" width="150" align="center">
        <template #default="scope">
          <el-switch
            :disabled="scope.row.protected"
            v-model:value="scope.row.status"
            @change="changeStatus(scope.row)"
            active-text="启用"
            inactive-text="禁用"
          />
        </template>
      </el-table-column>

      <!-- 操作列下拉框 -->
      <el-table-column label="操作" width="140" align="center">
        <template #default="scope">
          <el-dropdown v-if="!scope.row.protected" trigger="click">
            <el-button size="small">
              操作 <i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openEditDialog(scope.row)" v-if="!scope.row.protected">
                  编辑
                </el-dropdown-item>
                <el-dropdown-item @click="openAssignDialog(scope.row)" v-if="!scope.row.protected">
                  分配角色
                </el-dropdown-item>
                <el-dropdown-item @click="openPasswdDialog(scope.row)" v-if="!scope.row.protected">
                  重置密码
                </el-dropdown-item>
                <el-dropdown-item @click="deleteUser(scope.row)" divided style="color:#F56C6C" v-if="!scope.row.protected">
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>

    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <!-- 1. 新增/编辑用户弹窗-->
    <el-dialog
      v-model="formDialogShow"
      width="600px"
      @close="closeFormDialog"
    >
      <UserForm
        v-model:user="currentUser"
        ref="formRef"
      />
      <template #footer>
        <ConfirmCancelBtnGroup
          :quit="closeFormDialog"
          :submit="formSubmit"
          :destruct="formDestruct"
        />
      </template>
    </el-dialog>

    <!-- 2. 角色分配弹窗-->
    <el-dialog
      v-model="roleDialogShow"
      title="角色分配"
      width="700px"
      @close="closeRoleDialog"
    >
      <div class="role-dialog-tip">
        当前用户：<span class="username">{{ currentUser.name }}</span> (ID: {{ currentUser.id }})
      </div>
      <RoleAssign
        v-model:user="currentUser"
        :roles="allRoles"
        ref="roleAssignRef"
      />
      <template #footer>
        <ConfirmCancelBtnGroup
          :submit="assignSubmit"
          :quit="closeRoleDialog"
          :destruct="assignDestruct"
        />
      </template>
    </el-dialog>

    <!-- 3. 重置密码弹窗 -->
    <el-dialog
      v-model="passwdDialogShow"
      title="重置密码"
      width="500px"
      @close="closePasswdDialog"
    >
      <div class="role-dialog-tip">
        当前用户：<span class="username">{{ currentUser.name }}</span> (ID: {{ currentUser.id }})
      </div>
      <ResetPassword
        v-model:user="currentUser"
        ref="passwdRef"
      />
      <template #footer>
        <ConfirmCancelBtnGroup
          :submit="passwdSubmit"
          :quit="closePasswdDialog"
          :destruct="closePasswdDialog"
        />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getIconComponent } from '@/utils/iconMap.ts'
import UserForm from '@/components/UserManage/UserForm.vue'
import RoleAssign from '@/components/UserManage/RoleAssign.vue'
import ConfirmCancelBtnGroup from '@/components/common/ConfirmCancelButton.vue'
import {type User} from '@/struct/rbac.ts'
import { request_error } from '@/requests'
import api from '@/api'
import ResetPassword from '@/components/UserManage/ResetPassword.vue'

// 核心修改：多字段搜索表单
const searchForm = ref({
  name: '',         // 昵称
  email: '',        // 邮箱
  phone_number: ''  // 手机号
})

const userList = ref<User[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const allRoles = ref<any[]>([])
const currentUser = ref()

const formDialogShow = ref(false)
const roleDialogShow = ref(false)
const passwdDialogShow = ref(false)

const formRef = ref()
const roleAssignRef = ref()
const passwdRef = ref()

const emptyCurrentUser = () => {
  currentUser.value = {
    id: 0,
    account:'',
    name: '',
    email: '',
    status: true,
    phone_number: '',
    create_date: '',
    update_date: '',
    login_date: '',
    remark: '',
  }
}
const changeStatus = async (row: User) => {
  const data = {
    id:row.id,
    status:row.status
  }
  try{
    const res = await api.userApi.updateUser(data)
    if(res.data.code == 200){
      ElMessage.success('修改成功')
    }else{
      ElMessage.error('修改失败')
      row.status = !row.status
    }
  }catch (err){
    request_error(err)
    row.status = !row.status
  }
}

// 保留：未使用的命令处理函数
const handleOperateCommand = async (row: User, command: string) => {
  switch(command) {
    case 'edit':
      await openEditDialog(row)
      break
    case 'assignRole':
      await openAssignDialog(row)
      break
    case 'resetPwd':
      await openPasswdDialog(row)
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          '此操作将永久删除该用户，是否继续？',
          '删除确认',
          {
            confirmButtonText: '确认删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        ElMessage.info('删除功能暂未实现')
      } catch {
        ElMessage.info('已取消删除')
      }
      break
  }
}

const openAddDialog = async () => {
  emptyCurrentUser()
  formDialogShow.value = true
}
const openEditDialog = async (row: User) => {
  emptyCurrentUser()
  Object.assign(currentUser.value, row)
  formDialogShow.value = true
}
const closeFormDialog = async () => {
  emptyCurrentUser()
  formDialogShow.value = false
}
const formSubmit = async () => {
  formRef.value?.submit();
}
const formDestruct = async () => {
  await init()
  await closeFormDialog()
}

const openAssignDialog = async (row: User) => {
  emptyCurrentUser()
  roleDialogShow.value = true
  Object.assign(currentUser.value, row)
}
const assignSubmit = async () => {
  roleAssignRef.value?.submit()
}
const closeRoleDialog = async () => {
  emptyCurrentUser()
  roleDialogShow.value = false
}
const assignDestruct = async () => {
  await init()
  await closeRoleDialog()
}

const openPasswdDialog = async (row:User)=>{
  emptyCurrentUser()
  passwdDialogShow.value = true
  Object.assign(currentUser.value, row)
}
const passwdSubmit = async ()=>{
  passwdRef.value?.submit()
}
const closePasswdDialog = async () => {
  emptyCurrentUser()
  passwdDialogShow.value = false
}

const deleteUser = async (row:User)=>{
  try {
    await ElMessageBox.confirm('是否确认此操作?', '提交确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch(err){
    return
  }
  const data = {
    id_list : typeof row.id === 'number' ? [row.id] : []
  }
  try{
    const res = await api.userApi.deleteUser(data)
    if (res.data.code == 200){
      ElMessage.success('删除成功')
      init()
    }
    else ElMessage.error(res.data.detail)
  }catch (err){
    request_error(err)
  }
}

// 核心修改：多条件组合搜索
const searchUser = async () => {
  // 重置分页到第一页
  currentPage.value = 1
  // 构造搜索参数（只传递有值的字段，适配Django Filter）
  const searchParams: Record<string, any> = {
    page: currentPage.value,
    size: pageSize.value
  }

  // 遍历搜索表单，只添加非空字段
  Object.entries(searchForm.value).forEach(([key, value]) => {
    if (value) {
      searchParams[key] = value
    }
  })

  try {
    const res = await api.userApi.getUser(searchParams)
    if (res.data.code === 200) {
      userList.value = res.data.detail
      total.value = res.data.total
    } else {
      ElMessage.error(res.data.detail)
    }
  } catch (error) {
    request_error(error)
  }
}

// 新增：重置所有搜索条件
const resetSearch = () => {
  // 清空搜索表单
  searchForm.value = {
    name: '',
    email: '',
    phone_number: ''
  }
  // 重新加载全部数据
  currentPage.value = 1
  init()
}

const init = async () => {
  try {
    // 初始化时也支持带搜索条件
    const initParams: Record<string, any> = {
      page: currentPage.value,
      size: pageSize.value
    }

    // 只传递非空的搜索条件
    Object.entries(searchForm.value).forEach(([key, value]) => {
      if (value) {
        initParams[key] = value
      }
    })

    const res = await api.userApi.getUser(initParams)
    if (res.data.code === 200) {
      userList.value = res.data.detail
      total.value = res.data.total
    }else{
     ElMessage.error(res.data.detail)
    }
  }catch(error) {
    request_error(error)
  }
  const res = await api.roleApi.getRole({})
  if (res.data.code === 200) {
    allRoles.value = res.data.detail
  }
}
onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
// 全局变量
$primary-color: #409eff;
$success-color: #67c23a;
$danger-color: #f56c6c;
$text-primary: #303133;
$text-regular: #606266;
$text-placeholder: #909399;
$border-color: #e6e6e6;
$bg-light: #f8f9fa;
$font-main: "Inter", "Microsoft YaHei", "PingFang SC", sans-serif;

// 页面主样式
.user-manage-page {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
  font-family: $font-main;

  // 页面头部
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
      line-height: 1.4;
    }

    :deep(.el-button) {
      --el-button-border-radius: 6px;
      height: 40px;
      padding: 0 16px;
      font-size: 14px;
      font-weight: 500;

      .btn-text {
        margin-left: 6px;
      }
    }
  }

  // 核心修改：多字段搜索栏样式
  .search-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 20px;
    background-color: $bg-light;
    border-radius: 6px;
    margin-bottom: 16px;

    .search-item {
      display: flex;
      align-items: center;

      .search-label {
        font-size: 14px;
        color: $text-regular;
        margin-right: 8px;
        white-space: nowrap;
      }
    }

    :deep(.el-input) {
      .el-input__inner {
        height: 36px;
        border-radius: 4px;
        font-size: 14px;
      }
    }

    :deep(.el-button) {
      height: 36px;
      padding: 0 16px;
      font-size: 14px;
      margin-left: 8px;
    }
  }

  // 表格样式
  :deep(.el-table) {
    --el-table-header-text-color: $text-primary;
    --el-table-row-hover-bg-color: #f5f7fa;
    --el-table-border-color: $border-color;
    --el-table-stripe-bg-color: #fafafa;

    .el-table-cell {
      padding: 12px 0;
      font-size: 14px;
      color: $text-primary;
      line-height: 1.5;
    }

    .el-table__header-wrapper .el-table-cell {
      font-weight: 600;
      background-color: $bg-light;
    }

    // 状态开关
    .el-switch {
      --el-switch-on-color: $success-color !important;
      --el-switch-off-color: #e6e6e6 !important;
      &.is-disabled { opacity: 1 !important; }
    }
  }

  // 分页样式
  .pagination {
    margin-top: 20px;
    text-align: right;

    :deep(.el-pagination) {
      font-size: 13px;
      color: $text-regular;

      .el-pager li {
        min-width: 32px;
        height: 32px;
        line-height: 32px;
        &.is-active {
          background-color: $primary-color;
          color: #fff;
        }
      }
    }
  }

  // 弹窗通用样式
  :deep(.el-dialog) {
    --el-dialog-border-radius: 8px;

    .el-dialog__header {
      padding: 16px 20px;
      border-bottom: 1px solid $border-color;

      .el-dialog__title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .el-dialog__body {
      padding: 20px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 12px 20px;
      border-top: 1px solid $border-color;
      text-align: right;
      padding-right: 0;
    }
  }

  // 角色分配/重置密码弹窗提示
  .role-dialog-tip {
    font-size: 14px;
    color: $text-regular;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px dashed $border-color;

    .username {
      color: $primary-color;
      font-weight: 500;
    }
  }

  // 滚动条优化
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 3px;

    &:hover {
      background: #c0c4cc;
    }
  }
}
</style>
