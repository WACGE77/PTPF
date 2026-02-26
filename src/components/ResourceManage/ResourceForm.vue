<template>
  <div class="resource-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" validate-on-rule-change>
      <el-form-item label="资源组" prop="group">
        <el-select v-model="formData.group" placeholder="请选择资源组" style="width: 100%">
          <el-option v-for="g in store.groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="IPv4地址" prop="ipv4_address">
        <el-input v-model="formData.ipv4_address" placeholder="请输入IPv4地址" />
      </el-form-item>
      <el-form-item label="IPv6地址" prop="ipv6_address">
        <el-input v-model="formData.ipv6_address" placeholder="请输入IPv6地址（可选）" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input-number v-model="formData.port" :min="1" :max="65535" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { resourceStore } from '@/stores/resource'
import { request_error } from '@/requests'
import type { Resource } from '@/struct/resource.ts'

const store = resourceStore()

const props = defineProps<{
  resource?: Resource
  groupId?: number
}>()

const emit = defineEmits<{
  success: []
}>()

const formRef = ref()
const formData = ref({
  id: 0,
  name: '',
  ipv4_address: '',
  ipv6_address: '',
  port: 22,
  description: '',
  group: 0
})

const validateIp = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!props.resource && !value && !formData.value.ipv6_address) {
    callback(new Error('IPv4或IPv6地址至少填写一个'))
  } else if (value && !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) {
    callback(new Error('请输入有效的IPv4地址'))
  } else {
    callback()
  }
}

const validateIpv6 = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value && !/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1}(?::[0-9a-fA-F]{1,4}){1,6}$|^(?:[0-9a-fA-F]{1,4}:){2}(?::[0-9a-fA-F]{1,4}){1,5}$|^(?:[0-9a-fA-F]{1,4}:){3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){6}:[0-9a-fA-F]{1,4}$/.test(value)) {
    callback(new Error('请输入有效的IPv6地址'))
  } else {
    callback()
  }
}

const validatePort = (_rule: unknown, value: number, callback: (error?: Error) => void) => {
  if (!value || value < 1 || value > 65535) {
    callback(new Error('端口号范围为1-65535'))
  } else {
    callback()
  }
}

const formRules = {
  group: [{ required: true, message: '请选择资源组', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  ipv4_address: [{ validator: validateIp, trigger: 'blur' }],
  ipv6_address: [{ validator: validateIpv6, trigger: 'blur' }],
  port: [{ validator: validatePort, trigger: 'blur' }]
}

const init = async () => {
  if (props.resource) {
    formData.value = {
      id: props.resource.id,
      name: props.resource.name,
      ipv4_address: props.resource.ipv4_address,
      ipv6_address: props.resource.ipv6_address || '',
      port: props.resource.port,
      description: props.resource.description || '',
      group: props.resource.group
    }
  } else {
    formData.value = {
      id: 0,
      name: '',
      ipv4_address: '',
      ipv6_address: '',
      port: 22,
      description: '',
      group: props.groupId || 0
    }
  }
  await nextTick()
  formRef.value?.validate()
}

const submit = async () => {
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.error('表单填写有误，请检查必填项！')
    return
  }

  const data: Record<string, unknown> = {
    name: formData.value.name,
    ipv4_address: formData.value.ipv4_address || null,
    ipv6_address: formData.value.ipv6_address || null,
    port: formData.value.port,
    description: formData.value.description || null,
    group: formData.value.group
  }

  try {
    if (formData.value.id) {
      data.id = formData.value.id
      await store.updateResource(data)
      ElMessage.success('修改成功')
      emit('success')
    } else {
      data.protocol = 1
      await store.addResource(data)
      ElMessage.success('添加成功')
      emit('success')
    }
  } catch (err) {
    request_error(err)
  }
}

watch(
  () => props.resource,
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
.resource-form {
  padding: 10px 0;
}
</style>
