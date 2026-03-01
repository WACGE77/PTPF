<template>
  <div class="bastion-layout">
    <!-- 页面加载动画 -->
    <div v-if="isLoading" class="page-loading">
      <el-loading :fullscreen="true" text="加载中..." />
    </div>
    <!-- 整体布局容器 -->
    <el-container style="height: 100vh">
      <!-- 侧边导航栏 -->
      <el-aside :width="isCollapse ? '0px' : '200px'" class="bastion-aside" :class="{ 'is-collapse': isCollapse }">
        <!-- 系统logo/名称 -->
        <div class="bastion-logo">
          <span>堡垒机管理系统</span>
        </div>

        <!-- 动态渲染的导航菜单 -->
        <el-menu
          v-if="!isLoading && dynamicMenuList.length > 0"
          :default-active="activeMenu"
          class="bastion-menu"
          background-color="#2e3b4e"
          text-color="#fff"
          active-text-color="#ffd04b"
          collapse-transition
          @select="router_push"
        >
          <!-- 循环渲染动态路由数据 -->
          <template v-for="menu in dynamicMenuList" :key="menu.index">
            <!-- 有子菜单的一级菜单 -->
            <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.index">
              <template #title>
                <el-icon>
                  <!-- 完全动态加载图标 -->
                  <component :is="getIconComponent(menu.icon)" />
                </el-icon>
                <span>{{ menu.label }}</span>
              </template>
              <!-- 渲染二级子菜单 -->
              <el-menu-item
                v-for="subMenu in menu.children"
                :key="subMenu.index"
                :index="subMenu.index"
              >
                <el-icon>
                  <component :is="getIconComponent(subMenu.icon)" />
                </el-icon>
                <span>{{ subMenu.label }}</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 无子女单 -->
            <el-menu-item v-else :index="menu.index">
              <el-icon>
                <component :is="getIconComponent(menu.icon)" />
              </el-icon>
              <span>{{ menu.label }}</span>
            </el-menu-item>
          </template>
        </el-menu>
        
        <!-- 路由加载失败提示 -->
        <div v-else-if="!isLoading && dynamicMenuList.length === 0" class="menu-error">
          <el-empty description="无法加载导航菜单" />
          <el-button type="primary" @click="reloadRoutes" style="margin-top: 20px">
            重新加载
          </el-button>
        </div>
      </el-aside>
      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon>
          <component :is="isCollapse ? 'ArrowRight' : 'ArrowLeft'" />
        </el-icon>
      </div>

      <!-- 右侧主内容区域 -->
      <el-container>
        <!-- 顶部导航栏（用户信息+设置） -->
        <el-header class="bastion-header">
          <!-- 右侧用户信息下拉栏 -->
          <div class="header-right">
            <el-dropdown trigger="click" @command="handleUserCommand">
              <div class="user-info">
                <!-- 头像图标也改为动态（可选） -->
                <el-avatar :icon="getIconComponent('User')" class="user-avatar"></el-avatar>
                <span class="user-name">{{ userPro.user.name }}</span>
                <el-icon class="dropdown-icon">
                  <component :is="getIconComponent('ArrowDown')" />
                </el-icon>
              </div>

              <!-- 用户下拉菜单 -->
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon>
                      <component :is="getIconComponent('User')" />
                    </el-icon>
                    <span>个人信息</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon>
                      <!-- 退出登录图标也动态加载 -->
                      <component :is="getIconComponent('SwitchButton')" />
                    </el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主内容展示区 -->
        <el-main class="bastion-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
// 导入自定义图标映射
import { getIconComponent, type IconName } from '@/utils/iconMap'
import router from '@/router'
import { userProfile } from '@/stores/userProfile.ts'
import { useRouteStore } from '@/stores/route'
import api from '@/api'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
const userPro = userProfile()
const routeStore = useRouteStore()
userPro.getuser()
// 手动定义 DropdownCommand 类型（解决导入错误）
type DropdownCommand = string | number | object

// 侧边栏折叠状态
const isCollapse = ref(false)
// 页面加载状态
const isLoading = ref(true)

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 定义菜单数据类型（图标完全关联IconName）
interface MenuItem {
  index: string
  label: string
  icon: IconName // 严格限制为iconMap中的图标名
  children?: MenuItem[]
}

// 默认激活的菜单
const activeMenu = ref('/overview')

// 从routeStore获取动态菜单数据
const dynamicMenuList = computed(() => {
  // 转换路由数据为菜单格式
  return routeStore.routes.map(route => {
    // 处理有子菜单的父路由
    if (!route.component && route.children && route.children.length > 0) {
      return {
        index: route.path,
        label: route.meta.title,
        icon: route.meta.icon as IconName,
        children: route.children.map(child => ({
          index: child.path,
          label: child.meta.title,
          icon: child.meta.icon as IconName
        }))
      }
    } else if (route.component) {
      // 处理普通路由
      return {
        index: route.path,
        label: route.meta.title,
        icon: route.meta.icon as IconName,
        children: route.children?.map(child => ({
          index: child.path,
          label: child.meta.title,
          icon: child.meta.icon as IconName
        }))
      }
    }
    return null
  }).filter(Boolean) as MenuItem[]
})

// 监听路由变化，更新激活的菜单
watch(() => router.currentRoute.value.path, (newPath) => {
  // 检查是否有子菜单包含当前路径
  let found = false
  dynamicMenuList.value.forEach(menu => {
    if (menu.children) {
      menu.children.forEach(subMenu => {
        if (subMenu.index === newPath) {
          activeMenu.value = subMenu.index
          found = true
        }
      })
    }
  })
  // 如果没有找到子菜单，则直接使用当前路径
  if (!found) {
    activeMenu.value = newPath
  }
})

// 页面加载时初始化激活的菜单
onMounted(async () => {
  console.log('HomeView mounted')
  console.log('Current token:', localStorage.getItem('token'))
  
  // 加载动态路由
  try {
    console.log('开始加载动态路由...')
    await routeStore.loadRoutes()
    console.log('Dynamic routes loaded successfully')
    console.log('Routes data:', routeStore.routes)
    console.log('Dynamic menu list:', dynamicMenuList.value)
  } catch (error) {
    console.error('Failed to load dynamic routes:', error)
  }
  
  const currentPath = router.currentRoute.value.path
  console.log('Current path:', currentPath)
  
  // 检查是否有子菜单包含当前路径
  let found = false
  dynamicMenuList.value.forEach(menu => {
    if (menu.children) {
      menu.children.forEach(subMenu => {
        if (subMenu.index === currentPath) {
          activeMenu.value = subMenu.index
          found = true
        }
      })
    }
  })
  // 如果没有找到子菜单，则直接使用当前路径
  if (!found) {
    activeMenu.value = currentPath
  }
  console.log('Active menu:', activeMenu.value)
  
  // 页面加载完成，隐藏加载动画
  setTimeout(() => {
    isLoading.value = false
    console.log('Loading finished')
  }, 500)
})

const router_push = (index: string) => {
  console.log('Menu clicked:', index)
  router.push(index).then(() => {
    console.log('Navigation successful to:', index)
  }).catch((error) => {
    console.error('Navigation error:', error)
  })
}

// 处理用户下拉菜单命令
const handleUserCommand = async (command: DropdownCommand) => {
  switch (command) {
    case 'profile':
      console.log('点击了个人信息')
      break
    case 'setting':
      console.log('点击了系统设置')
      break
    case 'logout':
      console.log('点击了退出登录')
      try {
        // 调用退出登录API
        await api.authApi.logout()
        // 清除localStorage中的token
        localStorage.removeItem('token')
        // 重置路由状态
        routeStore.resetRoutes()
        // 跳转到登录页面
        router.push('/login')
      } catch (error) {
        console.error('退出登录失败:', error)
      }
      break
  }
}

// 重新加载路由
const reloadRoutes = async () => {
  isLoading.value = true
  try {
    await routeStore.resetRoutes()
    await routeStore.loadRoutes()
    console.log('Routes reloaded successfully')
  } catch (error) {
    console.error('Failed to reload routes:', error)
  } finally {
    isLoading.value = false
  }
}

</script>

<style scoped>
/* 整体布局 */
.bastion-layout {
  width: 100%;
  height: 100vh;
}

/* 侧边栏样式 */
.bastion-aside {
  background-color: #2e3b4e;
  overflow: hidden;
}

/* 折叠按钮 */
.collapse-btn {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 24px;
  height: 60px;
  background-color: #404956;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background-color: #4a5568;
}

/* 侧边栏样式 */
.bastion-aside {
  background-color: #2e3b4e;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

/* 折叠状态下的样式 */
.bastion-aside.is-collapse {
  width: 0 !important;
  overflow: hidden;
}

/* logo区域 */
.bastion-logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 16px;
  color: #fff;
  border-bottom: 1px solid #404956;
}

/* 导航菜单 - 去掉滚动条 */
.bastion-menu {
  border-right: none;
  height: calc(100vh - 60px);
  overflow: hidden;
  display: block;
}

/* 顶部导航栏 */
.bastion-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 用户信息区域 */
.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.user-name {
  font-size: 14px;
  color: #333;
  margin-right: 4px;
}

.dropdown-icon {
  font-size: 12px;
  color: #999;
}

/* 主内容区域 */
.bastion-main {
  background-color: #f5f5f5;
  padding: 20px;
  overflow: auto;
  height: calc(100vh - 60px);
}

/* 隐藏element-plus菜单滚动条 */
:deep(.el-menu) {
  overflow: hidden !important;
}
</style>
