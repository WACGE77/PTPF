import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', component: () => import('../views/LoginView.vue') },
    {
      path: '/home',
      component: () => import('../views/HomeView.vue'),
      //以下现为静态,后续改为动态
      children: [
        //{path:'/profile',component:()=>import('../views/profile.vue')}
        { path: '/terminal', component: () => import('../views/terminal/IndexView.vue') },
      ],
    },
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
