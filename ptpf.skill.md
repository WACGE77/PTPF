# PTPF Skill

## 项目简介

这是一个 Vue 3 + TypeScript 运维堡垒机管理系统，使用 Element Plus 作为 UI 组件库，Pinia 进行状态管理，xterm.js 实现 Web SSH 终端功能。

## 常用开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run type-check   # TypeScript 类型检查
npm run lint         # 代码规范检查 (ESLint + OXLint)
npm run format       # 代码格式化 (Prettier)
npm run test:unit    # 运行单元测试
```

## 项目结构规范

- **视图组件**: `src/views/` - 页面级组件
- **公共组件**: `src/components/` - 可复用组件
- **API 接口**: `src/api/index.ts` - 统一管理 API 接口
- **HTTP 请求**: `src/requests/index.ts` - 封装 axios，包含 token 刷新机制
- **状态管理**: `src/stores/` - Pinia store
- **类型定义**: `src/struct/` - TypeScript 接口定义
- **工具函数**: `src/utils/` - 工具函数

## 代码规范

1. **组件命名**: 使用 PascalCase (如 `UserManage.vue`)
2. **图标使用**: 通过 `getIconComponent` 从 `@/utils/iconMap.ts` 获取图标组件
3. **API 错误处理**: 使用 `request_error` 函数处理请求错误
4. **API 响应格式**: `{ code: 200, detail: ..., total: ... }`
5. **无注释**: 不要添加任何注释（除非用户明确要求）
6. **样式**: 使用 SCSS，变量定义在组件顶部

## 组件使用规范

### Element Plus 组件
- 使用 el-form 进行表单验证
- 使用 el-table 进行数据展示
- 使用 el-dialog 进行弹窗
- 使用 el-message/ElMessage 进行提示

### Pinia Store
- 用户信息存储在 `userProfile` store
- 资源/凭证/资源组存储在 `resourceStore` store
- 使用 `defineStore` 定义 store

### 路由
- 路由配置在 `src/router/index.ts`
- 路由守卫检查 token 是否存在

## API 接口规范

接口定义在 `src/api/index.ts`，主要模块：
- `userApi` - 用户管理
- `roleApi` - 角色管理
- `resourceApi` - 资源管理
- `voucherApi` - 凭证管理
- `authApi` - 认证
- `auditApi` - 审计日志

## TypeScript 类型

主要类型定义在 `src/struct/` 目录：
- `User` - 用户类型
- `Role` - 角色类型
- `Resource` - 资源类型
- `SessionRecord` - 会话记录
- `LoginRecord` - 登录记录

## 常用代码片段

### 导入 API
```typescript
import api from '@/api'
```

### 处理请求错误
```typescript
import { request_error } from '@/requests'
// 在 catch 中使用
catch (err) {
  request_error(err)
}
```

### 获取用户信息
```typescript
import { userProfile } from '@/stores/userProfile'
const userPro = userProfile()
userPro.getuser()
```

### 使用资源 store
```typescript
import { resourceStore } from '@/stores/resource'
const store = resourceStore()

// 加载所有数据
store.loadAll()

// 按需刷新
store.getGroups(true)      // 刷新资源组
store.getResources(true)   // 刷新资源
store.getVouchers(true)    // 刷新凭证

// 获取组下的资源/凭证
store.getResourcesByGroup(groupId)
store.getVouchersByGroup(groupId)

// CRUD 操作
store.addGroup(data)
store.updateGroup(data)
store.deleteGroup([id])
store.addResource(data)
store.updateResource(data)
store.deleteResource([id])
store.addVoucher(data)
store.updateVoucher(data)
store.deleteVoucher([id])
```

### 使用图标
```typescript
import { getIconComponent } from '@/utils/iconMap'
<component :is="getIconComponent('User')" />
```

### SSH 终端连接
```typescript
import Shell from '@/utils/terminal'
const shell = new Shell()
shell.mount(containerElement)
shell.connect(resourceId, voucherId, token)
```
