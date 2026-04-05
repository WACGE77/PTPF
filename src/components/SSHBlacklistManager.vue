<template>
  <div class="ssh-blacklist-manager">
    <h2>SSH黑名单管理</h2>
    
    <!-- 系统组选择 -->
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
    
    <!-- 规则列表 -->
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
        <el-table-column prop="create_date" label="创建时间" width="180" />
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
    
    <!-- 拦截日志 -->
    <el-card class="logs-card" v-if="selectedGroupId">
      <template #header>
        <div class="card-header">
          <span>拦截日志</span>
        </div>
      </template>
      <el-table :data="logs" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="target" label="命令" />
        <el-table-column prop="reason" label="原因" />
      </el-table>
      <div v-if="logs.length === 0" class="empty-data">
        暂无拦截日志
      </div>
    </el-card>
    
    <!-- 添加/编辑规则对话框 -->
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
          <el-input v-model="form.pattern" placeholder="输入匹配模式" />
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
            placeholder="输入规则描述"
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
import { usePermissionStore } from '@/stores/permission'
import { resourceStore } from '@/stores/resource'
import { sshBlacklistManager } from '@/utils/sshBlacklist'
import type { BlacklistRule, BlacklistLog } from '@/utils/sshBlacklist'

const permissionStore = usePermissionStore()
const resourceStoreInstance = resourceStore()

// 系统组数据
const groups = computed(() => resourceStoreInstance.groups)

// 选中的系统组ID
const selectedGroupId = ref<string>('')

// 规则列表
const rules = ref<BlacklistRule[]>([])

// 日志列表
const logs = ref<BlacklistLog[]>([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalRules = ref(0)

// 添加/编辑规则对话框
const showAddRuleDialog = ref(false)
const editingRule = ref<BlacklistRule | null>(null)

// 表单数据
const form = ref({
  group_id: '',
  pattern: '',
  type: 'exact' as 'exact' | 'prefix' | 'regex',
  priority: 0,
  description: ''
})

// 检查是否有权限
const hasPermission = computed(() => {
  return permissionStore.hasPermission('ssh_filter')
})

// 加载数据
const loadData = async () => {
  if (!selectedGroupId.value) return
  
  try {
    console.log('开始加载数据，selectedGroupId:', selectedGroupId.value)
    // 同步规则
    const syncedResult = await sshBlacklistManager.syncRules(
      selectedGroupId.value,
      currentPage.value,
      pageSize.value
    )
    console.log('同步规则结果:', syncedResult)
    rules.value = syncedResult.rules
    totalRules.value = syncedResult.total
    console.log('过滤后的规则:', rules.value)
    console.log('总规则数:', totalRules.value)
    // 获取日志
    logs.value = sshBlacklistManager.getLogs()
    console.log('日志列表:', logs.value)
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

// 加载系统组数据
const loadGroups = async () => {
  try {
    console.log('开始加载系统组数据')
    await resourceStoreInstance.getGroups()
    console.log('系统组数据加载完成，数量:', resourceStoreInstance.groups.length)
    
    // 如果有系统组，默认选择第一个
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

// 分页变化处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadData()
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  loadData()
}

// 处理系统组变化
const handleGroupChange = async () => {
  await loadData()
  // 更新表单中的系统组
  form.value.group_id = selectedGroupId.value
}

// 组件挂载时加载系统组数据
onMounted(async () => {
  console.log('组件挂载，开始获取系统组数据')
  await loadGroups()
})

// 添加规则
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

// 编辑规则
const editRule = (rule: BlacklistRule) => {
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

// 保存规则
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
      // 更新规则
      const result = await sshBlacklistManager.updateRule(editingRule.value.id, {
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
      // 添加新规则
      const result = await sshBlacklistManager.addRule({
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

// 删除规则
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
      const result = await sshBlacklistManager.deleteRule(ruleId)
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
  }).catch(() => {
    // 取消删除
  })
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// 获取匹配类型标签
const getTypeTag = (type: string) => {
  switch (type) {
    case 'exact':
      return 'primary'
    case 'prefix':
      return 'success'
    case 'regex':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取匹配类型文本
const getTypeText = (type: string) => {
  switch (type) {
    case 'exact':
      return '精确匹配'
    case 'prefix':
      return '前缀匹配'
    case 'regex':
      return '正则匹配'
    default:
      return '未知'
  }
}

// 监听系统组变化
watch(() => groups.value, async (newGroups) => {
  if (newGroups.length > 0 && !selectedGroupId.value) {
    selectedGroupId.value = newGroups[0].id.toString()
    await loadData()
  }
}, { deep: true })

// 组件挂载时
onMounted(async () => {
  console.log('组件挂载，开始获取系统组数据')
  // 获取系统组数据
  if (groups.value.length === 0) {
    await resourceStoreInstance.getGroups(true)
  }
  
  console.log('系统组数据:', groups.value)
  
  // 如果有系统组，默认选择第一个
  if (groups.value.length > 0) {
    selectedGroupId.value = groups.value[0].id.toString()
  }
  
  // 加载数据
  await loadData()
})
</script>

<style scoped>
.ssh-blacklist-manager {
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