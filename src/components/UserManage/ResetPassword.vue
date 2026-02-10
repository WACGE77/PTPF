<template>
  <el-form
    ref="formRef"
    :model="userData"
    :rules="formRules"
    label-width="100px"
    class="user-form"
  >
    <el-form-item label="新密码" prop="newPassword">
      <el-input
        v-model="userData.newPassword"
        type="password"
        placeholder="请输入新密码"
        max-length="20"
        show-password
      />
    </el-form-item>

    <el-form-item label="确认新密码" prop="confirmPassword">
      <el-input
        v-model="userData.confirmPassword"
        type="password"
        placeholder="请再次输入新密码"
        max-length="20"
        show-password
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { User } from '@/struct/rbac.js'
import api from '@/api'
import { request_error } from '@/requests'
import { ElMessage } from 'element-plus'

// 定义Props接收用户数据
const user = defineModel<User>('user')

// 表单数据（扩展密码相关字段）
const userData = ref<{
  id: number
  name:string
  newPassword: string
  confirmPassword: string
}>({
  id: 0,
  name:'',
  newPassword: "",
  confirmPassword: "",
});

// 初始化表单数据
const init = () => {
  // 重置密码表单初始值
  userData.value = {
    id: user.value?.id || 0,
    name:'',
    newPassword: "",
    confirmPassword: "",
  };
};
// 监听用户数据变化，初始化表单
watch(user, (newVal) => {
  init();
}, { immediate: true, deep: true });
const formRef = ref<any>(null);

// 表单校验规则
const formRules = ref({
  name: [
    { required: true, message: '用户名称不能为空', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' },
    //{ pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码需包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== userData.value.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  remark: [
    { max: 200, message: '重置说明长度不超过200个字符', trigger: 'blur' }
  ]
});

// 提交重置密码
const submit = async () => {
  try {
    // 表单校验
    await formRef.value.validate();
  } catch (error) {
    ElMessage.error('表单填写有误，请检查必填项！');
    return;
  }

  try {
    // 构造接口参数
    const resetParams = {
      id: userData.value.id,
      password: userData.value.newPassword,
    };

    // 调用重置密码接口
    const res = await api.userApi.updateUser(resetParams);

    if (res.status === 200) {
      ElMessage.success('密码重置成功！');
    } else {
      ElMessage.error(res.data.detail || '密码重置失败');
    }
  } catch (err) {
    request_error(err);
  }
};

// 暴露方法供父组件调用
defineExpose({
  submit,
  init
});
</script>

<style scoped lang="scss">
// 标题样式（和用户表单保持一致）
.form-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #e6e6e6;
  padding-bottom: 10px;

  .form-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }
}

// 表单样式（统一规范）
.user-form {
  margin-bottom: 24px;

  .el-form-item {
    margin-bottom: 20px;
  }

  // 文本域样式优化
  .el-textarea__inner {
    border-radius: 6px;
    padding: 10px 15px;
    font-size: 14px;
  }
}

// 按钮区域样式（预留，和用户表单统一）
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e6e6e6;
}
</style>
