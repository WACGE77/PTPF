<template>
  <div class="voucher-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="search-area">
            <el-input v-model="searchKeyword.key" placeholder="搜索凭证编码或用户名" clearable />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>

          <div class="actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon><component :is="getIconComponent('Plus')" /></el-icon>
              添加凭证
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="vouchers" stripe v-loading="tableLoading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="凭证编码" />
        <el-table-column prop="username" label="用户名" />

        <!-- <el-table-column label="是否公开" width="100">
          <template #default="{ row }">
            <el-tag :type="row.publiced ? 'success' : 'info'">
              {{ row.publiced ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="默认凭证" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_default" type="warning">默认</el-tag>
          </template>
        </el-table-column> -->

        <el-table-column prop="create_date" label="创建时间" width="180" />

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total"
        class="mt-4"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:page-size="searchKeyword.page_size"
        v-model:current-page="searchKeyword.page_number"
        @size-change="getVouchers"
        @current-change="getVouchers"
      />
    </el-card>

    <!-- 编辑 / 添加 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="凭证编码" prop="code">
          <el-input v-model="formData.code" />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>

        <el-form-item label="认证方式">
          <el-radio-group v-model="formData.auth_type">
            <el-radio label="password">密码</el-radio>
            <el-radio label="private_key">私钥</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 密码：可选更新 -->
        <el-form-item v-if="formData.auth_type === 'password'" label="密码" prop="temp_password">
          <el-input
            v-model="formData.temp_password"
            type="password"
            show-password
            placeholder="编辑时不填写则不修改,添加时为必填项"
          />
        </el-form-item>

        <!-- 私钥：可选更新 -->
        <el-form-item
          v-if="formData.auth_type === 'private_key'"
          label="私钥"
          prop="temp_private_key"
        >
          <el-input
            v-model="formData.temp_private_key"
            type="textarea"
            :rows="4"
            placeholder="不填写则不修改"
          />
        </el-form-item>

        <!-- <el-form-item label="是否公开">
          <el-switch v-model="formData.publiced" />
        </el-form-item>

        <el-form-item label="默认凭证">
          <el-switch v-model="formData.is_default" />
        </el-form-item> -->

        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import time from '@/utils/time'
import { getIconComponent } from '@/utils/iconMap'
import type { Voucher } from '@/struct'

const vouchers = ref<Voucher[]>([])
const tableLoading = ref(false)
const total = ref(0)

const searchKeyword = ref({
  key: '',
  page_size: 10,
  page_number: 1,
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

/** 表单模型 */
const emptyForm = {
  id: 0,
  code: '',
  username: '',
  auth_type: 'password' as 'password' | 'private_key',

  // 临时字段（不回显）
  temp_password: '',
  temp_private_key: '',

  publiced: true,
  is_default: false,
  description: '',
}

const formData = ref({ ...emptyForm })

/** ✅ 关键：校验只在「创建」时强制 */
const formRules = {
  code: [{ required: true, message: '请输入凭证编码', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],

  temp_password: [
    {
      validator: (_: any, val: string, cb: any) => {
        if (formData.value.id > 0) return cb() // 编辑永远放行
        if (!val) return cb(new Error('请输入密码')) // 创建必填
        cb()
      },
      trigger: 'blur',
    },
  ],

  temp_private_key: [
    {
      validator: (_: any, val: string, cb: any) => {
        if (formData.value.id > 0) return cb()
        if (!val) return cb(new Error('请输入私钥'))
        cb()
      },
      trigger: 'blur',
    },
  ],
}

const getVouchers = async () => {
  tableLoading.value = true
  const res = await api.voucherApi.getVoucher(searchKeyword.value)
  try {
    if (res.data.code === 200) {
      vouchers.value = res.data.data.vouchers
      total.value = res.data.data.total
      vouchers.value.forEach((v) => {
        v.create_date = time.formatISODate(v.create_date)
      })
    }
  } catch (err) {
    ElMessage.error('没有权限')
  }
  tableLoading.value = false
}

const handleSearch = () => {
  searchKeyword.value.page_number = 1
  getVouchers()
}

const handleAdd = () => {
  dialogTitle.value = '添加凭证'
  Object.assign(formData.value, emptyForm)
  dialogVisible.value = true
}

const handleEdit = (row: Voucher) => {
  dialogTitle.value = '编辑凭证'
  Object.assign(formData.value, {
    ...emptyForm,
    ...row,
    auth_type: row.private_key ? 'private_key' : 'password',
  })

  // 🔴 必须显式清空临时字段
  formData.value.temp_password = ''
  formData.value.temp_private_key = ''

  dialogVisible.value = true
}

const cancelDialog = () => {
  dialogVisible.value = false
  Object.assign(formData.value, emptyForm)
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  await formRef.value.validate()

  const payload: any = {
    id: formData.value.id || undefined,
    code: formData.value.code,
    username: formData.value.username,
    auth_type: formData.value.auth_type,
    publiced: formData.value.publiced,
    is_default: formData.value.is_default,
    description: formData.value.description,
  }

  // ✅ 只有输入了才更新
  if (formData.value.auth_type === 'password' && formData.value.temp_password) {
    payload.password = formData.value.temp_password
  }

  if (formData.value.auth_type === 'private_key' && formData.value.temp_private_key) {
    payload.private_key = formData.value.temp_private_key
  }

  const apiFunc = payload.id ? api.voucherApi.updateVoucher : api.voucherApi.addtVoucher

  try {
    const res = await apiFunc(payload)
    if (res.data.code === 200) {
      ElMessage.success('操作成功')
      getVouchers()
      cancelDialog()
    }
  } catch (err) {
    ElMessage.error('没有权限')
  }
}

const handleDelete = async (row: Voucher) => {
  await ElMessageBox.confirm('确认删除该凭证？', '提示', { type: 'warning' })
  try {
    const res = await api.voucherApi.deleteVoucher({ id: row.id })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      getVouchers()
    }
  } catch (err) {
    ElMessage.error('没有权限')
  }
}

getVouchers()
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-area {
  display: flex;
  gap: 8px;
}
.actions {
  display: flex;
  gap: 12px;
}
.mt-4 {
  margin-top: 16px;
}
</style>
