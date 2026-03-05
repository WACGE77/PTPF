import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { request_error } from '@/requests'
import type { LoginLog, OperaLog, SessionLog } from '@/struct/audit.ts'

export const useAuditStore = defineStore('audit', () => {
  // 状态
  const loginLogs = ref<LoginLog[]>([])
  const operaLogs = ref<OperaLog[]>([])
  const sessionLogs = ref<SessionLog[]>([])
  const isLoading = ref(false)
  const total = ref(0)

  // 计算属性
  const formattedLoginLogs = computed(() => {
    return loginLogs.value.map(log => ({
      ...log,
      date: new Date(log.date).toLocaleString()
    }))
  })

  const formattedOperaLogs = computed(() => {
    return operaLogs.value.map(log => ({
      ...log,
      date: new Date(log.date).toLocaleString()
    }))
  })

  const formattedSessionLogs = computed(() => {
    return sessionLogs.value.map(log => ({
      ...log,
      start_time: new Date(log.start_time).toLocaleString(),
      end_time: log.end_time ? new Date(log.end_time).toLocaleString() : '未结束'
    }))
  })

  // 方法
  const getLoginLogs = async (params: Record<string, unknown> = {}) => {
    isLoading.value = true
    try {
      const res = await api.auditApi.loginLog(params)
      if (res.data.code === 200) {
        loginLogs.value = res.data.detail || []
        total.value = res.data.total || 0
      } else {
        console.error('获取登录日志失败:', res.data.detail)
      }
    } catch (error) {
      request_error(error)
    } finally {
      isLoading.value = false
    }
  }

  const getOperaLogs = async (params: Record<string, unknown> = {}) => {
    isLoading.value = true
    try {
      const res = await api.auditApi.operaLog(params)
      if (res.data.code === 200) {
        operaLogs.value = res.data.detail || []
        total.value = res.data.total || 0
      } else {
        console.error('获取操作日志失败:', res.data.detail)
      }
    } catch (error) {
      request_error(error)
    } finally {
      isLoading.value = false
    }
  }

  const getSessionLogs = async (params: Record<string, unknown> = {}) => {
    isLoading.value = true
    try {
      const res = await api.auditApi.sessionLog(params)
      if (res.data.code === 200) {
        sessionLogs.value = res.data.detail || []
        total.value = res.data.total || 0
      } else {
        console.error('获取会话日志失败:', res.data.detail)
      }
    } catch (error) {
      request_error(error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    loginLogs,
    operaLogs,
    sessionLogs,
    isLoading,
    total,
    // 计算属性
    formattedLoginLogs,
    formattedOperaLogs,
    formattedSessionLogs,
    // 方法
    getLoginLogs,
    getOperaLogs,
    getSessionLogs
  }
})
