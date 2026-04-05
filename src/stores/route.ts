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

  const formattedRoutes = computed(() => {
    return routes.value
  })

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
    if (isRoutesLoaded.value) {
      return
    }

    isLoading.value = true
    try {
      const { default: api } = await import('@/api')
      const { default: router } = await import('@/router')
      
      const res = await api.routeApi.getRoutes()
      
      if (res.data.code === 200) {
        const dynamicRoutes = res.data.detail || []
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
      }
    } catch (error) {
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
    formattedRoutes,
    getRoutes,
    loadRoutes,
    resetRoutes
  }
})
