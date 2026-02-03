import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    //{ path: '/login', component: () => import('@/components/SShTerminal/SSHTabs.vue') },
    /*{
      path: '/home',
      component: () => import('@/components/HomeView.vue'),
      redirect: '/overview',
      //以下现为静态,后续改为动态
      children: [
        //{path:'/profile',component:()=>import('@/views/profile.vue')}
        { path: '/overview', component: () => import('@/views/overview/IndexView.vue') },
        { path: '/terminal', component: () => import('@/views/terminal/IndexView.vue') },
        { path: '/role', component: () => import('@/views/roleManage/IndexView.vue') },
        { path: '/user', component: () => import('@/views/userManage/IndexView.vue') },
        { path: '/voucher', component: () => import('@/views/voucherManage/IndexView.vue') },
        { path: '/resource', component: () => import('@/views/resourceManage/IndexView.vue') },
        { path: '/audit', component: () => import('@/views/auditView/IndexView.vue') },
      ],
    },*/
  ],
})

router.beforeEach((to, from, next) => {
  const token: string | null = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }
  next()
})

export default router
