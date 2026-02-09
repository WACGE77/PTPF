<template>
  <!-- 新增标题区域 -->
  <div class="form-header">
    <h3 class="form-title">{{ userData.id === 0 ? '添加用户' : '编辑用户' }} {{ userData.id === 0 ? '' : userData.name }}</h3>
  </div>

  <el-form
    ref="formRef"
    :model="userData"
    :rules="formRules"
    label-width="100px"
    class="user-form"
  >
    <el-form-item label="账户名" prop="account">
      <el-input
        v-model="userData.account"
        :disabled="userData.id !== 0"
        placeholder="请输入账户名"
        max-length="20"
      />
    </el-form-item>

    <el-form-item v-if="userData.id === 0" label="密码" prop="password">
      <el-input
        v-model="userData.password"
        type="password"
        placeholder="请输入密码"
        max-length="20"
      />
    </el-form-item>

    <el-form-item label="昵称" prop="name">
      <el-input
        v-model="userData.name"
        placeholder="请输入昵称"
        max-length="50"
      />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input
        v-model="userData.email"
        type="email"
        placeholder="请输入邮箱"
        max-length="100"
      />
    </el-form-item>

    <el-form-item label="手机号" prop="phoneNumber">
      <el-input
        v-model="userData.phone_number"
        placeholder="请输入手机号"
        max-length="11"
      />
    </el-form-item>

<!--    <el-form-item label="状态" prop="status">-->
<!--      <el-switch-->
<!--        v-model="userData.status"-->
<!--        active-text="正常"-->
<!--        inactive-text="禁用"-->
<!--      />-->
<!--    </el-form-item>-->
  </el-form>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import type { User } from '@/struct/rbac.js'
import api from '@/api'
import { request_error } from '@/requests'
import { ElMessage } from 'element-plus'

// 定义Props接收用户数据
const user = defineModel<User>('user')

// 表单数据（优先使用props传入的user，没有则用模拟数据）
const userData = ref<User>({
  id: 0,
  name: "",
  account: "",
  email: "",
  status: true,
  phone_number: "",
  remark: "",
});

// 初始化表单数据
const init = () => {
  Object.assign(userData.value, user.value);
};

const formRef = ref<any>(null);

// 表单校验规则
const formRules = ref({
  account: [
    { required: true, message: '请输入账户名', trigger: 'blur' },
    { min: 3, max: 20, message: '账户名长度在3-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: () => (userData.value.id === 0), message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ],
  name: [
    { max: 50, message: '昵称长度不超过50个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] },
    { max: 100, message: '邮箱长度不超过100个字符', trigger: 'blur' }
  ],
  phoneNumber: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ]
});

const submit = async () => {
  const isvalid = await formRef.value.validate();
  if (!isvalid)return
  try {
    let msg = ''
    let res = null
    if (userData.value.id === 0) {
      res = await api.userApi.addUser(userData.value);
      msg = '添加成功'
    }else {
      res = await api.userApi.updateUser(userData.value);
      msg = '修改成功'
    }
    if (res.status == 200) {
      ElMessage.success(msg);
    }else{
      ElMessage.error(res.data.detail)
    }
  }catch(err) {
    request_error(err)
  }
}
defineExpose({
  submit,
  init
})
</script>

<style scoped lang="scss">
// 标题样式
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

// 表单样式
.user-form {
  margin-bottom: 24px;

  .el-form-item {
    margin-bottom: 20px;
  }
}

// 按钮区域样式
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e6e6e6;
}
</style>
