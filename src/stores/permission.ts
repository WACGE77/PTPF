import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { request_error } from '@/requests'
import type { Role } from '@/struct/rbac.ts'

interface Permission {
  id: number
  name: string
  description: string
  type: string
}

export const usePermissionStore = defineStore('permission', () => {
  // 状态
  const permissionList = ref<Permission[]>([])
  const selectedRole = ref<Role | null>(null)
  const selectedPermissions = ref<number[]>([])
  const isLoading = ref(false)

  // 计算属性
  const permissionSections = computed(() => {
    return [
      {
        name: '系统权限',
        permissions: permissionList.value
          .filter(p => p.type === 'system' || !p.type)
          .map(p => ({
            id: p.id,
            name: p.name,
            description: p.description
          }))
      },
      {
        name: '资源权限',
        permissions: permissionList.value
          .filter(p => p.type === 'resource')
          .map(p => ({
            id: p.id,
            name: p.name,
            description: p.description
          }))
      },
      {
        name: '审计权限',
        permissions: permissionList.value
          .filter(p => p.type === 'audit')
          .map(p => ({
            id: p.id,
            name: p.name,
            description: p.description
          }))
      }
    ]
  })

  // 方法
  const getPermissionList = async () => {
    if (permissionList.value.length > 0) {
      return
    }

    isLoading.value = true
    try {
      const res = await api.permissionApi.getPermissionList({})
      if (res.data.code === 200) {
        // 确保返回的数据是一个数组
        if (Array.isArray(res.data.detail)) {
          // 转换API返回的数据结构，适配前端组件
          permissionList.value = res.data.detail.map((perm: any) => ({
            id: perm.id,
            name: perm.name,
            description: `${perm.scope}.${perm.object}.${perm.action}`,
            type: perm.scope // 使用scope作为type
          }))
        }
      } else {
        // API 调用失败时使用默认权限数据
        useDefaultPermissionList()
      }
    } catch (error) {
      request_error(error)
      // API 调用异常时使用默认权限数据
      useDefaultPermissionList()
    } finally {
      isLoading.value = false
    }
  }

  // 使用默认权限列表数据
  const useDefaultPermissionList = () => {
    permissionList.value = [
      { id: 1, name: '系统设置', description: '管理系统配置', type: 'system' },
      { id: 2, name: '用户管理', description: '管理用户账户', type: 'system' },
      { id: 3, name: '角色管理', description: '管理角色权限', type: 'system' },
      { id: 4, name: '资源管理', description: '管理服务器资源', type: 'resource' },
      { id: 5, name: '凭证管理', description: '管理访问凭证', type: 'resource' },
      { id: 6, name: '会话管理', description: '管理终端会话', type: 'resource' },
      { id: 7, name: '操作日志', description: '查看操作日志', type: 'audit' },
      { id: 8, name: '会话日志', description: '查看会话日志', type: 'audit' },
      { id: 9, name: '登录日志', description: '查看登录日志', type: 'audit' },
      { id: 16, name: '操作日志', description: '查看操作日志', type: 'audit' },
      { id: 17, name: '会话日志', description: '查看会话日志', type: 'audit' },
      { id: 18, name: '登录日志', description: '查看登录日志', type: 'audit' }
    ]
  }

  const loadPermissions = async (roleId: number) => {
    isLoading.value = true
    try {
      const res = await api.permissionApi.getSystemPermission({ id: roleId })
      if (res.data.code === 200) {
        // 处理 DRF 框架的响应格式
        const detail = res.data.detail || {}
        
        // 检查返回的数据结构
        if (detail.perms && Array.isArray(detail.perms)) {
          // API 返回的是权限 ID 数组
          const permissionIds = detail.perms
          selectedPermissions.value = permissionIds
        } else if (Array.isArray(detail)) {
          // 兼容旧的数据结构
          const permissions = detail
          selectedPermissions.value = permissions
            .filter((p: any) => p.checked)
            .map((p: any) => p.id)
        } else {
          // 数据结构不符合预期，使用默认权限数据
          selectedPermissions.value = []
        }
      } else {
        // API 调用失败时清空权限数据
        selectedPermissions.value = []
      }
    } catch (error) {
      request_error(error)
      // API 调用异常时清空权限数据
      selectedPermissions.value = []
    } finally {
      isLoading.value = false
    }
  }

  const savePermissions = async () => {
    if (!selectedRole.value) {
      return { success: false, message: '请选择一个角色' }
    }

    if (selectedRole.value.protected) {
      return { success: false, message: '受保护角色，无法修改权限' }
    }

    isLoading.value = true
    try {
      const res = await api.permissionApi.setSystemPermission({
        id: selectedRole.value.id,
        perms: selectedPermissions.value
      })
      if (res.data.code === 200) {
        return { success: true, message: '权限保存成功' }
      } else {
        return { success: false, message: res.data.detail }
      }
    } catch (error) {
      request_error(error)
      return { success: false, message: '保存权限失败' }
    } finally {
      isLoading.value = false
    }
  }

  const setSelectedRole = (role: Role | null) => {
    selectedRole.value = role
    if (role) {
      loadPermissions(role.id)
    } else {
      selectedPermissions.value = []
    }
  }

  // 初始化
  const initialize = async () => {
    await getPermissionList()
  }

  return {
    // 状态
    permissionList,
    selectedRole,
    selectedPermissions,
    isLoading,
    // 计算属性
    permissionSections,
    // 方法
    getPermissionList,
    loadPermissions,
    savePermissions,
    setSelectedRole,
    initialize
  }
})
