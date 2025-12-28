<template>
  <div class="layout">
    <!-- 左侧导航栏 -->
    <el-menu
      :default-active="$route.path"
      class="el-menu-vertical-demo"
      @open="handleOpen"
      @close="handleClose"
      @select="handelSelect"
      background-color="#2f4050"
      text-color="#fff"
      active-text-color="#409eff"
      style="height: 100vh; width: 200px; overflow-y: auto; padding: 0; margin: 0"
    >
      <div class="menu-logo">
        <!-- <img src="/logo.png" alt="Logo" class="logo-img" /> -->
        <span class="project-name">CC的堡垒机</span>
      </div>
      <el-menu-item v-for="item in items" :key="item.id" :index="item['path']">
        <el-icon><component :is="getIconComponent(item.icon)" /></el-icon>
        <span>{{ item.name }}</span>
      </el-menu-item>
    </el-menu>

    <!-- 右侧内容区 -->
    <div class="content-wrapper">
      <!-- 头部导航 -->
      <div class="header">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="el-dropdown-link">
            <el-avatar size="small" src="https://via.placeholder.com/32" />
            test
            <el-icon class="el-icon--right"
              ><component :is="getIconComponent('ArrowDown')"
            /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <router-view />
      </div>

      <!-- 底部 -->
      <div class="footer">
        <div class="copyright">Copyright - FIT2CLOUD 飞致云 © 2014-2025</div>
        <div class="version">Version v2.28.8 GPL</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import router from '@/router'
import { getIconComponent } from '@/utils/iconMap'
interface MenuItemObject {
  id: number
  name: string
  path: string
  component: string
  icon: string
  children?: MenuItemObject[]
}
//测试数据
const items: MenuItemObject[] = [
  {
    id: 1,
    name: 'Web终端',
    path: '/terminal',
    component: '../components/terminal/IndexView.vue',
    icon: 'FullScreen',
  },
]

const handleOpen = () => {}
const handleClose = () => {}
const handelSelect = (index: string) => {
  router.push(index)
}
const handleCommand = () => {}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  align-items: stretch;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  height: 60px;
  padding: 0 20px;
  background-color: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.footer {
  height: 36px;
  padding: 0 20px;
  background-color: #ffffff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.copyright {
  margin-right: auto;
}

.version {
  margin-left: auto;
}
.menu-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  border-bottom: 1px solid #4a5b6e;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.project-name {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}
</style>
