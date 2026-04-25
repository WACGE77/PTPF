<template>
  <div class="probe-rule-manager">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加规则
      </el-button>
      <el-button type="danger" @click="handleBatchDelete" :disabled="!selectedIds.length">
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </div>

    <div class="search-bar">
      <div class="search-item">
        <label class="search-label">规则名称：</label>
        <el-input
          v-model="searchForm.name"
          placeholder="请输入规则名称"
          clearable
          style="width: 180px;"
        />
      </div>
      <div class="search-item">
        <label class="search-label">目标：</label>
        <el-input
          v-model="searchForm.target"
          placeholder="请输入目标"
          clearable
          style="width: 180px;"
        />
      </div>
      <div class="search-item">
        <label class="search-label">目标类型：</label>
        <el-select v-model="searchForm.target_type" placeholder="请选择" clearable style="width: 120px;">
          <el-option label="主机" value="host" />
          <el-option label="端口" value="port" />
        </el-select>
      </div>
      <div class="search-item">
        <label class="search-label">是否启用：</label>
        <el-select v-model="searchForm.is_enabled" placeholder="请选择" clearable style="width: 120px;">
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
      </div>
      <el-button type="primary" @click="searchRules">搜索</el-button>
      <el-button type="default" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="probeRules" @selection-change="handleSelectionChange" stripe>
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="规则名称" />
      <el-table-column prop="target_type" label="目标类型">
        <template #default="{ row }">
          <el-tag>{{ row.target_type === 'host' ? '主机' : '端口' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target" label="目标" />
      <el-table-column prop="detect_interval" label="探测间隔(秒)" />
      <el-table-column prop="fail_threshold" label="失败阈值" />
      <el-table-column prop="alert_interval" label="告警间隔(秒)" />
      <el-table-column prop="last_status" label="状态">
        <template #default="{ row }">
          <el-tag v-if="row.last_status === 'up'" type="success">正常</el-tag>
          <el-tag v-else-if="row.last_status === 'down'" type="danger">异常</el-tag>
          <el-tag v-else type="info">待检测</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_enabled" label="是否启用">
        <template #default="{ row }">
          <el-switch v-model="row.is_enabled" @change="handleToggle(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
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
        @current-change="loadRules"
        @size-change="loadRules"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规则' : '添加规则'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="目标类型" prop="target_type">
          <el-radio-group v-model="form.target_type">
            <el-radio label="host">主机</el-radio>
            <el-radio label="port">端口</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标" prop="target">
          <el-input v-model="form.target" :placeholder="form.target_type === 'host' ? '请输入IP地址' : '请输入IP:端口'" />
        </el-form-item>
        <el-form-item label="探测间隔(秒)" prop="detect_interval">
          <el-input-number v-model="form.detect_interval" :min="1" :max="86400" />
        </el-form-item>
        <el-form-item label="失败阈值" prop="fail_threshold">
          <el-input-number v-model="form.fail_threshold" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="告警间隔(秒)" prop="alert_interval">
          <el-input-number v-model="form.alert_interval" :min="1" :max="86400" />
        </el-form-item>
        <el-form-item label="告警方式">
          <el-select v-model="form.alert_method" placeholder="请选择告警方式" clearable>
            <el-option v-for="method in alertMethods" :key="method.id" :label="method.name" :value="method.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警模板">
          <el-select v-model="form.alert_template" placeholder="请选择告警模板" clearable>
            <el-option v-for="template in alertTemplates" :key="template.id" :label="template.name" :value="template.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_enabled" />
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
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alertSuccess, alertError } from '@/utils/notify'
import type { FormInstance, FormRules } from 'element-plus'
import api from '@/api'

const probeRules = ref([])
const alertMethods = ref([])
const alertTemplates = ref([])
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const searchForm = ref({
  name: '',
  target: '',
  target_type: '',
  is_enabled: null as boolean | null
})

const form = ref({
  id: null,
  name: '',
  target_type: 'host',
  target: '',
  detect_interval: 60,
  fail_threshold: 3,
  alert_interval: 300,
  alert_method: null,
  alert_template: null,
  is_enabled: true
})

const validateTarget = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请输入目标'))
  } else if (form.value.target_type === 'host') {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(value)) {
      callback(new Error('请输入有效的IP地址'))
    } else {
      callback()
    }
  } else if (form.value.target_type === 'port') {
    const hostPortRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/
    if (!hostPortRegex.test(value)) {
      callback(new Error('请输入有效的IP:端口格式，端口范围1-65535'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { max: 128, message: '规则名称长度不能超过128个字符', trigger: 'blur' }
  ],
  target_type: [
    { required: true, message: '请选择目标类型', trigger: 'change' }
  ],
  target: [
    { required: true, validator: validateTarget, trigger: 'blur' }
  ],
  detect_interval: [
    { required: true, message: '请输入探测间隔', trigger: 'blur' },
    { type: 'number', min: 1, max: 86400, message: '探测间隔必须在1-86400秒之间', trigger: 'blur' }
  ],
  fail_threshold: [
    { required: true, message: '请输入失败阈值', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '失败阈值必须在1-100之间', trigger: 'blur' }
  ],
  alert_interval: [
    { required: true, message: '请输入告警间隔', trigger: 'blur' },
    { type: 'number', min: 1, max: 86400, message: '告警间隔必须在1-86400秒之间', trigger: 'blur' }
  ]
}

const loadRules = async () => {
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

    const res = await api.probeRuleApi.getProbeRule(params)
    if (res.data.code === 200) {
      probeRules.value = res.data.detail
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('加载规则失败')
  }
}

const searchRules = async () => {
  currentPage.value = 1
  await loadRules()
}

const resetSearch = async () => {
  searchForm.value = {
    name: '',
    target: '',
    target_type: '',
    is_enabled: null
  }
  currentPage.value = 1
  await loadRules()
}

const loadAlertMethods = async () => {
  try {
    const res = await api.alertMethodApi.getAlertMethod({ all: true })
    if (res.data.code === 200) {
      alertMethods.value = res.data.detail
    }
  } catch (error) {
    console.error('加载告警方式失败', error)
  }
}

const loadAlertTemplates = async () => {
  try {
    const res = await api.alertTemplateApi.getAlertTemplate({ all: true })
    if (res.data.code === 200) {
      alertTemplates.value = res.data.detail
    }
  } catch (error) {
    console.error('加载告警模板失败', error)
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    target_type: 'host',
    target: '',
    detect_interval: 60,
    fail_threshold: 3,
    alert_interval: 300,
    alert_method: null,
    alert_template: null,
    is_enabled: true
  }
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
          res = await api.probeRuleApi.updateProbeRule(form.value)
        } else {
          res = await api.probeRuleApi.addProbeRule(form.value)
        }
        if (res.data.code === 200) {
          ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
          dialogVisible.value = false
          loadRules()
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
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', {
      type: 'warning'
    })
    const res = await api.probeRuleApi.deleteProbeRule({ id_list: [row.id] })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadRules()
    } else {
      ElMessage.error(res.data.detail || res.data.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条规则吗？`, '提示', {
      type: 'warning'
    })
    const res = await api.probeRuleApi.deleteProbeRule({ id_list: selectedIds.value })
    if (res.data.code === 200) {
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      loadRules()
    } else {
      ElMessage.error(res.data.detail || res.data.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleToggle = async (row: any) => {
  try {
    const res = await api.probeRuleApi.toggleProbeRule(row.id)
    if (res.data.code === 200) {
      // 显示成功弹窗，提示当前状态
      const stateMsg = row.is_enabled ? '规则已启用' : '规则已禁用'
      alertSuccess(stateMsg, '操作成功')
    } else {
      row.is_enabled = !row.is_enabled
      alertError(res.data.detail || res.data.msg || '操作失败', '操作失败')
    }
  } catch (error) {
    row.is_enabled = !row.is_enabled
    alertError('操作失败', '操作失败')
  }
}

onMounted(() => {
  loadRules()
  loadAlertMethods()
  loadAlertTemplates()
})
</script>

<style scoped>
.probe-rule-manager {
  width: 100%;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
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
