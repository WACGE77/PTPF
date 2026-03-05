import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import requests from '@/requests'
import router from '@/router'

// 路由类型定义
export interface Route {
  path: string
  component: string
  meta: {
    title: string
    icon: string
    permission: string
  }
  children?: Route[]
}

const request_error = requests.request_error

export const useRouteStore = defineStore('route', () => {
  // 状态
  const routes = ref<Route[]>([])
  const isLoading = ref(false)
  const isRoutesLoaded = ref(false)

  // 计算属性
  const formattedRoutes = computed(() => {
    return routes.value
  })

  // 方法
  const getRoutes = async () => {
    isLoading.value = true
    try {
      const res = await api.routeApi.getRoutes()
      if (res.data.code === 200) {
        routes.value = res.data.detail || []
        isRoutesLoaded.value = true
      } else {
        console.error('获取路由失败:', res.data.detail)
      }
    } catch (error) {
      request_error(error)
    } finally {
      isLoading.value = false
    }
  }

  // 加载动态路由
  const loadRoutes = async () => {
    if (isRoutesLoaded.value) {
      return
    }

    isLoading.value = true
    try {
      console.log('开始加载动态路由...')
      const res = await api.routeApi.getRoutes()
      console.log('API响应:', res)
      
      if (res.data.code === 200) {
        const dynamicRoutes = res.data.detail || []
        console.log('获取到的路由数据:', dynamicRoutes)
        routes.value = dynamicRoutes
        
        // 将动态路由添加到路由配置中
        dynamicRoutes.forEach(route => {
          // 处理有子菜单的父路由
          if (!route.component && route.children && route.children.length > 0) {
            console.log('处理有子菜单的父路由:', route.path)
            // 只添加子路由，跳过父路由
            route.children.forEach(child => {
              // 处理子路由的组件路径
              let childComponentPath = child.component
              if (childComponentPath.startsWith('@/views/')) {
                childComponentPath = childComponentPath.replace('@/views/', '').replace('.vue', '')
              }
              
              const childRouterConfig = {
                path: child.path,
                component: () => import(`@/views/${childComponentPath}.vue`),
                meta: child.meta
              }
              
              console.log('添加子路由:', childRouterConfig)
              router.addRoute('home', childRouterConfig)
            })
          } else if (route.component) {
            // 处理普通路由
            // 处理组件路径，移除@/views/前缀和.vue后缀
            let componentPath = route.component
            if (componentPath.startsWith('@/views/')) {
              componentPath = componentPath.replace('@/views/', '').replace('.vue', '')
            }
            
            // 转换为Vue Router格式
            const routerConfig = {
              path: route.path,
              component: () => import(`@/views/${componentPath}.vue`),
              meta: route.meta,
              children: route.children?.map(child => {
                // 处理子路由的组件路径
                let childComponentPath = child.component
                if (childComponentPath.startsWith('@/views/')) {
                  childComponentPath = childComponentPath.replace('@/views/', '').replace('.vue', '')
                }
                return {
                  path: child.path,
                  component: () => import(`@/views/${childComponentPath}.vue`),
                  meta: child.meta
                }
              })
            }
            
            // 使用addRoute方法添加到home路由的children中
            console.log('添加路由:', routerConfig)
            router.addRoute('home', routerConfig)
          }
        })
        
        isRoutesLoaded.value = true
        console.log('动态路由加载完成')
      } else {
        console.error('获取路由失败:', res.data.detail)
      }
    } catch (error) {
      console.error('加载路由时发生错误:', error)
      request_error(error)
    } finally {
      isLoading.value = false
    }
  }

  const resetRoutes = () => {
    routes.value = []
    isRoutesLoaded.value = false
  }

  return {
    routes,
    isLoading,
    isRoutesLoaded,
    formattedRoutes,
    getRoutes,
    loadRoutes,
    resetRoutes
  }
})