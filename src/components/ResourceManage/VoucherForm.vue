<template>
  <div class="voucher-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="资源组" prop="group">
        <el-select v-model="formData.group" placeholder="请选择资源组" style="width: 100%">
          <el-option v-for="g in store.groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
      <el-form-item label="私钥" prop="private_key">
        <el-input v-model="formData.private_key" type="textarea" placeholder="请输入私钥" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { resourceStore } from '@/stores/resource'
import { request_error } from '@/requests'
import type { Voucher } from '@/struct/resource.ts'

const store = resourceStore()

const props = defineProps<{
  voucher?: Voucher
  groupId?: number
}>()

const emit = defineEmits<{
  success: []
}>()

const formRef = ref()
const formData = ref({
  id: 0,
  name: '',
  username: '',
  password: '',
  private_key: '',
  description: '',
  group: 0
})

const validatePassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value && !formData.value.private_key) {
    callback(new Error('密码或私钥至少填写一个'))
  } else {
    callback()
  }
}

const formRules = {
  group: [{ required: true, message: '请选择资源组', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }]
}

const init = () => {
  if (props.voucher) {
    formData.value = {
      id: props.voucher.id,
      name: props.voucher.name,
      username: props.voucher.username,
      password: '',
      private_key: '',
      description: props.voucher.description || '',
      group: props.voucher.group
    }
  } else {
    formData.value = {
      id: 0,
      name: '',
      username: '',
      password: '',
      private_key: '',
      description: '',
      group: props.groupId || 0
    }
  }
}

const submit = async () => {
  const data: Record<string, unknown> = {
    name: formData.value.name,
    username: formData.value.username,
    description: formData.value.description || null,
    group: formData.value.group
  }

  if (formData.value.password) {
    data.password = formData.value.password
  }
  if (formData.value.private_key) {
    data.private_key = formData.value.private_key
  }

  if (!formData.value.password && !formData.value.private_key && !props.voucher) {
    ElMessage.error('密码或私钥至少填写一个')
    return
  }

  try {
    if (formData.value.id) {
      data.id = formData.value.id
      await store.updateVoucher(data)
      ElMessage.success('修改成功')
      emit('success')
    } else {
      await store.addVoucher(data)
      ElMessage.success('添加成功')
      emit('success')
    }
  } catch (err) {
    request_error(err)
  }
}

watch(
  () => props.voucher,
  () => init(),
  { immediate: true }
)

watch(
  () => props.groupId,
  () => init()
)

defineExpose({
  submit,
  init
})
</script>

<style scoped lang="scss">
.voucher-form {
  padding: 10px 0;
}
</style>
