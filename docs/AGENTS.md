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
├── api/                   # API 接口定义
├── components/
│   ├── common/            # 通用组件
│   │   └── ConfirmCancelButton.vue
│   ├── ResourceManage/    # 资源管理相关组件
│   │   ├── BindVoucher.vue
│   │   ├── GroupForm.vue
│   │   ├── ResourceDetail.vue
│   │   ├── ResourceForm.vue
│   │   └── VoucherForm.vue
│   ├── SShTerminal/       # SSH 终端组件
│   │   ├── BlankPage.vue
│   │   └── SSHTabs.vue
│   └── UserManage/        # 用户管理相关组件
│       ├── ResetPassword.vue
│       ├── RoleAssign.vue
│       └── UserForm.vue
├── requests/              # HTTP 请求封装
│   └── index.ts           # 包含 token 刷新机制
├── router/                # 路由配置
├── stores/                # Pinia 状态管理
│   ├── counter.ts
│   ├── resource.ts         # 资源/凭证/资源组管理
│   └── userProfile.ts
├── struct/                 # TypeScript 类型定义
│   ├── audit.ts
│   ├── rbac.ts
│   ├── resource.ts
│   └── terminal.ts
├── utils/                  # 工具函数
│   ├── iconMap.ts
│   ├── terminal.ts
│   └── time.ts
├── views/                  # 页面组件
│   ├── HomeView.vue
│   ├── IndexPage.vue
│   ├── LoginView.vue
│   ├── ResourceManage.vue
│   ├── RoleManage.vue
│   └── UserManage.vue
├── __tests__/              # 单元测试
│   └── App.spec.ts
├── App.vue
└── main.ts
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
- 资源组和凭证使用同一个组（资源组包含资源和凭证）

## 表单验证规则

所有表单已配置 blur 验证，验证通过后才能提交：

### GroupForm.vue (资源组表单)
- name: 必填
- role (系统组拥有者): 仅顶级组必填

### ResourceForm.vue (资源表单)
- group: 必选
- name: 必填
- ipv4/ipv6: 至少填写一个，支持格式验证
- port: 1-65535

### VoucherForm.vue (凭证表单)
- group: 必选
- name: 必填
- username: 必填
- password/private_key: 至少填写一个

### UserForm.vue (用户表单)
- account: 必填，3-20字符
- password: 6-20字符，需包含字母和数字
- email: 邮箱格式
- phoneNumber: 手机号格式

### ResetPassword.vue (重置密码)
- newPassword: 6-20字符，需包含字母和数字
- confirmPassword: 需与新密码一致
