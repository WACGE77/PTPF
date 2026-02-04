<template>
  <div class="login-page">
    <!-- 登录主体容器 -->
    <div class="login-container">
      <!-- 左侧品牌展示区 -->
      <div class="login-banner">
        <div class="banner-content">
          <h1 class="banner-title">运维堡垒机管理系统</h1>
          <p class="banner-desc">
            集中管控服务器访问权限，保障运维操作安全合规，
            实现操作审计、权限管控、风险预警一体化管理
          </p>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="login-form-wrapper">
        <div class="login-header">
          <div class="login-logo">
            <component :is="getIconComponent('Monitor')" class="logo-icon" />
          </div>
          <h2 class="login-title">系统登录</h2>
          <p class="login-subtitle">请输入账号密码进行登录</p>
        </div>

        <!-- 登录表单 -->
        <el-form
          class="login-form"
          label-width="80px"
          :model="loginForm"
          ref="formRef"
          :rules="loginRule"
        >
          <el-form-item label="账号" class="form-item-custom">
            <el-input
              v-model="loginForm.account"
              placeholder="请输入登录账号"
              class="login-input"
              autocomplete="account"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <component :is="getIconComponent('User')" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" class="form-item-custom">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入登录密码"
              class="login-input"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <component :is="getIconComponent('Key')" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              size="large"
              :loading="isLoading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getIconComponent } from '@/utils/iconMap.ts'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api/index.ts'
import {request_error} from '@/requests'
import router from '@/router'
const formRef = ref()
const isLoading = ref(false) // 登录加载状态
const loginForm = ref({
  account: '',
  password: '',
})
const loginRule = ref({
  account: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名为3-20字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: '账号仅支持字母、数字、下划线和短横线',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, max: 20, message: '密码为6-20字符', trigger: 'blur' },
  ],
})
// 登录处理函数
const handleLogin = async () => {
  isLoading.value = true
  try {
    const res = await api.authApi.login(loginForm.value)
    if (res.status == 200) {
      const token = res.data.token.access
      localStorage.setItem('token', token)
      ElMessage.success('登录成功！')
      await router.push('/home')
    }
  } catch (error:any) {
    request_error(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 全局字体重置 - 核心修改：统一无衬线字体，优化字重/行高 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family:
    'Inter', '思源黑体', 'Source Han Sans CN', 'Microsoft YaHei', '微软雅黑', 'Helvetica Neue',
    Helvetica, Arial, sans-serif;
  font-weight: 400;
  line-height: 1.5;
}
/* 全局页面样式 */
.login-page {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* 登录容器 - 入场动画 */
.login-container {
  width: 100%;
  max-width: 1200px;
  height: 680px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  display: flex;
  overflow: hidden;
  animation: containerFadeIn 0.6s ease-out;
  transform: translateZ(0);
}

/* 左侧banner区 */
.login-banner {
  flex: 1;
  background: linear-gradient(135deg, #007acc 0%, #0099ff 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  background-size: 200% 200%;
  animation: bgGradient 15s ease infinite;
}

.login-banner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://picsum.photos/id/180/800/600') center/cover no-repeat;
  opacity: 0.15;
  z-index: 1;
}

.banner-content {
  position: relative;
  z-index: 2;
  animation: contentFadeIn 0.8s ease-out 0.2s both;
}

/* 左侧标题 - 加重字重，优化行高 */
.banner-title {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 20px;
  letter-spacing: 2px;
  line-height: 1.2;
}

/* 左侧描述 - 轻字重，优化行高 */
.banner-desc {
  font-size: 16px;
  font-weight: 300;
  line-height: 1.7;
  opacity: 0.95;
  max-width: 400px;
  letter-spacing: 0.5px;
}

/* 右侧表单区 */
.login-form-wrapper {
  flex: 0 0 450px;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: formSlideIn 0.6s ease-out 0.4s both;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  background: #f0f2f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #007acc;
  transition: all 0.3s ease;
}

.login-logo:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(0, 122, 204, 0.2);
}

.logo-icon {
  animation: breathe 3s ease-in-out infinite;
}

/* 表单标题 - 中粗，优化字间距 */
.login-title {
  font-size: 24px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

/* 表单子标题 - 轻字重，浅灰色调 */
.login-subtitle {
  font-size: 14px;
  font-weight: 300;
  color: #8c9aa8;
  letter-spacing: 1px;
}

/* 表单样式 */
.login-form {
  width: 100%;
}

/* 核心修改：增加表单项的底部间距 */
.form-item-custom {
  margin-bottom: 32px !important; /* 从20px调整为32px，可根据需求微调 */
}

/* 输入框优化 */
.login-input {
  --el-input-hover-border-color: #0099ff;
  --el-input-focus-border-color: #007acc;
}

/* 登录按钮 - 按钮文字加粗 */
.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  background: #007acc;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: 8px; /* 按钮顶部轻微增加间距，保持整体平衡 */
}

.login-btn:not(:disabled):hover {
  background: #005fa8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
}

.login-btn:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 122, 204, 0.2);
}

/* 动画定义 */
@keyframes containerFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bgGradient {
  0% {
    background-position: 0 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes formSlideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 响应式适配 - 小屏幕字体适配 */
@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
    height: auto;
    max-width: 450px;
    margin: 20px;
  }

  .login-banner {
    padding: 40px 20px;
    flex: none;
    height: 200px;
  }

  .banner-title {
    font-size: 28px;
    font-weight: 500;
  }

  .login-form-wrapper {
    padding: 40px 20px;
  }

  .login-title {
    font-size: 22px;
  }

  /* 小屏幕下适当减小间距，保持布局紧凑 */
  .form-item-custom {
    margin-bottom: 24px !important;
  }
}
</style>
