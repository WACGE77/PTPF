<template>
  <div class="group-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" validate-on-rule-change>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item v-if="!formData.parent" label="系统组拥有者" prop="role">
        <el-select v-model="formData.role" placeholder="请选择系统组拥有者" style="width: 100%">
          <el-option
            v-for="role in roles"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { resourceStore } from '@/stores/resource'
import { request_error } from '@/requests'
import type { Role } from '@/struct/rbac.ts'
import type { ResourceGroup } from '@/struct/resource.ts'

const store = resourceStore()

const props = defineProps<{
  group?: ResourceGroup
  parentId?: number | null
}>()

const emit = defineEmits<{
  success: []
}>()

const roles = ref<Role[]>([])

const formRef = ref()
const formData = ref({
  id: 0,
  name: '',
  description: '',
  parent: null as number | null,
  role: null as number | null
})

const validateRole = (_rule: unknown, value: number | null, callback: (error?: Error) => void) => {
  if (!formData.value.parent && !value) {
    callback(new Error('请选择系统组拥有者'))
  } else {
    callback()
  }
}

const formRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  role: [{ validator: validateRole, trigger: 'change' }]
}

const init = async () => {
  if (props.group) {
    formData.value = {
      id: props.group.id,
      name: props.group.name,
      description: props.group.description || '',
      parent: props.group.parent,
      role: null
    }
  } else {
    formData.value = {
      id: 0,
      name: '',
      description: '',
      parent: props.parentId || null,
      role: props.parentId ? null : null
    }
  }
  await nextTick()
  formRef.value?.validate()
}

const loadRoles = async () => {
  try {
    const res = await api.roleApi.getRole({ all: true })
    if (res.data.code === 200) {
      roles.value = res.data.detail
    }
  } catch (err) {
    request_error(err)
  }
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
    description: formData.value.description || null
  }

  if (formData.value.id) {
    data.id = formData.value.id
  }

  if (formData.value.parent) {
    data.parent = formData.value.parent
  } else if (formData.value.role) {
    data.role = formData.value.role
  }

  try {
    if (formData.value.id) {
      await store.updateGroup(data)
      ElMessage.success('修改成功')
      emit('success')
    } else {
      await store.addGroup(data)
      ElMessage.success('添加成功')
      emit('success')
    }
  } catch (err) {
    request_error(err)
  }
}

watch(
  () => props.group,
  () => init(),
  { immediate: true }
)

watch(
  () => props.parentId,
  () => init()
)

onMounted(() => {
  loadRoles()
})

defineExpose({
  submit,
  init
})
</script>

<style scoped lang="scss">
.group-form {
  padding: 10px 0;
}
</style>
