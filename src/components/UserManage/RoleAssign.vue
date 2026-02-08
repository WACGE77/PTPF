<template>
  <div class="role-assign-container">
    <el-form ref="formRef" :model="formData">
      <el-form-item label="已选角色" prop="roles">
        <el-select
          v-model="formData.roles"
          multiple
          collapse-tags
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option
            v-for="role in roleList"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  userId: {
    type: [String, Number],
    default: ''
  },
  roleList: {
    type: Array,
    default: () => []
  },
  checkedRoles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['confirm']);
const formRef = ref(null);
const formData = ref({
  roles: []
});

// 监听已选角色变化
watch(
  () => props.checkedRoles,
  (val) => {
    formData.value.roles = val;
  },
  { immediate: true }
);

// 暴露校验方法
const validateForm = async () => {
  const valid = await formRef.value.validate();
  return valid;
};

// 暴露获取选中角色方法
const getSelectedRoles = () => {
  return formData.value.roles;
};

defineExpose({
  validateForm,
  getSelectedRoles
});
</script>

<style scoped lang="scss">
.role-assign-container {
  .el-form-item {
    margin-bottom: 0;
  }

  .el-select {
    width: 100%;
  }
}
</style>
