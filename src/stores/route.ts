import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const useRouteStore = defineStore('route', () => {
  const routes = ref<Route[]>([])
  const isLoading = ref(false)
  const isRoutesLoaded = ref(false)
  const userPermissions = ref<string[]>([])  // 新增：存储用户权限列表

  const formattedRoutes = computed(() => {
    return routes.value
  })

  // 新增：获取所有可访问的路由路径（用于权限校验）
  const getAccessiblePaths = (): string[] => {
    const paths: string[] = []
    
    const extractPaths = (routeList: Route[]) => {
      routeList.forEach(route => {
        if (route.children && route.children.length > 0) {
          extractPaths(route.children)
        } else if (route.path) {
          paths.push(route.path)
        }
      })
    }
    
    extractPaths(routes.value)
    return paths
  }

  // 新增：检查用户是否有权访问指定路径
  const hasPermission = (path: string): boolean => {
    const accessiblePaths = getAccessiblePaths()
    console.log('权限检查 - 目标路径:', path)
    console.log('权限检查 - 可访问路径:', accessiblePaths)
    console.log('权限检查 - 结果:', accessiblePaths.includes(path))
    return accessiblePaths.includes(path)
  }

  const getRoutes = async () => {
    isLoading.value = true
    try {
      const { default: api } = await import('@/api')
      const res = await api.routeApi.getRoutes()
      if (res.data.code === 200) {
        routes.value = res.data.detail || []
        isRoutesLoaded.value = true
      }
    } catch (error) {
      const { default: requests } = await import('@/requests')
      requests.request_error(error)
    } finally {
      isLoading.value = false
    }
  }

  const loadRoutes = async () => {
    console.log('loadRoutes - 开始加载路由')
    if (isRoutesLoaded.value) {
      console.log('loadRoutes - 路由已加载，跳过')
      return
    }

    isLoading.value = true
    try {
      const { default: api } = await import('@/api')
      const { default: router } = await import('@/router')
      
      console.log('loadRoutes - 调用API获取路由')
      const res = await api.routeApi.getRoutes()
      console.log('loadRoutes - API响应:', res.data)
      
      if (res.data.code === 200) {
        const dynamicRoutes = res.data.detail || []
        console.log('loadRoutes - 动态路由数量:', dynamicRoutes.length)
        routes.value = dynamicRoutes
        
        dynamicRoutes.forEach(route => {
          if (route.path === '/terminal') {
            // /terminal路由保持独立，不添加为home的子路由
            return
          }
          
          if (!route.component && route.children && route.children.length > 0) {
            route.children.forEach(child => {
              let childComponentPath = child.component
              if (childComponentPath.startsWith('@/views/')) {
                childComponentPath = childComponentPath.replace('@/views/', '').replace('.vue', '')
              }
              
              const childRouterConfig = {
                path: child.path,
                component: () => import(`@/views/${childComponentPath}.vue`),
                meta: child.meta
              }
              
              router.addRoute('home', childRouterConfig)
            })
          } else if (route.component) {
            let componentPath = route.component
            if (componentPath.startsWith('@/views/')) {
              componentPath = componentPath.replace('@/views/', '').replace('.vue', '')
            }
            
            const routerConfig = {
              path: route.path,
              component: () => import(`@/views/${componentPath}.vue`),
              meta: route.meta,
              children: route.children?.map(child => {
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
            
            router.addRoute('home', routerConfig)
          }
        })
        
        isRoutesLoaded.value = true
        console.log('loadRoutes - 路由加载完成')
      }
    } catch (error) {
      console.error('loadRoutes - 加载失败:', error)
      const { default: requests } = await import('@/requests')
      requests.request_error(error)
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
    userPermissions,
    formattedRoutes,
    getAccessiblePaths,
    hasPermission,
    getRoutes,
    loadRoutes,
    resetRoutes
  }
})
