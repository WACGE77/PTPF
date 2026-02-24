<template>
  <div class="group-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item v-if="!formData.parent" label="角色" prop="role">
        <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%">
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
import { ref, watch, onMounted } from 'vue'
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

const formRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const init = () => {
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
