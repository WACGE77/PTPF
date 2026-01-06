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
            <el-avatar size="small" :src="userPro.user.avatar" />
            {{ userPro.user.name }}
            <el-icon class="el-icon--right">
              <component :is="getIconComponent('ArrowDown')" />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
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
        <div class="copyright">Copyright - FIT2CLOUD 添柴 © 2025-2026</div>
        <div class="version">Version v2.0 GPL</div>
      </div>
    </div>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="resetPasswordVisible"
      title="重置密码"
      width="400px"
      @close="clearResetForm"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="旧密码" prop="old_password">
          <el-input
            v-model="resetPasswordForm.old_password"
            type="password"
            show-password
            placeholder="请输入当前密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="resetPasswordForm.new_password"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm_password">
          <el-input
            v-model="resetPasswordForm.confirm_password"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { userPro } from '@/main'
import { getIconComponent } from '@/utils/iconMap'
import type { MenuItemObject } from '@/struct/index'
import api from '@/api'

// 菜单数据
const items: MenuItemObject[] = [
  {
    id: 1,
    name: '概述',
    path: '/overview',
    component: '../views/overview/IndexView.vue',
    icon: 'House',
  },
  {
    id: 2,
    name: 'Web终端',
    path: '/terminal',
    component: '../components/terminal/IndexView.vue',
    icon: 'FullScreen',
  },
  {
    id: 3,
    name: '角色管理',
    path: '/role',
    component: '../components/roleManage/IndexView.vue',
    icon: 'UserFilled',
  },
  {
    id: 4,
    name: '用户管理',
    path: '/user',
    component: '../components/userManage/IndexView.vue',
    icon: 'User',
  },
  {
    id: 5,
    name: '凭证管理',
    path: '/voucher',
    component: '../components/voucherManage/IndexView.vue',
    icon: 'Lock',
  },
  {
    id: 6,
    name: '资源管理',
    path: '/resource',
    component: '../components/resourceManage/IndexView.vue',
    icon: 'Van',
  },
  {
    id: 7,
    name: '审计',
    path: '/audit',
    component: '../components/auditView/IndexView.vue',
    icon: 'Van',
  },
]

// 导航事件
const handleOpen = () => {}
const handleClose = () => {}
const handelSelect = (index: string) => {
  router.push(index)
}

// 登出
const logout = async () => {
  await api.authApi.logout()
  localStorage.clear()
  await userPro.clear()
  router.push('/login')
}

// 重置密码相关
const resetPasswordVisible = ref(false)
const resetPasswordFormRef = ref()
const resetPasswordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const resetPasswordRules = {
  old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== resetPasswordForm.new_password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const clearResetForm = () => {
  resetPasswordForm.old_password = ''
  resetPasswordForm.new_password = ''
  resetPasswordForm.confirm_password = ''
  if (resetPasswordFormRef.value) {
    resetPasswordFormRef.value.clearValidate()
  }
}

const submitResetPassword = async () => {
  try {
    await resetPasswordFormRef.value?.validate()

    const res = await api.userApi.resetPassword({
      old_password: resetPasswordForm.old_password,

      new_password: resetPasswordForm.new_password,
    })

    if (res.data.code === 200) {
      ElMessage.success('密码修改成功！')

      resetPasswordVisible.value = false

      clearResetForm()
    } else if (res.data.code === 400 && res.data.error_msg) {
      let errorMsg = ''

      const errors = res.data.error_msg // 👈 正确引用 error_msg

      if (errors.old_password) {
        errorMsg += '旧密码：' + errors.old_password[0] + '\n'
      }

      if (errors.new_password) {
        errorMsg += '新密码：' + errors.new_password[0] + '\n'
      }

      ElMessage.error(errorMsg.trim())
    } else {
      ElMessage.error(res.data.msg || '操作失败')
    }
  } catch (err) {
    // 表单验证失败（前端校验不通过）会进入这里

    console.warn('表单验证未通过', err)

    // 不发请求，Element Plus 已显示错误提示
  }
}

// 下拉命令处理
const handleCommand = (command: string) => {
  if (command === 'logout') {
    logout()
  } else if (command === 'resetPassword') {
    resetPasswordVisible.value = true
  }
}
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

.project-name {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}
</style>
