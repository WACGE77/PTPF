<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#1890ff">
          <Monitor />
        </el-icon>
        <h2>堡垒机管理系统</h2>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" clearable>
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { User, Lock, Monitor } from '@element-plus/icons-vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import router from '@/router'
import type { FormInstance } from 'element-plus'
const loading = ref(false)
const loginFormRef = ref<FormInstance | null>(null)
const loginForm = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  loginFormRef.value?.validate(async (valid: boolean) => {
    if (valid && !loading.value) {
      loading.value = true
      const data: Record<string, unknown> = {
        account: loginForm.username,
        password: loginForm.password,
      }
      try {
        const result = await api.authApi.login(data)
        if (result.data.code == 200) {
          ElMessage.success('登录成功')
          localStorage.setItem('token', result.data.token.access)
          router.push('/home')
        } else {
          ElMessage.error(result.data.msg)
        }
      } catch (error) {
        ElMessage.error(String(error) + ',本地网络原因')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  margin-top: 16px;
  color: #333;
  font-size: 24px;
}

.login-form {
  margin-top: 24px;
}

.login-button {
  width: 100%;
}
</style>
