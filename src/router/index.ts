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
        { path: '/ssh-blacklist', name: 'ssh-blacklist', component: () => import('@/views/SSHBlacklistView.vue') },
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

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path === '/login') {
    next()
    return
  }
  
  if (!token) {
    next('/login')
    return
  }
  
  if (!routeStoreLoaded && to.path !== '/login') {
    try {
      const { useRouteStore } = await import('@/stores/route')
      const routeStore = useRouteStore()
      await routeStore.loadRoutes()
      routeStoreLoaded = true
      next({ ...to, replace: true })
    } catch (error) {
      console.error('加载路由失败:', error)
      next()
    }
  } else {
    next()
  }
})

export const resetRouteStoreLoaded = () => {
  routeStoreLoaded = false
}

export default router
