<template>
  <div class="smtp-config-manager">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="SMTP服务器" prop="smtp_host">
        <el-input v-model="form.smtp_host" placeholder="如: smtp.qq.com" />
      </el-form-item>
      <el-form-item label="SMTP端口" prop="smtp_port">
        <el-input-number v-model="form.smtp_port" :min="1" :max="65535" />
      </el-form-item>
      <el-form-item label="SMTP用户名" prop="smtp_username">
        <el-input v-model="form.smtp_username" placeholder="邮箱地址" />
      </el-form-item>
      <el-form-item label="SMTP密码" prop="smtp_password">
        <el-input v-model="form.smtp_password" type="password" placeholder="邮箱授权码" show-password />
      </el-form-item>
      <el-form-item label="启用SSL" prop="smtp_ssl">
        <el-switch v-model="form.smtp_ssl" />
      </el-form-item>
      <el-form-item label="是否启用" prop="is_active">
        <el-switch v-model="form.is_active" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="loading">
          保存配置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 测试邮件发送区域 -->
    <el-divider content-position="left">
      <span class="test-divider-text">测试邮件发送</span>
    </el-divider>

    <!-- 未配置提示 -->
    <el-alert
      v-if="!hasSmtpConfig"
      title="未检测到SMTP配置"
      type="warning"
      :closable="false"
      show-icon
      class="mb-4"
    >
      <template #default>
        请先保存SMTP配置后再进行测试，或点击上方"保存配置"按钮。
      </template>
    </el-alert>

    <!-- 测试表单 -->
    <div v-else class="test-email-section">
      <el-alert
        title="测试说明"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      >
        <template #default>
          输入收件人邮箱地址，点击发送按钮验证当前SMTP配置是否正常工作。
        </template>
      </el-alert>

      <el-form :model="testForm" ref="testFormRef" label-width="100px" class="test-form">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="收件人邮箱" prop="to_email" :rules="testRules.to_email">
              <el-input
                v-model="testForm.to_email"
                placeholder="请输入接收测试邮件的邮箱地址"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label=" " :label-width="0">
              <el-button
                type="success"
                @click="handleSendTestEmail"
                :loading="sending"
                :disabled="!testForm.to_email"
                style="width: 100%"
              >
                {{ sending ? '发送中...' : '发送测试邮件' }}
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 发送结果 -->
      <transition name="el-fade-in">
        <el-result
          v-if="sendResult"
          :icon="sendResult.success ? 'success' : 'error'"
          :title="sendResult.success ? '发送成功！' : '发送失败'"
          :sub-title="sendResult.message"
          class="mt-4"
        >
          <template #extra v-if="sendResult.success">
            <el-tag type="success" effect="plain">
              已发送至: {{ sendResult.to_email }}
            </el-tag>
          </template>
        </el-result>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, FormRules } from 'element-plus'
import api from '@/api'

const formRef = ref<FormInstance>()
const testFormRef = ref<FormInstance>()
const loading = ref(false)
const sending = ref(false)
const sendResult = ref<any>(null)

const form = ref({
  id: null as number | null,
  smtp_host: 'smtp.qq.com',
  smtp_port: 465,
  smtp_username: '',
  smtp_password: '',
  smtp_ssl: true,
  is_active: true
})

const testForm = reactive({
  to_email: ''
})

const rules: FormRules = {
  smtp_host: [
    { required: true, message: '请输入SMTP服务器', trigger: 'blur' },
    { max: 128, message: 'SMTP服务器长度不能超过128个字符', trigger: 'blur' }
  ],
  smtp_port: [
    { required: true, message: '请输入SMTP端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号必须在1-65535之间', trigger: 'blur' }
  ],
  smtp_username: [
    { max: 128, message: 'SMTP用户名长度不能超过128个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          callback(new Error('请输入有效的邮箱地址'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  smtp_password: [
    { max: 256, message: 'SMTP密码长度不能超过256个字符', trigger: 'blur' }
  ]
}

const testRules: any = {
  to_email: [
    { required: true, message: '请输入收件人邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ]
}

const hasSmtpConfig = computed(() => {
  return !!(form.value.smtp_host && form.value.smtp_username)
})

const loadConfig = async () => {
  try {
    const res = await api.smtpApi.getCurrent()
    if (res.data.code === 200 && res.data.detail) {
      form.value = { ...form.value, ...res.data.detail }
    }
  } catch (error) {
    console.error('Failed to load SMTP config:', error)
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        let res
        if (form.value.id) {
          res = await api.smtpApi.updateSmtp(form.value)
        } else {
          res = await api.smtpApi.addSmtp(form.value)
        }
        if (res.data.code === 200) {
          ElMessage.success('配置保存成功')
          sendResult.value = null
          await loadConfig()
        } else {
          ElMessage.error(res.data.detail || res.data.msg || '保存失败')
        }
      } catch (error) {
        console.error('Failed to save SMTP config:', error)
        ElMessage.error('保存失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleSendTestEmail = async () => {
  if (!testFormRef.value) {
    console.warn('testFormRef 未正确绑定，跳过表单校验')
  } else {
    try {
      await testFormRef.value.validate()
    } catch (e) {
      // 验证失败会抛出异常，直接抛到外层 catch
      throw e
    }
  }

  try {
    await ElMessageBox.confirm(
      `即将向 ${testForm.to_email} 发送测试邮件，是否确认？`,
      '确认发送',
      {
        confirmButtonText: '确认发送',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    sending.value = true
    sendResult.value = null

    const res = await api.smtpApi.testEmail({
      to_email: testForm.to_email,
      subject: '探针监控系统 - 测试邮件',
      content: `这是一封来自探针监控系统的测试邮件。\n\n如果您收到此邮件，说明：\n✓ SMTP服务器连接正常\n✓ 邮箱认证通过\n✓ 邮件发送功能可用\n\n---\n探针监控系统\n发送时间：${new Date().toLocaleString('zh-CN')}`
    })

    if (res.data.code === 200) {
      sendResult.value = {
        success: true,
        message: res.data.detail?.message || '测试邮件发送成功！',
        to_email: testForm.to_email
      }
      ElMessage.success('测试邮件发送成功！')
      // 弹出模态提示框显示详细结果
      ElMessageBox.alert(sendResult.value.message, '发送成功', {
        confirmButtonText: '确定',
        type: 'success'
      })
      // 自动在 15 秒后清除结果显示
      setTimeout(() => {
        sendResult.value = null
      }, 15000)
    } else {
      sendResult.value = {
        success: false,
        message: res.data.detail || res.data.msg || '发送失败'
      }
      ElMessage.error(res.data.detail || res.data.msg || '发送失败')
      ElMessageBox.alert(sendResult.value.message, '发送失败', {
        confirmButtonText: '确定',
        type: 'error'
      })
      setTimeout(() => {
        sendResult.value = null
      }, 15000)
    }

  } catch (error: any) {
    if (error === 'cancel') {
      // 用户取消
      return
    }
    console.error('发送测试邮件失败:', error)
    const detail = error?.response?.data?.detail || error?.response?.data?.msg || error?.message || '发送异常'
    sendResult.value = {
      success: false,
      message: detail
    }
    ElMessage.error(detail || '发送失败')
    ElMessageBox.alert(detail, '发送失败', {
      confirmButtonText: '确定',
      type: 'error'
    })
    setTimeout(() => {
      sendResult.value = null
    }, 15000)
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.smtp-config-manager {
  padding: 20px;
  max-width: 800px;
}

.test-divider-text {
  color: #409eff;
  font-size: 15px;
  font-weight: bold;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.test-email-section {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.test-form {
  margin-top: 16px;
}
</style>
