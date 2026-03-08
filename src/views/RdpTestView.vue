<template>
  <div class="rdp-test-container">
    <h1>RDP连接测试</h1>
    
    <div class="test-form">
      <el-form :model="form" label-width="100px">
        <el-form-item label="资源ID">
          <el-input v-model="form.resourceId" type="number" placeholder="输入资源ID"></el-input>
        </el-form-item>
        <el-form-item label="凭证ID">
          <el-input v-model="form.voucherId" type="number" placeholder="输入凭证ID"></el-input>
        </el-form-item>
        <el-form-item label="令牌">
          <el-input v-model="form.token" placeholder="输入认证令牌" type="textarea" rows="2"></el-input>
        </el-form-item>
        <el-form-item label="分辨率">
          <el-select v-model="form.resolution" placeholder="选择分辨率">
            <el-option label="1024x768" value="1024x768"></el-option>
            <el-option label="1280x720" value="1280x720"></el-option>
            <el-option label="1920x1080" value="1920x1080"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="颜色深度">
          <el-select v-model="form.colorDepth" placeholder="选择颜色深度">
            <el-option label="8位" value="8"></el-option>
            <el-option label="16位" value="16"></el-option>
            <el-option label="24位" value="24"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="剪贴板">
          <el-switch v-model="form.enableClipboard"></el-switch>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="testWebSocket" :loading="loading">测试WebSocket连接</el-button>
          <el-button type="success" @click="testRdpConnection" :loading="loading">测试RDP连接</el-button>
          <el-button type="warning" @click="testBackendDataFormat" :loading="loading">测试数据格式</el-button>
          <el-button type="danger" @click="testDetailedConnection" :loading="loading">详细测试</el-button>
          <el-button type="info" @click="testDiagnostic" :loading="loading">诊断工具</el-button>
          <el-button @click="cleanup">清理资源</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="test-results">
      <h2>测试结果</h2>
      <el-card>
        <div class="logs" ref="logsContainer">
          <div v-for="(log, index) in logs" :key="index" :class="getLogClass(log.type)">
            {{ log.timestamp }} - {{ log.message }}
          </div>
        </div>
      </el-card>
    </div>
    
    <div class="rdp-display" ref="rdpContainer">
      <h2>RDP显示区域</h2>
      <div class="display-container" ref="displayContainer">
        <div v-if="status" class="status-overlay">
          <div class="status-content">
            <el-tag :type="getStatusType()">{{ status }}</el-tag>
            <p v-if="errorMessage">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createRdpDebugger } from '@/utils/rdpDebug'
import { testBackendData } from '@/utils/guacamoleDataTest'
import { createRdpConnectionTester } from '@/utils/rdpConnectionTest'
import { createRdpDiagnostic } from '@/utils/rdpDiagnostic'
import { ElMessage } from 'element-plus'

const form = ref({
  resourceId: 1,
  voucherId: 1,
  token: '',
  resolution: '1024x768',
  colorDepth: 16,
  enableClipboard: true
})

const loading = ref(false)
const logs = ref<{ type: 'info' | 'success' | 'error' | 'warning', message: string, timestamp: string }[]>([])
const logsContainer = ref<HTMLElement>()
const rdpContainer = ref<HTMLElement>()
const displayContainer = ref<HTMLElement>()
const status = ref<string>('')
const errorMessage = ref<string>('')

let rdpDebugger = createRdpDebugger()

// 记录日志
const log = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({ type, message, timestamp })
  // 自动滚动到底部
  setTimeout(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  }, 100)
}

// 获取日志样式类
const getLogClass = (type: string) => {
  return `log-item log-${type}`
}

// 获取状态类型
const getStatusType = () => {
  switch (status.value) {
    case 'connecting':
      return 'info'
    case 'connected':
      return 'success'
    case 'error':
      return 'danger'
    case 'disconnected':
      return 'warning'
    default:
      return 'info'
  }
}

// 测试WebSocket连接
const testWebSocket = async () => {
  if (!form.value.token) {
    ElMessage.warning('请输入认证令牌')
    return
  }
  
  loading.value = true
  log('info', '开始测试WebSocket连接...')
  
  try {
    await rdpDebugger.testWebSocketConnection(
      form.value.resourceId,
      form.value.voucherId,
      form.value.token
    )
    log('success', 'WebSocket连接测试已启动')
  } catch (error: any) {
    log('error', `测试失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 测试完整RDP连接
const testRdpConnection = () => {
  if (!form.value.token) {
    ElMessage.warning('请输入认证令牌')
    return
  }
  
  if (!displayContainer.value) {
    ElMessage.error('显示容器未初始化')
    return
  }
  
  loading.value = true
  status.value = 'connecting'
  errorMessage.value = ''
  log('info', '开始测试完整RDP连接...')
  log('info', `分辨率: ${form.value.resolution}, 颜色深度: ${form.value.colorDepth}, 剪贴板: ${form.value.enableClipboard}`)
  
  try {
    rdpDebugger.testRdpConnection(
      displayContainer.value,
      form.value.resourceId,
      form.value.voucherId,
      form.value.token,
      {
        resolution: form.value.resolution,
        color_depth: form.value.colorDepth,
        enable_clipboard: form.value.enableClipboard
      }
    )
    log('success', 'RDP连接测试已启动')
  } catch (error: any) {
    status.value = 'error'
    errorMessage.value = error.message || '未知错误'
    log('error', `测试失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 测试后端数据格式
const testBackendDataFormat = () => {
  if (!form.value.token) {
    ElMessage.warning('请输入认证令牌')
    return
  }
  
  loading.value = true
  log('info', '开始测试后端数据格式...')
  log('info', `分辨率: ${form.value.resolution}, 颜色深度: ${form.value.colorDepth}, 剪贴板: ${form.value.enableClipboard}`)
  
  try {
    testBackendData(
      form.value.resourceId,
      form.value.voucherId,
      form.value.token
    )
    log('success', '后端数据格式测试已启动，请查看浏览器控制台')
  } catch (error: any) {
    log('error', `测试失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 详细测试RDP连接
const testDetailedConnection = () => {
  if (!form.value.token) {
    ElMessage.warning('请输入认证令牌')
    return
  }
  
  if (!displayContainer.value) {
    ElMessage.error('显示容器未初始化')
    return
  }
  
  loading.value = true
  status.value = 'connecting'
  errorMessage.value = ''
  log('info', '开始详细测试RDP连接...')
  log('info', `分辨率: ${form.value.resolution}, 颜色深度: ${form.value.colorDepth}, 剪贴板: ${form.value.enableClipboard}`)
  
  try {
    const tester = createRdpConnectionTester()
    tester.startTest(
      displayContainer.value,
      form.value.resourceId,
      form.value.voucherId,
      form.value.token
    )
    log('success', '详细测试已启动，请查看显示区域的日志')
  } catch (error: any) {
    status.value = 'error'
    errorMessage.value = error.message || '未知错误'
    log('error', `测试失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 诊断RDP连接问题
const testDiagnostic = () => {
  if (!form.value.token) {
    ElMessage.warning('请输入认证令牌')
    return
  }
  
  if (!displayContainer.value) {
    ElMessage.error('显示容器未初始化')
    return
  }
  
  loading.value = true
  status.value = 'connecting'
  errorMessage.value = ''
  log('info', '开始RDP连接诊断...')
  log('info', `分辨率: ${form.value.resolution}, 颜色深度: ${form.value.colorDepth}, 剪贴板: ${form.value.enableClipboard}`)
  
  try {
    const diagnostic = createRdpDiagnostic()
    diagnostic.startDiagnostic(
      displayContainer.value,
      form.value.resourceId,
      form.value.voucherId,
      form.value.token,
      {
        resolution: form.value.resolution,
        color_depth: form.value.colorDepth,
        enable_clipboard: form.value.enableClipboard
      }
    )
    log('success', '诊断工具已启动，请查看显示区域的日志')
  } catch (error: any) {
    status.value = 'error'
    errorMessage.value = error.message || '未知错误'
    log('error', `诊断失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 清理资源
const cleanup = () => {
  log('info', '清理测试资源...')
  rdpDebugger.cleanup()
  rdpDebugger = createRdpDebugger()
  log('success', '资源清理完成')
}

// 组件挂载时初始化
onMounted(() => {
  log('info', 'RDP测试页面已加载')
})

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.rdp-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1, h2 {
  margin-bottom: 20px;
}

.test-form {
  margin-bottom: 30px;
}

.test-results {
  margin-bottom: 30px;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  font-family: monospace;
  font-size: 14px;
}

.log-item {
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 3px;
}

.log-info {
  background-color: #f5f7fa;
  color: #303133;
}

.log-success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.log-error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.log-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.rdp-display {
  margin-top: 30px;
}

.display-container {
  width: 100%;
  height: 600px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  background-color: #000;
}

.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.status-content {
  text-align: center;
  color: white;
}

.status-content p {
  margin-top: 10px;
  font-size: 14px;
  color: #f0f0f0;
}
</style>
