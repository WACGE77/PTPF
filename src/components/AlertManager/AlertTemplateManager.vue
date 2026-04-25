<template>
  <div class="alert-template-manager">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加模板
      </el-button>
    </div>

    <div class="search-bar">
      <div class="search-item">
        <label class="search-label">模板名称：</label>
        <el-input
          v-model="searchForm.name"
          placeholder="请输入模板名称"
          clearable
          style="width: 180px;"
        />
      </div>
      <div class="search-item">
        <label class="search-label">告警标题：</label>
        <el-input
          v-model="searchForm.title"
          placeholder="请输入告警标题"
          clearable
          style="width: 180px;"
        />
      </div>
      <el-button type="primary" @click="searchTemplates">搜索</el-button>
      <el-button type="default" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="templates" stripe>
      <el-table-column prop="name" label="模板名称" />
      <el-table-column prop="title" label="告警标题" />
      <el-table-column prop="content" label="告警内容" show-overflow-tooltip />
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
        @current-change="loadTemplates"
        @size-change="loadTemplates"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '添加模板'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="告警标题" prop="title">
          <el-input v-model="form.title" placeholder="支持变量: {{ rule_name }}, {{ status }} 等" />
        </el-form-item>
        <el-form-item label="告警内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="支持变量: {{ rule_name }}, {{ target_type }}, {{ target }}, {{ fail_count }}, {{ last_check_time }}, {{ status }}" />
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
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/api'

const templates = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const formRef = ref<FormInstance>()

const searchForm = ref({
  name: '',
  title: ''
})

const form = ref({
  id: null,
  name: '',
  title: '',
  content: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { max: 128, message: '模板名称长度不能超过128个字符', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请输入告警标题', trigger: 'blur' },
    { max: 256, message: '告警标题长度不能超过256个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入告警内容', trigger: 'blur' }
  ]
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const loadTemplates = async () => {
  try {
    const params: any = {
      page_number: currentPage.value,
      page_size: pageSize.value
    }

    Object.entries(searchForm.value).forEach(([key, value]) => {
      if (value) {
        params[key] = value
      }
    })

    const res = await api.alertTemplateApi.getAlertTemplate(params)
    if (res.data.code === 200) {
      templates.value = res.data.detail
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const searchTemplates = async () => {
  currentPage.value = 1
  await loadTemplates()
}

const resetSearch = async () => {
  searchForm.value = {
    name: '',
    title: ''
  }
  currentPage.value = 1
  await loadTemplates()
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { id: null, name: '', title: '', content: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await api.alertTemplateApi.updateAlertTemplate(form.value)
        } else {
          res = await api.alertTemplateApi.addAlertTemplate(form.value)
        }
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
          dialogVisible.value = false
          loadTemplates()
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
    const res = await api.alertTemplateApi.deleteAlertTemplate({ id_list: [row.id] })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadTemplates()
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
  loadTemplates()
})
</script>

<style scoped>
.alert-template-manager {
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
</style>
