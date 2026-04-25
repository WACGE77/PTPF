<template>
  <div class="alert-method-manager">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加告警方式
      </el-button>
    </div>

    <div class="search-bar">
      <div class="search-item">
        <label class="search-label">告警名称：</label>
        <el-input
          v-model="searchForm.name"
          placeholder="请输入告警名称"
          clearable
          style="width: 180px;"
        />
      </div>
      <div class="search-item">
        <label class="search-label">类型：</label>
        <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 150px;">
          <el-option label="邮箱告警" value="email" />
        </el-select>
      </div>
      <el-button type="primary" @click="searchMethods">搜索</el-button>
      <el-button type="default" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="methods" stripe>
      <el-table-column prop="name" label="告警名称" />
      <el-table-column prop="type" label="类型">
        <template #default="{ row }">
          <el-tag>{{ row.type === 'email' ? '邮箱告警' : row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="收件人">
        <template #default="{ row }">
          <el-tag v-for="(email, idx) in row.to_list" :key="idx" size="small" class="mr-1">
            {{ email }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        @current-change="loadMethods"
        @size-change="loadMethods"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑告警方式' : '添加告警方式'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="告警名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入告警名称" />
        </el-form-item>
        <el-form-item label="告警类型">
          <el-select v-model="form.type" disabled>
            <el-option label="邮箱告警" value="email" />
          </el-select>
        </el-form-item>
        <el-form-item label="收件人列表">
          <el-input v-model="toListStr" type="textarea" placeholder="多个邮箱用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/api'

const methods = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const formRef = ref<FormInstance>()

const searchForm = ref({
  name: '',
  type: ''
})

const form = ref({
  id: null as number | null,
  name: '',
  type: 'email',
  to_list: [] as string[]
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入告警名称', trigger: 'blur' },
    { max: 64, message: '告警名称长度不能超过64个字符', trigger: 'blur' }
  ]
}

const toListStr = computed({
  get: () => form.value.to_list?.join(', ') || '',
  set: (val: string) => {
    form.value.to_list = val.split(',').map(s => s.trim()).filter(s => s)
  }
})

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const loadMethods = async () => {
  try {
    const params: any = {
      page_number: currentPage.value,
      page_size: pageSize.value
    }

    Object.entries(searchForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value
      }
    })

    const res = await api.alertMethodApi.getAlertMethod(params)
    if (res.data.code === 200) {
      methods.value = res.data.detail
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const searchMethods = async () => {
  currentPage.value = 1
  await loadMethods()
}

const resetSearch = async () => {
  searchForm.value = {
    name: '',
    type: ''
  }
  currentPage.value = 1
  await loadMethods()
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    type: 'email',
    to_list: []
  }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.value = JSON.parse(JSON.stringify(row))
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await api.alertMethodApi.updateAlertMethod(form.value)
        } else {
          res = await api.alertMethodApi.addAlertMethod(form.value)
        }
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
          dialogVisible.value = false
          loadMethods()
        } else {
          ElMessage.error(res.data.detail || res.data.msg || '操作失败')
        }
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' })
    const res = await api.alertMethodApi.deleteAlertMethod({ id_list: [row.id] })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadMethods()
    } else {
      ElMessage.error(res.data.detail || res.data.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadMethods()
})
</script>

<style scoped>
.alert-method-manager {
  width: 100%;
}

.toolbar {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.search-item {
  display: flex;
  align-items: center;
}

.search-label {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
  white-space: nowrap;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.mr-1 {
  margin-right: 4px;
}
</style>
