import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      redirect: '/overview',
      children: [
        { path: '/overview', name: 'overview', component: () => import('@/views/IndexPage.vue') },
        { path: '/resource', name: 'resource', component: () => import('@/views/ResourceManage.vue') },
        { path: '/user', name: 'user', component: () => import('@/views/UserManage.vue') },
        { path: '/role', name: 'role', component: () => import('@/views/RoleManage.vue') },
        { path: '/permission', name: 'permission', component: () => import('@/views/PermissionManage.vue') },
        { path: '/audit', name: 'audit', component: () => import('@/views/AuditView.vue') },
        { path: '/danger-cmd-alert', name: 'danger-cmd-alert', component: () => import('@/views/DangerCmdAlertView.vue') },
        { path: '/danger-cmd-log', name: 'danger-cmd-log', component: () => import('@/views/DangerCmdLogView.vue') },
        { path: '/alert', name: 'alert', component: () => import('@/views/AlertView.vue') },
      ],
    },
    {
      path: '/terminal',
      name: 'terminal',
      component: () => import('@/views/TerminalView.vue'),
    },
  ],
})

let routeStoreLoaded = false

// 定义不需要权限校验的路径白名单
const PUBLIC_PATHS = ['/login', '/overview', '/terminal']

router.beforeEach(async (to, from, next) => {
  console.log('=== 路由守卫开始 ===')
  console.log('目标路径:', to.path)
  console.log('来源路径:', from.path)

  const token = localStorage.getItem('token')

  // 1. 登录页面直接放行
  if (to.path === '/login') {
    console.log('✓ 访问登录页，放行')
    next()
    return
  }

  // 2. 无token时跳转到登录页
  if (!token) {
    console.log('✗ 无Token，跳转到登录页')
    next('/login')
    return
  }

  // 3. 首次访问或需要重新加载路由时
  if (!routeStoreLoaded) {
    console.log('开始加载动态路由和权限信息...')
    try {
      const { useRouteStore } = await import('@/stores/route')
      const routeStore = useRouteStore()

      await routeStore.loadRoutes()
      routeStoreLoaded = true

      console.log('动态路由加载完成')

      // 权限校验（修复VULN-001和VULN-002）
      if (!PUBLIC_PATHS.includes(to.path)) {
        console.log('执行权限检查...')
        const hasAccess = routeStore.hasPermission(to.path)

        if (!hasAccess) {
          console.warn('✗ 权限不足！目标路径:', to.path)
          console.warn('→ 重定向到概览页 /overview')
          // 统一重定向到概览页（修复VULN-002）
          next({ path: '/overview', replace: true })
          return
        }
        console.log('✓ 权限验证通过')
      }

      console.log('✓ 导航到目标页面')
      next({ ...to, replace: true })
    } catch (error) {
      console.error('加载路由失败:', error)
      console.log('→ 跳转到登录页')
      next('/login')
    }
  } else {
    // 4. 路由已加载，但仍需检查权限（防止直接输入URL越权访问）
    console.log('路由已加载，检查权限...')

    if (!PUBLIC_PATHS.includes(to.path)) {
      try {
        const { useRouteStore } = await import('@/stores/route')
        const routeStore = useRouteStore()
        const hasAccess = routeStore.hasPermission(to.path)

        if (!hasAccess) {
          console.warn('✗ 越权访问被阻止！目标路径:', to.path)
          console.warn('→ 重定向到概览页 /overview')
          // 统一重定向到概览页（修复VULN-002）
          next({ path: '/overview', replace: true })
          return
        }
        console.log('✓ 权限验证通过')
      } catch (error) {
        console.error('权限检查失败:', error)
      }
    }

    console.log('✓ 允许导航')
    next()
  }

  console.log('=== 路由守卫结束 ===')
})

export const resetRouteStoreLoaded = () => {
  routeStoreLoaded = false
}

export default router
