<template>
  <div class="danger-cmd-alert-manager">
    <h2>危险命令告警管理</h2>
    
    <div class="system-group-selector">
      <el-select v-model="selectedGroupId" placeholder="选择系统组" @change="handleGroupChange">
        <el-option
          v-for="group in groups"
          :key="group.id"
          :label="group.name"
          :value="group.id.toString()"
        />
      </el-select>
      <el-button type="primary" @click="addRule" :disabled="!selectedGroupId || !hasPermission">
        + 添加规则
      </el-button>
    </div>
    
    <el-card class="rules-card" v-if="selectedGroupId">
      <template #header>
        <div class="card-header">
          <span>规则列表</span>
        </div>
      </template>
      <el-table :data="rules" style="width: 100%">
        <el-table-column prop="id" label="规则ID" width="80" />
        <el-table-column prop="pattern" label="匹配模式" />
        <el-table-column prop="type" label="匹配类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100" />
        <el-table-column prop="description" label="规则描述" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" @click="editRule(scope.row)" :disabled="!hasPermission">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteRule(scope.row.id)" :disabled="!hasPermission">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="rules.length === 0" class="empty-data">
        暂无规则
      </div>
      <div v-else class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper, sizes, total"
          :total="totalRules"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-card class="logs-card" v-if="selectedGroupId">
      <template #header>
        <div class="card-header">
          <span>告警日志（来自审计系统）</span>
          <el-button type="primary" size="small" @click="refreshLogs">刷新</el-button>
        </div>
      </template>
      <el-table :data="logs" style="width: 100%" v-loading="loadingLogs">
        <el-table-column prop="time" label="触发时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="target" label="命令内容" />
        <el-table-column prop="reason" label="匹配规则">
          <template #default="scope">
            <el-tag type="danger" size="small">{{ scope.row.reason }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!loadingLogs && logs.length === 0" class="empty-data">
        <p>暂无告警日志</p>
        <p class="tips">提示：在终端中执行匹配危险命令规则的命令后会在此显示记录</p>
      </div>
    </el-card>

    <el-dialog
      v-model="showAddRuleDialog"
      :title="editingRule ? '编辑规则' : '添加规则'"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="系统组">
          <el-select v-model="form.group_id" placeholder="选择系统组" style="width: 100%">
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.name"
              :value="group.id.toString()"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="匹配模式">
          <el-input v-model="form.pattern" placeholder="输入匹配模式（如 rm -rf /）" />
        </el-form-item>
        
        <el-form-item label="匹配类型">
          <el-radio-group v-model="form.type">
            <el-radio label="exact">精确匹配</el-radio>
            <el-radio label="prefix">前缀匹配</el-radio>
            <el-radio label="regex">正则匹配</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="规则描述">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="输入规则描述（如：禁止删除系统文件）"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddRuleDialog = false">取消</el-button>
          <el-button type="primary" @click="saveRule">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouteStore } from '@/stores/route'
import { resourceStore } from '@/stores/resource'
import { dangerCmdAlertManager } from '@/utils/dangerCmdAlert'
import type { DangerCmdRule, DangerCmdLog } from '@/utils/dangerCmdAlert'

const routeStore = useRouteStore()
const resourceStoreInstance = resourceStore()

const groups = computed(() => resourceStoreInstance.groups)
const selectedGroupId = ref<string>('')
const rules = ref<DangerCmdRule[]>([])
const logs = ref<DangerCmdLog[]>([])
const loadingLogs = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalRules = ref(0)
const showAddRuleDialog = ref(false)
const editingRule = ref<DangerCmdRule | null>(null)

const form = ref({
  group_id: '',
  pattern: '',
  type: 'exact' as 'exact' | 'prefix' | 'regex',
  priority: 0,
  description: ''
})

const hasPermission = computed(() => {
  return routeStore.hasPermission('/danger-cmd-alert')
})

const loadData = async () => {
  if (!selectedGroupId.value) return
  
  try {
    const syncedResult = await dangerCmdAlertManager.syncRules(
      selectedGroupId.value,
      currentPage.value,
      pageSize.value
    )
    rules.value = syncedResult.rules
    totalRules.value = syncedResult.total
    await refreshLogs()
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

const loadGroups = async () => {
  try {
    await resourceStoreInstance.getGroups()
    if (resourceStoreInstance.groups.length > 0 && !selectedGroupId.value) {
      selectedGroupId.value = resourceStoreInstance.groups[0].id.toString()
      form.value.group_id = selectedGroupId.value
      await loadData()
    }
  } catch (error) {
    console.error('加载系统组数据失败:', error)
    ElMessage.error('加载系统组数据失败')
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadData()
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  loadData()
}

const handleGroupChange = async () => {
  await loadData()
  form.value.group_id = selectedGroupId.value
}

const refreshLogs = async () => {
  loadingLogs.value = true
  try {
    const res = await requests.get('/audit/shell_op/', { 
      blocked: true,
      page_number: 1,
      page_size: 20
    })
    const response = res.data
    const remoteLogs = response.results || response.detail || response.success || []
    logs.value = remoteLogs.map((log: any) => ({
      time: new Date(log.operation_time).getTime(),
      target: log.content,
      reason: log.block_message || '命中危险命令规则'
    }))
  } catch (error) {
    console.error('加载日志失败:', error)
    logs.value = dangerCmdAlertManager.getLogs()
  } finally {
    loadingLogs.value = false
  }
}

onMounted(async () => {
  await loadGroups()
})

const addRule = () => {
  if (!hasPermission.value) {
    ElMessage.warning('您没有添加规则的权限')
    return
  }
  
  if (!selectedGroupId.value) {
    ElMessage.warning('请先选择一个系统组')
    return
  }
  
  editingRule.value = null
  form.value = {
    group_id: selectedGroupId.value,
    pattern: '',
    type: 'exact',
    priority: 0,
    description: ''
  }
  showAddRuleDialog.value = true
}

const editRule = (rule: DangerCmdRule) => {
  if (!hasPermission.value) {
    ElMessage.warning('您没有编辑规则的权限')
    return
  }
  
  editingRule.value = rule
  form.value = {
    group_id: rule.group_id,
    pattern: rule.pattern,
    type: rule.type,
    priority: rule.priority,
    description: rule.description
  }
  showAddRuleDialog.value = true
}

const saveRule = async () => {
  if (!hasPermission.value) {
    ElMessage.warning('您没有保存规则的权限')
    return
  }
  
  if (!form.value.pattern) {
    ElMessage.warning('请填写匹配模式')
    return
  }
  
  if (!form.value.group_id) {
    ElMessage.warning('请选择一个系统组')
    return
  }
  
  try {
    if (editingRule.value) {
      const result = await dangerCmdAlertManager.updateRule(editingRule.value.id, {
        group_id: form.value.group_id,
        pattern: form.value.pattern,
        type: form.value.type,
        priority: form.value.priority,
        description: form.value.description
      })
      if (result) {
        ElMessage.success('规则更新成功')
      } else {
        ElMessage.error('规则更新失败')
      }
    } else {
      const result = await dangerCmdAlertManager.addRule({
        group_id: form.value.group_id,
        pattern: form.value.pattern,
        type: form.value.type,
        priority: form.value.priority,
        description: form.value.description
      })
      if (result) {
        ElMessage.success('规则添加成功')
      } else {
        ElMessage.error('规则添加失败')
      }
    }
    
    showAddRuleDialog.value = false
    editingRule.value = null
    await loadData()
  } catch (error) {
    ElMessage.error('保存规则失败')
    console.error('保存规则失败:', error)
  }
}

const deleteRule = async (ruleId: string) => {
  if (!hasPermission.value) {
    ElMessage.warning('您没有删除规则的权限')
    return
  }
  
  ElMessageBox.confirm('确定要删除这条规则吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const result = await dangerCmdAlertManager.deleteRule(ruleId)
      if (result) {
        ElMessage.success('规则删除成功')
        await loadData()
      } else {
        ElMessage.error('规则删除失败')
      }
    } catch (error) {
      ElMessage.error('删除规则失败')
      console.error('删除规则失败:', error)
    }
  }).catch(() => {})
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const getTypeTag = (type: string) => {
  switch (type) {
    case 'exact': return 'danger'
    case 'prefix': return 'warning'
    case 'regex': return 'info'
    default: return 'info'
  }
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'exact': return '精确匹配'
    case 'prefix': return '前缀匹配'
    case 'regex': return '正则匹配'
    default: return '未知'
  }
}

watch(() => groups.value, async (newGroups) => {
  if (newGroups.length > 0 && !selectedGroupId.value) {
    selectedGroupId.value = newGroups[0].id.toString()
    await loadData()
  }
}, { deep: true })

onMounted(async () => {
  if (groups.value.length === 0) {
    await resourceStoreInstance.getGroups(true)
  }
  
  if (groups.value.length > 0) {
    selectedGroupId.value = groups.value[0].id.toString()
  }
  
  await loadData()
})
</script>

<style scoped>
.danger-cmd-alert-manager {
  padding: 20px;
}

.system-group-selector {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.system-group-selector .el-select {
  width: 200px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules-card,
.logs-card {
  margin-bottom: 20px;
}

.empty-data {
  text-align: center;
  padding: 20px;
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
