# 项目总体架构文档

## 1. 项目概述

运维堡垒机管理系统是一个基于Vue 3 + TypeScript + Element Plus开发的前端应用，用于集中管控服务器访问权限，保障运维操作安全合规，实现操作审计、权限管控、风险预警一体化管理。

## 2. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.x | 前端框架 |
| TypeScript | 5.x | 类型系统 |
| Element Plus | 2.x | UI组件库 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 1.x | 网络请求 |
| Vite | 7.x | 构建工具 |
| SCSS | 1.x | CSS预处理器 |

## 3. 项目结构

```
src/
├── api/             # API接口定义
├── components/       # 可复用组件
│   ├── common/       # 通用组件
│   ├── Audit/        # 审计日志相关组件
│   └── ResourceManage/ # 资源管理相关组件
├── requests/         # 网络请求配置
├── stores/           # Pinia状态管理
├── struct/           # TypeScript类型定义
├── utils/            # 工具函数
├── views/            # 页面组件
├── router/           # 路由配置
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 4. 核心组件

### 4.1 布局组件
- **HomeView.vue**: 主布局组件，包含侧边导航栏和主内容区域

### 4.2 页面组件
- **LoginView.vue**: 登录页面
- **IndexPage.vue**: 概览页面
- **TerminalView.vue**: Web终端页面
- **ResourceManage.vue**: 资源管理页面
- **UserManage.vue**: 用户管理页面
- **RoleManage.vue**: 角色管理页面
- **PermissionManage.vue**: 权限分配页面
- **AuditView.vue**: 审计日志页面

### 4.3 功能组件
- **RoleSelector.vue**: 角色选择器组件
- **PermissionSetting.vue**: 权限设置组件
- **LoginLogTab.vue**: 登录日志标签页组件
- **OperaLogTab.vue**: 操作日志标签页组件
- **SessionLogTab.vue**: 会话日志标签页组件

## 5. 数据流

### 5.1 状态管理
- **userProfile.ts**: 用户信息状态管理
- **resource.ts**: 资源管理状态管理
- **permission.ts**: 权限管理状态管理
- **audit.ts**: 审计日志状态管理
- **route.ts**: 动态路由状态管理

### 5.2 数据流向
1. 组件通过API调用获取数据
2. 数据存储到Pinia store中
3. 组件从store中获取数据并渲染
4. 用户操作触发状态更新
5. 状态更新触发组件重新渲染

## 6. 路由系统

### 6.1 路由配置
- **静态路由**: 登录页面、主页布局
- **动态路由**: 从后端API获取，基于用户权限生成

### 6.2 路由守卫
- 登录状态检查
- 动态路由加载
- 权限验证

## 7. API接口

### 7.1 认证相关
- `POST /rbac/login/`: 登录
- `POST /rbac/logout/`: 退出登录
- `POST /rbac/refresh/`: 刷新token

### 7.2 权限相关
- `GET /rbac/role/get/permission/`: 获取角色权限
- `POST /rbac/role/edit/permission/`: 设置角色权限
- `GET /rbac/perm/`: 获取权限列表

### 7.3 资源管理相关
- `GET /resource/group/get/`: 获取资源组
- `POST /resource/group/add/`: 添加资源组
- `POST /resource/group/edit/`: 编辑资源组
- `POST /resource/group/del/`: 删除资源组
- `GET /resource/resource/get/`: 获取资源
- `POST /resource/resource/add/`: 添加资源
- `POST /resource/resource/edit/`: 编辑资源
- `POST /resource/resource/del/`: 删除资源
- `GET /resource/voucher/get/`: 获取凭证
- `POST /resource/voucher/add/`: 添加凭证
- `POST /resource/voucher/edit/`: 编辑凭证
- `POST /resource/voucher/del/`: 删除凭证

### 7.4 审计日志相关
- `GET /audit/login/get/`: 获取登录日志
- `GET /audit/opera/get/`: 获取操作日志
- `GET /audit/session/get/`: 获取会话日志

### 7.5 动态路由相关
- `GET /rbac/routes/`: 获取动态路由

## 8. 如何添加新功能

### 8.1 添加新页面
1. 在`src/views/`目录下创建新的页面组件
2. 在`src/router/index.ts`中添加路由配置（如果是静态路由）
3. 在后端API中添加对应的动态路由配置（如果是动态路由）
4. 在导航菜单中添加对应的菜单项

### 8.2 添加新组件
1. 在`src/components/`目录下创建新的组件
2. 在需要使用的页面中导入并使用

### 8.3 添加新状态管理
1. 在`src/stores/`目录下创建新的store文件
2. 在组件中使用`useStore()`导入并使用

### 8.4 添加新API接口
1. 在`src/api/index.ts`中添加新的API接口定义
2. 在组件或store中调用新的API接口

### 8.5 添加新类型定义
1. 在`src/struct/`目录下添加新的类型定义
2. 在需要的地方导入并使用

## 9. 开发流程

1. 克隆代码库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`
4. 开发新功能
5. 运行构建：`npm run build`
6. 测试构建结果

## 10. 部署流程

1. 构建生产版本：`npm run build`
2. 将`dist`目录部署到服务器
3. 配置Nginx或其他Web服务器
4. 启动服务

## 11. 代码规范

- 使用TypeScript类型定义
- 组件化开发
- 响应式设计
- 代码注释
- 命名规范：
  - 组件名：PascalCase
  - 变量名：camelCase
  - 常量：UPPER_CASE
  - 文件命名：kebab-case

## 12. 注意事项

- 所有API调用都需要携带token
- 动态路由需要从后端获取
- 权限管理需要基于后端返回的权限数据
- 错误处理需要考虑多种错误格式
- 响应式设计需要适配不同设备

## 13. 故障排查

- 检查网络连接
- 检查API接口是否正常
- 检查token是否有效
- 检查权限是否正确
- 检查控制台错误信息
- 检查后端日志

## 14. 未来规划

- 优化性能
- 增加更多功能
- 改进用户体验
- 增强安全性
- 支持更多设备和浏览器
