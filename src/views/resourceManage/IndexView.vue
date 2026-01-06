<template>
  <div class="resource-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <!-- 搜索 -->
          <div class="search-area">
            <el-input v-model="searchKeyword.key" placeholder="搜索资源名称或编码" clearable />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>

          <!-- 操作 -->
          <div class="actions">
            <!-- ❌ 移除批量删除按钮 -->
            <el-button type="primary" @click="handleAdd">添加资源</el-button>
          </div>
        </div>
      </template>

      <!-- 表格：移除 selection 列 -->
      <el-table :data="resources" stripe v-loading="tableLoading">
        <!-- ❌ 不再需要 type="selection" -->
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="资源名称" />
        <el-table-column prop="code" label="资源编码" />

        <el-table-column label="地址">
          <template #default="{ row }">
            {{ row.ipv4_address || row.ipv6_address || row.domain }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- <el-table-column label="生产环境" width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_production ? 'danger' : 'info'">
              {{ row.is_production ? '生产' : '非生产' }}
            </el-tag>
          </template>
        </el-table-column> -->

        <el-table-column prop="create_date" label="创建时间" width="180" />

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="info" @click="handleAssignVoucher(row)">分配凭证</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total"
        class="mt-4"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:page-size="searchKeyword.page_size"
        v-model:current-page="searchKeyword.page_number"
        @size-change="getResources"
        @current-change="getResources"
      />
    </el-card>

    <!-- 添加 / 编辑 资源 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>

        <el-form-item label="资源编码" prop="code">
          <el-input v-model="formData.code" />
        </el-form-item>

        <!-- IP 类型 -->
        <el-form-item label="IP 类型">
          <el-radio-group v-model="formData.ip_type">
            <el-radio label="ipv4">IPv4</el-radio>
            <el-radio label="ipv6">IPv6</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- IPv4 -->
        <el-form-item v-if="formData.ip_type === 'ipv4'" label="IPv4" prop="ipv4_address">
          <el-input v-model="formData.ipv4_address" placeholder="如：192.168.1.1" />
        </el-form-item>

        <!-- IPv6 -->
        <el-form-item v-if="formData.ip_type === 'ipv6'" label="IPv6" prop="ipv6_address">
          <el-input v-model="formData.ipv6_address" placeholder="如：2001:db8::1" />
        </el-form-item>

        <el-form-item label="端口">
          <el-input-number v-model="formData.port" :min="1" :max="65535" />
        </el-form-item>

        <el-form-item label="启用">
          <el-switch v-model="formData.status" />
        </el-form-item>

        <!-- <el-form-item label="生产环境">
          <el-switch v-model="formData.is_production" />
        </el-form-item> -->

        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配凭证对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配凭证"
      width="600px"
      @close="assignDialogVisible = false"
    >
      <el-alert
        :title="`当前已分配 ${assignedVoucherIds.length} 个凭证`"
        type="info"
        style="margin-bottom: 16px"
        :closable="false"
      />

      <el-checkbox-group v-model="assignedVoucherIds">
        <el-checkbox
          v-for="voucher in allVouchers"
          :key="voucher.id"
          :label="voucher.id"
          border
          style="display: block; margin-bottom: 8px"
        >
          {{ voucher.code }} ({{ voucher.username }})
        </el-checkbox>
      </el-checkbox-group>

      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAssignedVouchers">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import time from '@/utils/time'
import type { FormItemRule } from 'element-plus'
import type { Resource, Voucher } from '@/struct'

// ===== 列表 =====
const resources = ref<Resource[]>([])
// ❌ 移除 selectedRows
const tableLoading = ref(false)
const total = ref(0)

const searchKeyword = ref({
  key: '',
  page_size: 10,
  page_number: 1,
})

// ===== 弹窗 - 资源编辑 =====
const dialogVisible = ref(false)
const dialogTitle = ref('添加资源')
const formRef = ref()

const emptyForm = {
  id: 0,
  name: '',
  code: '',
  ip_type: 'ipv4',
  ipv4_address: '',
  ipv6_address: '',
  domain: '',
  port: 22,
  status: true,
  is_production: false,
  description: '',
}

const formData = ref({ ...emptyForm })

// ===== 弹窗 - 分配凭证 =====
const assignDialogVisible = ref(false)
const currentResourceId = ref<number | null>(null)
const assignedVoucherIds = ref<number[]>([])
const allVouchers = ref<Voucher[]>([])

// ===== Watcher =====
watch(
  () => formData.value.ip_type,
  (type) => {
    if (type === 'ipv4') formData.value.ipv6_address = ''
    else if (type === 'ipv6') formData.value.ipv4_address = ''
  },
)

// ===== 校验规则 =====
const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/
const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

const formRules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入资源编码', trigger: 'blur' }],
  ipv4_address: [
    {
      validator: (_: FormItemRule, val: string, cb: (err?: Error) => void) => {
        if (formData.value.ip_type === 'ipv4') {
          if (!val) cb(new Error('IPv4 地址不能为空'))
          else if (!ipv4Regex.test(val)) cb(new Error('IPv4 格式不正确'))
          else cb()
        } else cb()
      },
      trigger: 'blur',
    },
  ],
  ipv6_address: [
    {
      validator: (_: FormItemRule, val: string, cb: (err?: Error) => void) => {
        if (formData.value.ip_type === 'ipv6') {
          if (!val) cb(new Error('IPv6 地址不能为空'))
          else if (!ipv6Regex.test(val)) cb(new Error('IPv6 格式不正确'))
          else cb()
        } else cb()
      },
      trigger: 'blur',
    },
  ],
}

// ===== API 方法 =====
const getResources = async () => {
  tableLoading.value = true
  try {
    const res = await api.resourceApi.getResource(searchKeyword.value)
    if (res.data.code === 200) {
      resources.value = res.data.data.resources
      total.value = res.data.data.total
      resources.value.forEach((r) => {
        r.create_date = time.formatISODate(r.create_date)
      })
    } else {
      ElMessage.error(res.data.message || '获取资源失败')
    }
  } catch (err) {
    ElMessage.error('没有权限')
    //ElMessage.error(err instanceof Error ? err.message : '获取资源失败')
  } finally {
    tableLoading.value = false
  }
}

// 获取所有凭证（用于分配）
const fetchAllVouchers = async () => {
  try {
    const res = await api.voucherApi.getVoucher({ page_size: 999, page_number: 1, key: '' })
    if (res.data.code === 200) {
      allVouchers.value = res.data.data.vouchers
    } else {
      ElMessage.error('获取凭证列表失败')
    }
  } catch (err) {
    ElMessage.error('没有权限')
    //ElMessage.error(err instanceof Error ? err.message : '获取凭证失败')
  }
}

// ===== 操作方法 =====
const handleSearch = () => getResources()
// ❌ 移除 handleSelectionChange

const handleAdd = () => {
  dialogTitle.value = '添加资源'
  Object.assign(formData.value, emptyForm)
  dialogVisible.value = true
}

const handleEdit = (row: Resource) => {
  dialogTitle.value = '编辑资源'
  Object.assign(formData.value, row)
  formData.value.ip_type = row.ipv6_address ? 'ipv6' : 'ipv4'
  if (formData.value.ip_type === 'ipv4') formData.value.ipv6_address = ''
  else formData.value.ipv4_address = ''
  dialogVisible.value = true
}

const cancelDialog = () => {
  dialogVisible.value = false
  Object.assign(formData.value, emptyForm)
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    const payload: Partial<Resource> = {
      id: formData.value.id,
      name: formData.value.name,
      code: formData.value.code,
      port: formData.value.port,
      status: formData.value.status,
      is_production: formData.value.is_production,
      description: formData.value.description || null,
    }

    if (formData.value.ip_type === 'ipv4') {
      payload.ipv4_address = formData.value.ipv4_address
    } else {
      payload.ipv6_address = formData.value.ipv6_address
    }

    const apiFunc = payload.id === 0 ? api.resourceApi.addtResource : api.resourceApi.updateResource
    const res = await apiFunc(payload)

    if (res.data.code === 200) {
      ElMessage.success('操作成功')
      getResources()
      cancelDialog()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('没有权限')
    //ElMessage.error(err instanceof Error ? err.message : '操作失败')
  }
}

// ✅ 关键修改：删除时传 { resource_id: row.id }
const handleDelete = async (row: Resource) => {
  await ElMessageBox.confirm('确认删除该资源？', '提示', { type: 'warning' })
  try {
    // ⬇️ 使用 { resource_id: number }
    const res = await api.resourceApi.deleteResource({ id: row.id })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      getResources()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (err) {
    // 用户取消时不报错
    if (err instanceof Error && !err.message.includes('cancel')) {
      ElMessage.error(err.message)
    }
  }
}

// ===== 分配凭证逻辑 =====
const handleAssignVoucher = async (row: Resource) => {
  currentResourceId.value = row.id
  const voucherIds = (row.vouchers ?? []).map((v) => v.id).filter((id): id is number => id != null)
  assignedVoucherIds.value = voucherIds
  await fetchAllVouchers()
  assignDialogVisible.value = true
}

const handleSaveAssignedVouchers = async () => {
  if (currentResourceId.value === null) return

  try {
    const payload = {
      resource_id: currentResourceId.value,
      voucher_list: assignedVoucherIds.value,
    }

    const res = await api.resourceApi.bindVouchers(payload)

    if (res.data.code === 200) {
      ElMessage.success('凭证分配成功')
      assignDialogVisible.value = false
      getResources()
    } else {
      ElMessage.error(res.data.message || '分配失败')
    }
  } catch (err) {
    ElMessage.err('没有权限')
    //ElMessage.error(err instanceof Error ? err.message : '分配失败')
  }
}

// 初始化
getResources()
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
