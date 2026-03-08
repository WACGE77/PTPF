import { createRouter, createWebHistory } from 'vue-router'
import { useRouteStore } from '@/stores/route'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      redirect: '/overview',
      children: [
        // 基础静态路由
        { path: '/overview', component: () => import('@/views/IndexPage.vue') },
      ],
    },
  ],
})

// 路由守卫，实现动态路由加载
router.beforeEach((to, from, next) => {
  // 从localStorage获取token
  const token: string | null = localStorage.getItem('token')
  
  // 如果没有token且不是登录页，重定向到登录页面
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }
  
  // 如果已经有token且不是登录页，尝试加载动态路由
  if (token && to.path !== '/login') {
    const routeStore = useRouteStore()
    if (!routeStore.isRoutesLoaded) {
      routeStore.loadRoutes().then(() => {
        // 动态路由加载完成后，重新导航到目标路径
        next({ ...to, replace: true })
      }).catch(() => {
        // 加载失败，继续导航
        next()
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
