<template>
  <div class="bastion-layout">
    <!-- 整体布局容器 -->
    <el-container style="height: 100vh">
      <!-- 侧边导航栏 -->
      <el-aside width="200px" class="bastion-aside">
        <!-- 系统logo/名称 -->
        <div class="bastion-logo">
          <span>堡垒机管理系统</span>
        </div>

        <!-- 动态渲染的导航菜单 -->
        <el-menu
          :default-active="activeMenu"
          class="bastion-menu"
          background-color="#2e3b4e"
          text-color="#fff"
          active-text-color="#ffd04b"
          collapse-transition
        >
          <!-- 循环渲染菜单数据 -->
          <template v-for="menu in menuList" :key="menu.index">
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
                @select="router_push"
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
      </el-aside>

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
import { ref } from 'vue'
// 导入自定义图标映射
import { getIconComponent, type IconName } from '@/utils/iconMap'
import router from '@/router'
import { userProfile } from '@/stores/userProfile.ts'
const userPro = userProfile()
userPro.getuser()
// 手动定义 DropdownCommand 类型（解决导入错误）
type DropdownCommand = string | number | object

// 定义菜单数据类型（图标完全关联IconName）
interface MenuItem {
  index: string
  label: string
  icon: IconName // 严格限制为iconMap中的图标名
  children?: MenuItem[]
}

// 默认激活的菜单
const activeMenu = ref('1-1')

// 静态菜单数据（完全使用iconMap中的图标名）
const menuList = ref<MenuItem[]>([
  {
    index: '1',
    label: '资源管理',
    icon: 'Folder', // 改用更贴合的Folder图标
    children: [
      { index: '1-1', label: '资源组管理', icon: 'List' },
      { index: '1-2', label: '资源管理', icon: 'Monitor' },
      { index: '1-3', label: '凭证管理', icon: 'Key' },
    ],
  },
  {
    index: '2',
    label: 'Web终端',
    icon: 'FullScreen',
  },
  {
    index: '3',
    label: '权限管理',
    icon: 'User',
    children: [
      { index: '3-1', label: '用户管理', icon: 'UserFilled' },
      { index: '3-2', label: '角色管理', icon: 'Van' },
      { index: '3-3', label: '权限分配', icon: 'Lock' },
    ],
  },
  {
    index: '4',
    label: '审计中心',
    icon: 'Document',
    children: [
      { index: '4-1', label: '操作日志', icon: 'Files' },
      { index: '4-2', label: '会话日志', icon: 'Message' },
      { index: '4-3', label: '登录日志', icon: 'Bell' },
    ],
  },
  {
    index: '5',
    label: '系统设置',
    icon: 'Setting',
  },
])

const router_push = async (index: string) => {
  console.log(index)
  await router.push(index)
}

// 处理用户下拉菜单命令
const handleUserCommand = (command: DropdownCommand) => {
  switch (command) {
    case 'profile':
      console.log('点击了个人信息')
      break
    case 'setting':
      console.log('点击了系统设置')
      break
    case 'logout':
      console.log('点击了退出登录')
      break
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
