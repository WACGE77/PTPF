# RDP 功能集成 Action

## 1. 后端实现

### 1.1 模块扩展

#### 1.1.1 创建 RDP 子模块目录结构

```bash
# 创建 RDP 子模块目录
mkdir -p resource/models/rdp
mkdir -p resource/views/rdp
mkdir -p resource/serializers/rdp
```

### 1.2 数据模型

#### 1.2.1 创建 RDP 配置模型

```python
# resource/models/rdp.py
from django.db import models
from resource.models import Resource, Credential

class RDPConfig(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='rdp_config')
    credential = models.ForeignKey(Credential, on_delete=models.CASCADE, related_name='rdp_config')
    rdp_port = models.IntegerField(default=3389)
    resolution = models.CharField(max_length=50, default='1024x768')
    color_depth = models.IntegerField(default=16)
    enable_clipboard = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rdp_config'
        verbose_name = 'RDP配置'
        verbose_name_plural = 'RDP配置'
```

#### 1.2.2 创建 RDP 审计日志模型

```python
# audit/models/rdp.py
from django.db import models
from resource.models import Resource

class RDPAuditLog(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='rdp_audit_logs')
    session_id = models.CharField(max_length=100)
    connect_time = models.DateTimeField()
    disconnect_time = models.DateTimeField(null=True, blank=True)
    operation_type = models.CharField(max_length=50)
    error_msg = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rdp_audit_log'
        verbose_name = 'RDP审计日志'
        verbose_name_plural = 'RDP审计日志'
```

### 1.3 序列化器

#### 1.3.1 创建 RDP 序列化器

```python
# resource/serializers/rdp.py
from rest_framework import serializers
from resource.models.rdp import RDPConfig

class RDPConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = RDPConfig
        fields = ['id', 'resource', 'credential', 'rdp_port', 'resolution', 'color_depth', 'enable_clipboard']

class RDPConnectionSerializer(serializers.Serializer):
    token = serializers.CharField()
    websocket_url = serializers.CharField()
    rdp_config = RDPConfigSerializer()
```

### 1.4 接口开发

#### 1.4.1 创建 RDP 相关 API 视图

```python
# resource/views/rdp.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from resource.models.rdp import RDPConfig
from audit.models.rdp import RDPAuditLog
from resource.serializers.rdp import RDPConfigSerializer, RDPConnectionSerializer
from django.shortcuts import get_object_or_404
import jwt
import time

class RDPConnectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, resource_id):
        # 权限检查
        # ...
        
        # 获取 RDP 配置
        rdp_config = get_object_or_404(RDPConfig, resource_id=resource_id)
        
        # 生成 JWT 令牌
        payload = {
            'resource_id': resource_id,
            'user_id': request.user.id,
            'exp': time.time() + 3600
        }
        token = jwt.encode(payload, 'secret_key', algorithm='HS256')
        
        # 构建 WebSocket 地址
        websocket_url = f"ws://guacamole-server:8080/guacamole/websocket/token/{token}"
        
        # 记录审计日志
        audit_log = RDPAuditLog(
            resource_id=resource_id,
            session_id=token,
            connect_time=time.time(),
            operation_type='connect',
        )
        audit_log.save()
        
        # 返回连接参数
        return Response({
            'token': token,
            'websocket_url': websocket_url,
            'rdp_config': RDPConfigSerializer(rdp_config).data
        })

class RDPAuditLogView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 记录审计日志
        # ...
        return Response({'status': 'success'})
```

#### 1.4.2 配置 URL 路由

```python
# resource/urls.py
from django.urls import path
from resource.views.rdp import RDPConnectionView, RDPAuditLogView

urlpatterns = [
    # 其他路由
    path('rdp/connection/<int:resource_id>/', RDPConnectionView.as_view(), name='rdp_connection'),
    path('rdp/audit/', RDPAuditLogView.as_view(), name='rdp_audit'),
]
```

### 1.5 服务部署

#### 1.5.1 部署 Guacamole Server

```bash
# 安装 Guacamole Server
sudo apt-get update
sudo apt-get install guacamole guacd

# 配置 guacd
sudo nano /etc/guacamole/guacd.conf

# 启动服务
sudo systemctl start guacd
sudo systemctl enable guacd
```

### 1.6 路由配置

#### 1.6.1 配置 Traefik 路由

```yaml
# traefik.yml
http:
  routers:
    guacamole:
      rule: "PathPrefix(`/guacamole/websocket`)"
      service: guacamole-service
      entryPoints:
        - web

  services:
    guacamole-service:
      loadBalancer:
        servers:
          - url: "http://guacamole-server:8080"
```

## 2. 前端实现

### 2.1 目录扩展

#### 2.1.1 创建 RDP 相关目录结构

```
src/
├── api/
│   └── rdpApi.ts      # RDP API 接口定义
├── components/
│   └── RDP/
│       ├── RdpTerminal.vue    # RDP 终端组件
│       └── RdpConfig.vue      # RDP 配置组件
├── struct/
│   └── rdp.ts         # RDP 类型定义
├── utils/
│   └── rdp.ts          # RDP 工具函数
└── views/
    └── RdpView.vue     # RDP 页面
```

### 2.2 类型定义

#### 2.2.1 创建 RDP 类型定义

```typescript
// src/struct/rdp.ts
export interface RDPConfig {
  rdp_port: number
  resolution: string
  color_depth: number
  enable_clipboard: boolean
}

export interface RDPConnectionParams {
  token: string
  websocket_url: string
  rdp_config: RDPConfig
}

export type RDPStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface RDPResource {
  id: number
  name: string
  ipv4_address: string
  rdp_config: RDPConfig
}

export interface RDPAuditLog {
  resource_id: number
  session_id: string
  connect_time: string
  disconnect_time?: string
  operation_type: string
  error_msg?: string
}
```

### 2.3 API 封装

#### 2.3.1 创建 RDP API 接口定义

```typescript
// src/api/rdpApi.ts
import requests from '@/requests'

export const rdpApi = {
  getRDPConnectionParams: (resourceId: number) => {
    return requests.post(`/resource/rdp/connection/${resourceId}/`, {})
  },
  updateRDPConfig: (resourceId: number, data: any) => {
    return requests.post(`/resource/rdp/config/${resourceId}/`, data)
  },
  recordRDPAuditLog: (data: any) => {
    return requests.post('/resource/rdp/audit/', data)
  }
}

export const getRDPConnectionParams = rdpApi.getRDPConnectionParams
export const updateRDPConfig = rdpApi.updateRDPConfig
export const recordRDPAuditLog = rdpApi.recordRDPAuditLog
```

### 2.4 工具函数

#### 2.4.1 创建 RDP 工具函数

```typescript
// src/utils/rdp.ts
import Guacamole from 'guacamole-common-js'

export interface GuacamoleOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

export const useGuacamole = (element: HTMLElement, websocketUrl: string, options: GuacamoleOptions = {}) => {
  let client: any = null
  let tunnel: any = null

  const connect = () => {
    // 创建 WebSocket 隧道
    tunnel = new Guacamole.WebSocketTunnel(websocketUrl)

    // 创建客户端
    client = new Guacamole.Client(tunnel)

    // 附加显示元素
    const display = document.createElement('div')
    display.style.width = '100%'
    display.style.height = '100%'
    element.appendChild(display)
    client.display.appendChild(display)

    // 处理连接事件
    client.onstatechange = (state: number) => {
      switch (state) {
        case Guacamole.Client.State.CONNECTING:
          console.log('正在连接...')
          break
        case Guacamole.Client.State.CONNECTED:
          console.log('连接成功')
          options.onConnect?.()
          break
        case Guacamole.Client.State.DISCONNECTED:
          console.log('连接断开')
          options.onDisconnect?.()
          break
        case Guacamole.Client.State.IDLE:
          console.log('连接空闲')
          break
      }
    }

    // 处理错误事件
    client.onerror = (error: any) => {
      console.error('连接错误:', error)
      options.onError?.(error.message || '连接错误')
    }

    // 处理键盘和鼠标事件
    client.onkey = (keysym: number, pressed: boolean) => {
      // 处理键盘事件
    }

    client.onmouse = (x: number, y: number, buttons: number) => {
      // 处理鼠标事件
    }

    // 连接
    client.connect()
  }

  const disconnect = () => {
    if (client) {
      client.disconnect()
      client = null
    }
    if (tunnel) {
      tunnel.close()
      tunnel = null
    }
  }

  // 初始连接
  connect()

  return {
    client,
    tunnel,
    connect,
    disconnect
  }
}
```

### 2.5 核心组件

#### 2.5.1 开发 RdpTerminal 组件

```vue
<template>
  <div class="rdp-terminal">
    <div v-if="status === 'disconnected'" class="terminal-placeholder">
      <el-button type="primary" @click="connect">连接</el-button>
    </div>
    <div v-else-if="status === 'connecting'" class="terminal-placeholder">
      <el-loading text="连接中..." />
    </div>
    <div v-else-if="status === 'error'" class="terminal-placeholder">
      <el-alert
        title="连接失败"
        type="error"
        :description="errorMessage"
        show-icon
      />
      <el-button type="primary" @click="connect">重新连接</el-button>
    </div>
    <div v-else class="terminal-container">
      <div ref="terminalRef" class="terminal"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRDPConnectionParams, recordRDPAuditLog } from '@/api/rdpApi'
import { useGuacamole } from '@/utils/rdp'

const props = defineProps<{
  resourceId: number
}>()

const status = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const errorMessage = ref('')
const terminalRef = ref<HTMLElement>()
let guacamoleInstance: any = null

const connect = async () => {
  status.value = 'connecting'
  try {
    const res = await getRDPConnectionParams(props.resourceId)
    if (res.data.code === 200) {
      const { token, websocket_url, rdp_config } = res.data.detail
      guacamoleInstance = useGuacamole(terminalRef.value!, websocket_url, {
        onConnect: () => {
          status.value = 'connected'
          ElMessage.success('连接成功')
        },
        onDisconnect: () => {
          status.value = 'disconnected'
          ElMessage.info('连接已断开')
        },
        onError: (error: string) => {
          status.value = 'error'
          errorMessage.value = error
          ElMessage.error(`连接失败: ${error}`)
        }
      })
    } else {
      status.value = 'error'
      errorMessage.value = res.data.msg || '连接失败'
      ElMessage.error(`连接失败: ${res.data.msg || '未知错误'}`)
    }
  } catch (error) {
    status.value = 'error'
    errorMessage.value = '网络错误'
    ElMessage.error('网络错误，请检查网络连接')
  }
}

const disconnect = () => {
  if (guacamoleInstance) {
    guacamoleInstance.disconnect()
  }
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})

onUnmounted(() => {
  // 组件卸载时的清理逻辑
  disconnect()
})
</script>

<style scoped>
.rdp-terminal {
  width: 100%;
  height: 100%;
  position: relative;
}

.terminal-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.terminal-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.terminal {
  width: 100%;
  height: 100%;
}
</style>
```

#### 2.5.2 开发 RdpConfig 组件

```vue
<template>
  <div class="rdp-config">
    <el-form :model="form" label-width="100px">
      <el-form-item label="RDP 端口">
        <el-input v-model.number="form.rdp_port" />
      </el-form-item>
      <el-form-item label="分辨率">
        <el-select v-model="form.resolution">
          <el-option label="800x600" value="800x600" />
          <el-option label="1024x768" value="1024x768" />
          <el-option label="1280x720" value="1280x720" />
          <el-option label="1920x1080" value="1920x1080" />
        </el-select>
      </el-form-item>
      <el-form-item label="颜色深度">
        <el-select v-model="form.color_depth">
          <el-option label="8位" value="8" />
          <el-option label="16位" value="16" />
          <el-option label="24位" value="24" />
          <el-option label="32位" value="32" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用剪贴板">
        <el-switch v-model="form.enable_clipboard" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="save">保存配置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { updateRDPConfig } from '@/api/rdpApi'
import type { RDPConfig } from '@/struct/rdp'

const props = defineProps<{
  resourceId: number
  config: RDPConfig
}>()

const form = ref<RDPConfig>({
  rdp_port: props.config.rdp_port,
  resolution: props.config.resolution,
  color_depth: props.config.color_depth,
  enable_clipboard: props.config.enable_clipboard
})

const save = async () => {
  try {
    const res = await updateRDPConfig(props.resourceId, form.value)
    if (res.data.code === 200) {
      ElMessage.success('配置保存成功')
    } else {
      ElMessage.error(`保存失败: ${res.data.msg || '未知错误'}`)
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查网络连接')
  }
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style scoped>
.rdp-config {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}
</style>
```

### 2.6 页面组件

#### 2.6.1 创建 RdpView 页面

```vue
<template>
  <div class="rdp-view">
    <div class="page-header">
      <h2 class="title">Windows 远程桌面</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refresh">
          <el-icon><Refresh /></el-icon>
          <span>刷新</span>
        </el-button>
        <el-button @click="openConfigDialog">
          <el-icon><Setting /></el-icon>
          <span>配置</span>
        </el-button>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="terminal-container">
        <RdpTerminal :resourceId="resourceId" />
      </div>
    </div>

    <!-- 配置对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      title="RDP 配置"
      width="500px"
      @close="closeConfigDialog"
    >
      <RdpConfig :resourceId="resourceId" :config="rdpConfig" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Setting } from '@element-plus/icons-vue'
import RdpTerminal from '@/components/RDP/RdpTerminal.vue'
import RdpConfig from '@/components/RDP/RdpConfig.vue'
import { getRDPConfig } from '@/api/rdpApi'
import type { RDPConfig as RDPConfigType } from '@/struct/rdp'

const route = useRoute()
const resourceId = Number(route.params.resourceId)

const configDialogVisible = ref(false)
const rdpConfig = ref<RDPConfigType>({
  rdp_port: 3389,
  resolution: '1024x768',
  color_depth: 16,
  enable_clipboard: true
})

const loadConfig = async () => {
  try {
    const res = await getRDPConfig(resourceId)
    if (res.data.code === 200) {
      rdpConfig.value = res.data.detail
    }
  } catch (error) {
    ElMessage.error('加载配置失败')
  }
}

const refresh = () => {
  loadConfig()
}

const openConfigDialog = () => {
  loadConfig()
  configDialogVisible.value = true
}

const closeConfigDialog = () => {
  configDialogVisible.value = false
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.rdp-view {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.content-wrapper {
  height: calc(100vh - 180px);
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  overflow: hidden;
}

.terminal-container {
  width: 100%;
  height: 100%;
}
</style>
```

### 2.7 路由配置

#### 2.7.1 添加 RDP 路由

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 其他路由
    {
      path: '/rdp/:resourceId',
      component: () => import('@/views/RdpView.vue'),
      meta: {
        requireAuth: true
      }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 登录状态检查
  const token = localStorage.getItem('token')
  if (to.meta.requireAuth && !token) {
    next('/login')
    return
  }
  next()
})

export default router
```

### 2.8 集成到资源管理

#### 2.8.1 修改 ResourceManage.vue，添加 RDP 连接按钮

```vue
<!-- 在资源节点的操作菜单中添加 RDP 连接按钮 -->
<el-dropdown v-if="data.type === 'resource'" trigger="click">
  <el-button size="small" text>
    <el-icon><MoreFilled /></el-icon>
  </el-button>
  <template #dropdown>
    <el-dropdown-menu>
      <el-dropdown-item @click="handleBindVoucher(data)">绑定凭证</el-dropdown-item>
      <el-dropdown-item @click="handleEditResource(data)">编辑</el-dropdown-item>
      <el-dropdown-item @click="handleRDPConnect(data)">RDP 连接</el-dropdown-item>
      <el-dropdown-item @click="handleDeleteResource(data)" divided style="color: #F56C6C">删除</el-dropdown-item>
    </el-dropdown-menu>
  </template>
</el-dropdown>

<script setup lang="ts">
// 添加 RDP 连接处理函数
const handleRDPConnect = (data: TreeDataNode) => {
  const resource = data.data as ResourceType
  router.push(`/rdp/${resource.id}`)
}
</script>
```

## 3. 测试与调试

### 3.1 测试 RDP 连接

1. 确保 Guacamole Server 正常运行
2. 确保 Traefik 配置正确
3. 确保后端 API 正常响应
4. 测试前端 RDP 连接功能

### 3.2 调试技巧

1. 检查浏览器控制台错误信息
2. 检查网络请求和响应
3. 检查 Guacamole Server 日志
4. 检查后端 API 日志
5. 检查 Traefik 日志

## 4. 常见问题与解决方案

### 4.1 连接失败

- **问题**：无法建立 RDP 连接
- **解决方案**：
  - 检查 Guacamole Server 是否正常运行
  - 检查网络连接是否正常
  - 检查 RDP 端口是否开放
  - 检查凭证是否正确

### 4.2 WebSocket 连接错误

- **问题**：WebSocket 连接失败
- **解决方案**：
  - 检查 Traefik WebSocket 配置
  - 检查 Guacamole Server WebSocket 支持
  - 检查网络防火墙设置

### 4.3 权限不足

- **问题**：无法访问 RDP 资源
- **解决方案**：
  - 检查用户权限
  - 检查 RBAC 配置
  - 检查资源权限设置

### 4.4 性能问题

- **问题**：RDP 连接卡顿
- **解决方案**：
  - 调整 RDP 分辨率和颜色深度
  - 检查网络带宽
  - 优化 Guacamole Server 配置

## 5. 总结

通过以上步骤，我们成功在现有运维堡垒机系统中集成了 Windows 远程桌面（RDP）功能。该功能基于 Apache Guacamole 实现，提供了 Web 化的远程桌面访问能力，与现有系统无缝集成，包括权限管理、审计日志等功能。

集成后，用户可以通过堡垒机系统直接访问 Windows 服务器的远程桌面，无需安装额外的 RDP 客户端软件，提高了运维效率和安全性。
