<template>
  <div class="permission-manage-page">
    <div class="page-header">
      <h2 class="title">权限分配</h2>
    </div>

    <div class="content-wrapper">
      <div class="role-selector">
        <RoleSelector
          :roles="roles"
          :is-loading="isLoading"
          @role-select="handleRoleSelect"
        />
      </div>

      <div class="permission-panel">
        <PermissionSetting
          :selected-role="selectedRole"
          @permission-saved="handlePermissionSaved"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { request_error } from '@/requests'
import api from '@/api'
import type { Role } from '@/struct/rbac.ts'
import RoleSelector from '@/components/PermissionManage/RoleSelector.vue'
import PermissionSetting from '@/components/PermissionManage/PermissionSetting.vue'

const roles = ref<Role[]>([])
const selectedRole = ref<Role | null>(null)
const isLoading = ref(false)

const loadRoles = async () => {
  isLoading.value = true
  try {
    const res = await api.roleApi.getRole({})
    if (res.data.code === 200) {
      // 处理 DRF 框架的响应格式
      let roleData = res.data.detail || []
      // 确保 roleData 是一个数组
      if (!Array.isArray(roleData)) {
        roleData = []
      }
      roles.value = roleData
    } else {
      ElMessage.error(res.data.detail)
      // API 调用失败时使用默认角色数据
      useDefaultRoles()
    }
  } catch (error) {
    request_error(error)
    // API 调用异常时使用默认角色数据
    useDefaultRoles()
  } finally {
    isLoading.value = false
  }
}

// 使用默认角色数据
const useDefaultRoles = () => {
  roles.value = [
    { id: 1, name: '超级管理员', code: 'admin', description: '拥有系统所有权限', status: true },
    { id: 2, name: '运维人员', code: 'operator', description: '管理服务器资源和会话', status: true },
    { id: 3, name: '审计人员', code: 'auditor', description: '查看系统审计日志', status: true },
    { id: 4, name: '普通用户', code: 'user', description: '仅能访问授权资源', status: true }
  ]
}

const handleRoleSelect = (role: Role) => {
  selectedRole.value = role
}

const handlePermissionSaved = () => {
  // 权限保存成功后的处理
  console.log('权限保存成功')
}

onMounted(() => {
  loadRoles()
})
</script>

<style scoped lang="scss">
$primary-color: #409eff;
$text-primary: #303133;
$text-regular: #606266;
$border-color: #e6e6e6;
$bg-light: #f8f9fa;

.permission-manage-page {
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
  }

  .content-wrapper {
    display: flex;
    gap: 16px;
    height: calc(100vh - 180px);

    .role-selector {
      width: 250px;
      flex-shrink: 0;
    }

    .permission-panel {
      flex: 1;
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