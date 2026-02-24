# PTPF - 运维堡垒机管理系统

## 项目概述

这是一个**运维堡垒机管理系统**，用于集中管控服务器访问权限，保障运维操作安全合规，实现操作审计、权限管控、风险预警一体化管理。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **终端模拟器**: xterm.js + xterm-addon-fit
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **测试**: Vitest
- **代码规范**: ESLint + OXLint + Prettier

## 项目结构

```
src/
├── api/              # API 接口定义
├── components/       # 公共组件
│   ├── UserManage/  # 用户管理相关组件
│   │   ├── UserForm.vue
│   │   ├── RoleAssign.vue
│   │   └── ResetPassword.vue
│   ├── SShTerminal/ # SSH 终端组件
│   │   ├── SSHTabs.vue
│   │   └── BlankPage.vue
│   └── common/       # 通用组件
├── requests/         # HTTP 请求封装
│   └── index.ts     # 包含 token 刷新机制
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
│   └── userProfile.ts
├── struct/           # TypeScript 类型定义
│   ├── rbac.ts      # 用户、角色类型
│   ├── terminal.ts  # 终端类型
│   ├── audit.ts     # 审计类型
├── utils/           # 工具函数
│   ├── iconMap.ts   # 图标映射
│   ├── terminal.ts  # SSH 终端类
│   └── time.ts      # 时间格式化
└── views/           # 页面组件
    ├── LoginView.vue
    ├── HomeView.vue
    ├── IndexPage.vue
    └── UserManage.vue
```

## 常用命令

```bash
npm run dev          # 开发模式启动
npm run build        # 构建生产版本
npm run type-check   # 类型检查
npm run lint         # 代码规范检查
npm run format       # 代码格式化
npm run test:unit    # 运行单元测试
```

## API 基础配置

- **Base URL**: `https://www.wacgee.icu/api`
- **WebSocket URL**: `wss://www.wacgee.icu/api`
- **认证**: Token 存储在 localStorage，key 为 `token`

## 主要功能模块

1. **用户管理** - 用户CRUD、角色分配、密码重置
2. **角色管理** - 角色CRUD、权限分配
3. **资源管理** - 资源组、资源、凭证管理
4. **Web终端** - SSH 会话管理（使用 xterm.js）
5. **审计中心** - 登录日志、操作日志、会话日志

## 注意事项

- 使用 `request_error` 函数处理请求错误
- API 响应格式: `{ code: 200, detail: ..., total: ... }`
- 用户信息存储在 Pinia store (`userProfile`)
- 图标使用 `getIconComponent` 动态加载
