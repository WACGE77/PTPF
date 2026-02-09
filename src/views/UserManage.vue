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

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="searchKey" placeholder="请输入用户名/手机号搜索" clearable />
      <el-button type="default" @click="searchUser">搜索</el-button>
    </div>

    <!-- 用户表格 -->
    <el-table :data="userList" border stripe>
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="account" label="登录账户" min-width="120" />
      <el-table-column prop="name" label="用户名" min-width="120" />
      <el-table-column prop="phone_number" label="手机号" min-width="130" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
<!--      <el-table-column prop="roles" label="角色" min-width="150">-->
<!--        <template #default="scope">-->
<!--          <el-tag v-for="role in scope.row.roles" :key="role.id" size="small">{{ role.name }}</el-tag>-->
<!--        </template>-->
<!--      </el-table-column>-->
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-switch v-model="scope.row.status" @change="changeStatus(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <el-button class="operate-btn edit" @click="openEditDialog(scope.row)">
            <component :is="getIconComponent('Edit')" />
            <span>编辑</span>
          </el-button>
          <el-button class="operate-btn assign" @click="openAssignDialog(scope.row)">
            <component :is="getIconComponent('User')" />
            <span>分配角色</span>
          </el-button>
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

    <!-- 1. 新增/编辑用户弹窗 (v-if控制显隐) -->
    <el-dialog
      v-model="formDialogShow"
      width="600px"
      @close="closeFormDialog"
    >
      <UserForm
        v-model:user="currentUser"
        ref="formRef"
      />
      <!-- 复用确认取消按钮组 -->
      <template #footer>
        <ConfirmCancelBtnGroup
          :quit="closeFormDialog"
          :submit="formSubmit"
        />
      </template>
    </el-dialog>

    <!-- 2. 角色分配弹窗 (v-if控制显隐) -->
    <el-dialog
      v-model="roleDialogShow"
      title="角色分配"
      width="700px"
      @close="closeRoleDialog"
    >
      <div class="role-dialog-tip">
        当前用户：<span class="username">{{ currentUser.username }}</span> (ID: {{ currentUser.id }})
      </div>
      <RoleAssign
        v-model:user="currentUser"
        :roles="allRoles"
        ref="roleAssignRef"
      />
      <!-- 复用确认取消按钮组 -->
      <template #footer>
        <ConfirmCancelBtnGroup
          :submit="assignSubmit"
          :quit="closeRoleDialog"
        />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getIconComponent } from '@/utils/iconMap.ts'
import UserForm from '@/components/UserManage/UserForm.vue'
import RoleAssign from '@/components/UserManage/RoleAssign.vue'
import ConfirmCancelBtnGroup from '@/components/common/ConfirmCancelButton.vue'
import {type User} from '@/struct/rbac.ts'
import { request_error } from '@/requests'
import api from '@/api'

const searchKey = ref()
const userList = ref<User[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const formDialogShow = ref(false)
const roleDialogShow = ref(false)
const allRoles = ref<any[]>([])
const currentUser = ref()

const formRef = ref()
const roleAssignRef = ref()

const emptyCurrentUser = () => {
  currentUser.value = {
    id: 0,
    account:'',
    name: '',
    email: '',
    status: true,
    phone_number: '',
    avatar: '',
    create_date: '',
    update_date: '',
    login_date: '',
    remark: '',
  }
}
const changeStatus = async (row: User) => {}
const _openFormDialog = async () => {
  formDialogShow.value = true
  await nextTick()
  await formRef.value?.init()
}
const openAddDialog = async () => {
  emptyCurrentUser()
  await _openFormDialog()
}
const openEditDialog = async (row: User) => {
  Object.assign(currentUser.value, row)
  await _openFormDialog()
}
const closeFormDialog = async () => {
  emptyCurrentUser()
  formDialogShow.value = false
}
const formSubmit = async () => {
  formRef.value?.submit();
}
const openAssignDialog = async (row: User) => {
  emptyCurrentUser()
  roleDialogShow.value = true
  await nextTick()
  Object.assign(currentUser.value, row)
  roleAssignRef.value?.init()
}
const assignSubmit = async () => {
  roleAssignRef.value?.submit()
}
const closeRoleDialog = async () => {
  emptyCurrentUser()
  roleDialogShow.value = false
}

const searchUser = async () => {}

const init = async () => {
  try {
    const res = await api.userApi.getUser({})
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

  // 搜索栏
  .search-bar {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background-color: $bg-light;
    border-radius: 6px;
    margin-bottom: 16px;

    :deep(.el-input) {
      width: 300px;
      margin-right: 10px;

      .el-input__inner {
        height: 40px;
        border-radius: 6px;
        font-size: 14px;
        color: $text-primary;
        padding: 0 15px;
      }
    }

    :deep(.el-button) {
      height: 40px;
      min-width: 80px;
      border-radius: 6px;
      font-size: 14px;
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

    // 角色标签
    .el-tag {
      font-size: 12px;
      font-weight: 500;
      border-radius: 4px;
      padding: 0 8px;
      height: 24px;
      line-height: 24px;
      margin-right: 4px;
    }

    // 状态开关
    .el-switch {
      --el-switch-on-color: $success-color;
      --el-switch-off-color: #e6e6e6;
      --el-switch-on-text-color: #fff;
      --el-switch-off-text-color: $text-placeholder;
    }

    // 操作按钮
    .operate-btn {
      font-size: 14px;
      font-weight: 500;
      padding: 0 4px;

      &.edit {
        color: $primary-color;
        &:hover { color: #66b1ff; }
      }

      &.assign {
        color: $success-color;
        &:hover { color: #85ce61; }
      }

      span {
        margin-left: 4px;
      }
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
        font-size: 13px;

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
        color: $text-primary;
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
      padding-right: 0; // 按钮组自带间距
    }
  }

  // 角色分配弹窗提示
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

  // Element滚动条适配
  :deep(.el-scrollbar__bar) {
    &.is-vertical {
      width: 6px;

      .el-scrollbar__thumb {
        background-color: #e0e0e0;
        border-radius: 3px;
      }
    }

    &.is-horizontal {
      display: none !important;
    }
  }
}
</style>
