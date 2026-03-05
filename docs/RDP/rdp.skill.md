# RDP 功能集成 Skill

## 功能描述

在现有运维堡垒机系统中集成 Windows 远程桌面（RDP）功能，基于 Apache Guacamole 实现 RDP 协议解析与 Web 化远程桌面访问。

## 技术栈

- **前端**：Vue 3 + TypeScript + Element Plus
- **后端**：Python/Django
- **核心技术**：Apache Guacamole
- **网关**：Traefik

## 实现步骤

### 1. 后端实现

#### 1.1 模块扩展
- 在现有 `resource` 资源模块下新增 `rdp` 子模块，遵循原有目录结构规范

#### 1.2 数据模型
- 设计 RDP 配置模型，关联服务器资源、凭证表
- 包含字段：`rdp_port`、`resolution`、`color_depth`、`enable_clipboard`

#### 1.3 接口开发
- 封装 Guacamole API
- 开发 `/resource/rdp/connection/` 接口
- 返回 JWT 令牌、WebSocket 地址、RDP 配置
- 加入 RBAC 权限校验

#### 1.4 审计扩展
- 新增 RDP 审计日志模型
- 记录 `resource_id`、`session_id`、`connect_time`、`disconnect_time`、`operation_type`、`error_msg`
- 连接/断开/异常时自动落库

#### 1.5 服务部署
- 部署 Guacamole Server
- 配置 guacd 服务
- 保证与后端网络互通，处理 RDP 协议代理

#### 1.6 路由配置
- 新增 RDP 路由挂载至 `/resource/rdp` 路径
- 适配 Traefik 路由匹配规则

### 2. 前端实现

#### 2.1 目录扩展
- 在 `api`、`components`、`struct`、`utils`、`views` 目录新增 RDP 相关文件，遵循原有命名规范

#### 2.2 核心组件
- 基于 guacamole-common-js 开发 `RdpTerminal` 组件
- 实现 WebSocket 连接、RDP 桌面渲染、键鼠交互

#### 2.3 状态管理
- 封装 RDP 连接状态（disconnected/connecting/connected/error）
- 展示异常提示

#### 2.4 配置组件
- 开发 `RdpConfig` 组件，支持 RDP 参数展示与修改
- 同步至后端配置

#### 2.5 类型定义
- 新增 RDP 相关 TS 类型：
  - `RDPResource`
  - `RDPConnectionParams`
  - `RDPStatus`

#### 2.6 API 封装
- 开发 `getRDPConnectionParams`、`recordRDPAuditLog` 接口
- 携带原有认证 token

#### 2.7 路由配置
- 新增 `/rdp/:resourceId` 路由
- 加入登录/权限守卫
- 适配 Traefik 路径转发

#### 2.8 工具函数
- 封装 Guacamole 初始化、断开、窗口自适应、断网重连逻辑

### 3. Traefik 网关配置

#### 3.1 路由规则
- 配置 `/guacamole/websocket` 路径转发至 Guacamole 服务
- 启用 WebSocket 支持

#### 3.2 API 转发
- 配置 `/resource/rdp` 路径转发至堡垒机后端服务

#### 3.3 适配要求
- 沿用现有认证中间件
- 保证请求路由无异常
- 与现有网关配置兼容

### 4. 集成联调

#### 4.1 权限联动
- 实现“用户-角色-权限-RDP 资源”的权限管控
- 未授权用户无法访问

#### 4.2 日志统一
- RDP 审计日志在原有审计页面展示
- 与现有日志体系统一

#### 4.3 异常处理
- 覆盖权限不足、资源不可达、断网、令牌过期等场景
- 给出友好提示

#### 4.4 兼容性
- 支持 Chrome/Firefox/Edge 浏览器
- 适配不同屏幕尺寸

## 注意事项

1. 确保 Guacamole Server 与后端服务网络互通
2. 确保 Traefik 正确配置 WebSocket 转发
3. 确保 RDP 相关 API 加入 RBAC 权限校验
4. 确保 RDP 审计日志与现有日志系统集成
5. 确保异常处理覆盖所有可能的场景
6. 确保前端组件适配不同屏幕尺寸

## 测试要点

1. RDP 连接建立与断开
2. 键鼠交互
3. 剪贴板功能
4. 权限控制
5. 审计日志记录
6. 异常场景处理
7. 浏览器兼容性
8. 屏幕尺寸适配
