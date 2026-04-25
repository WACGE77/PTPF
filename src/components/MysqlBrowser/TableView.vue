<template>
  <div class="table-view">
    <!-- 表格标题栏 -->
    <div class="table-header">
      <div class="title">
        <el-icon><Coin /></el-icon>
        <span>{{ database }}.{{ table }}</span>
        <el-tag size="small" type="info" style="margin-left: 8px;">
          {{ displayRowCount }} 行
        </el-tag>

        <!-- 变更计数徽章 -->
        <el-badge 
          v-if="pendingCount > 0" 
          :value="pendingCount" 
          :max="99"
          type="warning"
          style="margin-left: 8px;"
        >
          <el-tag size="small" type="warning">待提交</el-tag>
        </el-badge>
      </div>

      <!-- 操作按钮组 -->
      <div class="header-actions">
        <!-- 删除模式开关 -->
        <el-switch
          v-model="deleteMode"
          active-text="删除模式"
          inactive-text=""
          size="small"
          :active-value="true"
          :inactive-value="false"
          style="--el-switch-on-color: #f56c6c; margin-right: 4px;"
        />

        <!-- 批量删除按钮 (仅在删除模式+有选中时显示) -->
        <el-button
          v-if="deleteMode && selectedRows.size > 0"
          type="danger"
          size="small"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          删除选中 ({{ selectedRows.size }})
        </el-button>

        <!-- 事务操作按钮组 -->
        <template v-if="hasPendingChanges && !deleteMode">
          <el-button type="success" size="small" @click="handleSubmit" :loading="submitting">
            <el-icon><Check /></el-icon>
            提交更改 ({{ pendingCount }})
          </el-button>
          <el-button size="small" @click="handleCancel">
            撤销更改
          </el-button>
        </template>

        <el-button type="primary" size="small" @click="showAddDialog = true" :disabled="deleteMode">
          <el-icon><Plus /></el-icon>
          新增行
        </el-button>
        
        <!-- 分页控件 -->
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          small
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container" v-loading="loading">
      <el-table
        :data="displayRows"
        stripe
        border
        height="calc(100% - 52px)"
        :row-key="(row) => getRowKey(row)"
        highlight-current-row
        empty-text="暂无数据"
        size="small"
        :row-class-name="getRowClassName"
        :default-sort="{ prop: 'id', order: 'ascending' }"
        @cell-dblclick="handleCellDblClick"
        ref="tableRef"
        @selection-change="handleSelectionChange"
      >
        <!-- 复选框列 (仅删除模式显示) -->
        <el-table-column
          v-if="deleteMode"
          type="selection"
          width="45"
          fixed="left"
          reserve-selection
        />

        <!-- 数据列（支持内联编辑） -->
        <el-table-column
          v-for="col in editableColumns"
          :key="col"
          :prop="col"
          :label="col"
          show-overflow-tooltip
          min-width="120"
          sortable
        >
          <template #default="{ row, $index }">
            <!-- 编辑模式 -->
            <template v-if="isEditingCell($index, col)">
              <el-input
                v-model="editingValue"
                size="small"
                autofocus
                @blur="finishEdit(row, col)"
                @keyup.enter="finishEdit(row, col)"
                @keyup.escape="cancelEdit"
                class="cell-editor"
              />
            </template>
            
            <!-- 显示模式 -->
            <template v-else>
              <span 
                class="cell-value"
                :class="{ 'cell-modified': isCellModified(row, col), 'cell-new': isNewRow(row) }"
                @dblclick="startEdit(row, col, $index)"
              >
                {{ formatCellValue(row[col], col) }}
              </span>
              
              <!-- 修改标记 -->
              <el-icon v-if="isCellModified(row, col)" class="modify-icon"><EditPen /></el-icon>
            </template>
          </template>
        </el-table-column>

        <!-- 状态列 -->
        <el-table-column label="状态" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-tag 
              v-if="isNewRow(row)" 
              type="success" 
              size="small" 
              effect="light"
            >新增</el-tag>
            <el-tag 
              v-else-if="isModifiedRow(row)" 
              type="warning" 
              size="small" 
              effect="light"
            >已改</el-tag>
            <span v-else style="color:#c0c4cc;">—</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 表格底部统计 -->
      <div class="table-footer" v-if="rows.length > 0 || pendingNewRows.length > 0">
        <span>
          显示 {{ (currentPage - 1) * pagination.pageSize + 1 }} - 
              {{ Math.min(currentPage * pagination.pageSize, displayRowCount) }} 条，
              共 {{ displayRowCount }} 条
          <template v-if="pendingNewRows.length > 0">
            （含 {{ pendingNewRows.length }} 行新增）
          </template>
          <template v-if="pendingModifiedKeys.size > 0">
            ，{{ pendingModifiedKeys.size }} 行已修改
          </template>
          <template v-if="pendingDeletedKeys.size > 0">
            ，{{ pendingDeletedKeys.size }} 行待删除
          </template>
        </span>
      </div>
    </div>

    <!-- 新增行对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="新增数据行"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="newRowData" :rules="newRowRules" ref="addFormRef" label-width="120px" size="default">
        <el-form-item
          v-for="col in addableColumns"
          :key="col"
          :label="col"
          :prop="col"
        >
          <!-- 布尔类型：开关 -->
          <el-switch
            v-if="isBooleanColumn(col)"
            v-model="newRowData[col]"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
          />
          <!-- 数字类型：数字输入 -->
          <el-input-number
            v-else-if="isNumberColumn(col)"
            v-model="newRowData[col]"
            :placeholder="`输入 ${col} 的数值`"
            controls-position="right"
            style="width: 100%"
          />
          <!-- 日期类型：日期选择器 -->
          <el-date-picker
            v-else-if="isDateColumn(col)"
            v-model="newRowData[col]"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <!-- JSON类型：文本域 -->
          <el-input
            v-else-if="isJsonColumn(col)"
            v-model="newRowData[col]"
            type="textarea"
            :rows="3"
            :placeholder="`输入 ${col} 的JSON数据`"
            clearable
          />
          <!-- 长文本：多行输入 -->
          <el-input
            v-else-if="isLongTextColumn(col)"
            v-model="newRowData[col]"
            type="textarea"
            :rows="4"
            :placeholder="`输入 ${col} 的值`"
            clearable
            maxlength="65535"
            show-word-limit
          />
          <!-- 默认：单行文本 -->
          <el-input
            v-else
            v-model="newRowData[col]"
            :placeholder="`输入 ${col} 的值`"
            clearable
          />
          <div class="form-type-hint">{{ getColumnHint(col) }}</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddRow" :loading="addingRow">
          添加到列表（暂不提交）
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="showBatchDeleteDialog"
      title="⚠️ 批量删除确认"
      width="500px"
    >
      <div class="delete-confirm-content">
        <p>确定要删除选中的 <strong>{{ selectedRows.size }}</strong> 行数据吗？此操作<strong>不可恢复</strong>。</p>
        <p style="color:#909399;font-size:13px;margin-top:8px;">
          这些行将被标记为待删除，点击「提交更改」后才会真正从数据库中移除。
        </p>
      </div>

      <template #footer>
        <el-button @click="showBatchDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmBatchDelete">
          标记删除 ({{ selectedRows.size }}项)
        </el-button>
      </template>
    </el-dialog>

    <!-- 提交确认对话框 -->
    <el-dialog
      v-model="showSubmitDialog"
      title="📤 提交更改到数据库"
      width="650px"
      :close-on-click-modal="false"
    >
      <div class="submit-preview">
        <p>以下更改将<strong>立即写入数据库</strong>，此操作不可撤销：</p>
        
        <div v-if="pendingNewRows.length > 0" class="change-group">
          <h4>🆕 新增 {{ pendingNewRows.length }} 行</h4>
          <div class="sql-preview" v-for="(row, idx) in pendingNewRows" :key="'new-'+idx">
            <code>INSERT INTO `{{ database }}`.`{{ table }}` ({{ Object.keys(row).map(c=>`\`${c}\``).join(', ') }}) VALUES ({{ Object.values(row).map(v=>formatSqlValue(v)).join(', ') }})</code>
          </div>
        </div>

        <div v-if="pendingModifiedKeys.size > 0" class="change-group">
          <h4>✏️ 修改 {{ pendingModifiedKeys.size }} 行</h4>
          <div class="sql-preview" v-for="key of Array.from(pendingModifiedKeys)" :key="'mod-'+key">
            <code>{{ generateUpdateSQL(key) }}</code>
          </div>
        </div>

        <div v-if="pendingDeletedKeys.size > 0" class="change-group">
          <h4>🗑️ 删除 {{ pendingDeletedKeys.size }} 行</h4>
          <div class="sql-preview" v-for="key of Array.from(pendingDeletedKeys)" :key="'del-'+key">
            <code>{{ generateDeleteSQL(key) }}</code>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showSubmitDialog = false" :disabled="submitting">返回编辑</el-button>
        <el-button type="success" @click="confirmSubmit" :loading="submitting">
          <el-icon><Check /></el-icon>
          确认提交全部 {{ pendingCount }} 项更改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alertInfo, alertSuccess } from '@/utils/notify'
import { Coin, Plus, Delete, EditPen, Check } from '@element-plus/icons-vue'

const props = defineProps<{
  database: string
  table: string
  columns: string[]
  columnTypes: Record<string, { type: string; data_type: string; nullable: boolean; is_key: boolean }>
  rows: any[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  loading: boolean
}>()

const emit = defineEmits<{
  'page-change': [page: number]
  'submit-changes': [changes: SubmitPayload]
  'refresh': []
  'clear-pending': []
}>()

interface SubmitPayload {
  database: string
  table: string
  newRows: any[]
  modifiedRows: Map<string, { original: any; current: any }>
  deletedKeys: Set<string>
  primaryKeyColumn: string
}

const tableRef = ref()
const currentPage = computed({
  get: () => props.pagination.page,
  set: (val) => { emit('page-change', val) }
})

// ========== 删除模式 ==========
const deleteMode = ref(false)
const selectedRows = ref<Set<any>>(new Set())
const showBatchDeleteDialog = ref(false)

function handleSelectionChange(selection: any[]) {
  selectedRows.value = new Set(selection)
}

async function handleBatchDelete() {
  if (selectedRows.value.size === 0) return
  showBatchDeleteDialog.value = true
}

function confirmBatchDelete() {
  const count = selectedRows.value.size
  
  for (const row of selectedRows.value) {
    const key = getRowKey(row)
    if (!isNewRow(row)) {
      pendingDeletedSet.add(key)
    } else {
      // 新增行直接移除
      const idx = pendingNewRows.indexOf(row)
      if (idx >= 0) pendingNewRows.splice(idx, 1)
    }
  }
  
  // 清除选中
  selectedRows.value.clear()
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
  
  showBatchDeleteDialog.value = false
  
  ElMessage.success(`已标记 ${count} 行为待删除`)
}

// ========== 内联编辑状态 ==========
const editingCell = ref<{ rowIndex: number; column: string } | null>(null)
const editingValue = ref<string>('')

// ========== 待提交变更追踪 ==========
const pendingNewRows = reactive<any[]>([])
const pendingModifiedMap = reactive<Map<string, { original: any; current: any }>>(new Map())
const pendingDeletedSet = reactive<Set<string>>(new Set())

// ========== 对话框状态 ==========
const showAddDialog = ref(false)
const showSubmitDialog = ref(false)
const submitting = ref(false)
const addingRow = ref(false)
const addFormRef = ref()
const newRowData = reactive<Record<string, any>>({})

// 动态生成表单验证规则
const newRowRules = computed(() => {
  const rules: Record<string, any> = {}
  props.columns.forEach(col => {
    const info = getColumnTypeInfo(col)
    const rule: any[] = []
    
    // 非空验证
    if (info && !info.nullable) {
      rule.push({ required: true, message: `${col} 不能为空`, trigger: 'blur' })
    }
    
    // 根据类型添加验证
    if (isBooleanColumn(col)) {
      // 布尔类型不需要额外验证
    } else if (isNumberColumn(col)) {
      const numType = info?.data_type || ''
      if (numType === 'INT' || numType === 'BIGINT') {
        rule.push({ 
          type: 'number', 
          message: `${col} 必须是整数`, 
          trigger: 'blur' 
        })
      } else {
        rule.push({ 
          type: 'number', 
          message: `${col} 必须是数字`, 
          trigger: 'blur' 
        })
      }
    } else if (isJsonColumn(col)) {
      rule.push({ 
        validator: (_r: any, v: any, c: any) => {
          if (!v) return c()
          try { JSON.parse(v) } catch { return c(new Error(`${col} 必须是有效的JSON格式`)) }
          c()
        }, 
        trigger: 'blur' 
      })
    } else if (isDateColumn(col)) {
      rule.push({ 
        required: true, 
        message: `${col} 必须选择日期`, 
        trigger: 'change' 
      })
    }
    
    // VARCHAR长度验证
    if (info?.type?.includes('varchar')) {
      const match = info.type.match(/varchar\((\d+)\)/i)
      if (match) {
        const maxLen = parseInt(match[1])
        rule.push({ 
          max: maxLen, 
          message: `${col} 最多 ${maxLen} 个字符`, 
          trigger: 'blur' 
        })
      }
    }
    
    if (rule.length > 0) {
      rules[col] = rule
    }
  })
  return rules
})

// ========== 计算属性 ==========

const editableColumns = computed(() => props.columns.filter(col => {
  const lower = col.toLowerCase()
  return !(lower === 'id' || lower === 'created_at' || lower === 'updated_at')
}))

const addableColumns = computed(() => props.columns.filter(col => {
  // 过滤时间审计字段
  const lower = col.toLowerCase()
  if (lower.endsWith('_at') || lower.endsWith('_time')) return false
  // 过滤自增主键列（用户不需要填写）
  const info = getColumnTypeInfo(col)
  if (info && info.type?.toLowerCase().includes('auto_increment')) return false
  return true
}))

const primaryKeyColumn = computed(() => {
  if (props.columns.includes('id')) return 'id'
  return props.columns[0] || 'id'
})

const displayRows = computed(() => {
  const serverRows = props.rows.filter(row => !isDeletedRow(row))
  return [...serverRows, ...pendingNewRows]
})

const displayRowCount = computed(() => {
  const serverVisible = props.rows.filter(r => !isDeletedRow(r)).length
  return serverVisible + pendingNewRows.length
})

const pendingCount = computed(() => 
  pendingNewRows.length + pendingModifiedMap.size + pendingDeletedSet.size
)

const hasPendingChanges = computed(() => pendingCount.value > 0)

const pendingModifiedKeys = computed(() => pendingModifiedMap.keys())
const pendingDeletedKeys = computed(() => pendingDeletedSet.keys())

const previewDeleteColumns = computed(() => props.columns.slice(0, 5))

const hasNewRowData = computed(() => {
  return addableColumns.value.some(col => {
    const val = newRowData[col]
    return val !== '' && val !== null && val !== undefined
  })
})

// ========== 行标识 ==========

function getRowKey(row: any): string {
  if (isNewRow(row)) return `__new_${pendingNewRows.indexOf(row)}`
  return String(row[primaryKeyColumn.value] || Math.random())
}

function isNewRow(row: any): boolean {
  return pendingNewRows.includes(row)
}

function isModifiedRow(row: any): boolean {
  const key = getRowKey(row)
  return pendingModifiedMap.has(key)
}

function isDeletedRow(row: any): boolean {
  const key = getRowKey(row)
  return pendingDeletedSet.has(key)
}

function isCellModified(row: any, col: string): boolean {
  if (isNewRow(row)) return false
  const key = getRowKey(row)
  const change = pendingModifiedMap.get(key)
  if (!change) return false
  return change.original[col] !== change.current[col]
}

// ========== 行样式 ==========

function getRowClassName({ row }: { row: any }): string {
  if (isNewRow(row)) return 'row-new'
  if (isDeletedRow(row)) return 'row-deleted'
  if (isModifiedRow(row)) return 'row-modified'
  return ''
}

// ========== 内联编辑 ==========

function isEditingCell(rowIndex: number, column: string): boolean {
  return editingCell.value?.rowIndex === rowIndex && editingCell.value?.column === column
}

function startEdit(row: any, column: string, rowIndex: number) {
  if (isDeletedRow(row)) return
  
  editingCell.value = { rowIndex, column }
  editingValue.value = String(row[column] ?? '')
  
  nextTick(() => {
    const input = document.querySelector('.cell-editor input')
    if (input) { input.focus(); input.select() }
  })
}

function finishEdit(row: any, column: string) {
  if (!editingCell.value) return
  
  const newValue = editingValue.value.trim()
  const oldValue = String(row[column] ?? '')
  
  if (newValue === oldValue) { cancelEdit(); return }
  
  if (isNewRow(row)) {
    row[column] = convertValue(newValue, column)
  } else {
    const key = getRowKey(row)
    let change = pendingModifiedMap.get(key)
    if (!change) {
      change = { original: { ...row }, current: { ...row } }
      pendingModifiedMap.set(key, change)
    }
    change.current[column] = convertValue(newValue, column)
    row[column] = change.current[column]
  }
  
  cancelEdit()
}

function cancelEdit() {
  editingCell.value = null
  editingValue.value = ''
}

function handleCellDblClick(row: any, column: any, cell: HTMLTableCellElement, event: Event) {
  const colIndex = editableColumns.value.indexOf(column.property)
  if (colIndex >= 0) {
    startEdit(row, column.property, cell.parentElement?.rowIndex ?? -1)
  }
}

// ========== 新增行 ==========

async function handleAddRow() {
  if (!addFormRef.value) return
  
  // 表单验证
  try {
    await addFormRef.value.validate()
  } catch {
    ElMessage.error('请检查输入数据的格式')
    return
  }

  addingRow.value = true
  
  const newRow: Record<string, any> = {}
  // 只遍历可编辑列，自动排除主键和审计字段
  addableColumns.value.forEach(col => {
    const val = newRowData[col]
    if (val !== '' && val !== null && val !== undefined) {
      newRow[col] = convertValue(val, col)
    } else {
      // 非空列已在表单验证中处理，这里允许空值（可为空的列）
      newRow[col] = null
    }
  })

  pendingNewRows.push(newRow)
  showAddDialog.value = false
  addingRow.value = false
  
  // 重置表单数据和验证状态
  addableColumns.value.forEach(col => { newRowData[col] = isBooleanColumn(col) ? 0 : '' })
  addFormRef.value?.clearValidate()
  
  ElMessage.success('已添加到待提交列表（点击「提交更改」写入数据库）')
}

// ========== 提交/撤销 ==========

async function handleSubmit() {
  if (!hasPendingChanges.value) return
  
  const validNewRows = pendingNewRows.filter(r => 
    Object.values(r).some(v => v !== null && v !== undefined && v !== '')
  )
  
  showSubmitDialog.value = true
}

async function confirmSubmit() {
  submitting.value = true
  
  try {
    const payload: SubmitPayload = {
      database: props.database,
      table: props.table,
      newRows: validNewRowsForSubmit(),
      modifiedRows: new Map(pendingModifiedMap),
      deletedKeys: new Set(pendingDeletedSet),
      primaryKeyColumn: primaryKeyColumn.value
    }
    
    emit('submit-changes', payload)
    showSubmitDialog.value = false
    
    alertInfo(`正在提交 ${pendingCount.value} 条更改...`, '提交')
    
    // 提交后清除所有pending状态并刷新
    clearAllPending()
    emit('refresh')
    
  } finally {
    submitting.value = false
  }
}

function validNewRowsForSubmit(): any[] {
  return pendingNewRows.filter(r => 
    Object.values(r).some(v => v !== null && v !== undefined && v !== '')
  )
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm(
      '确定要撤销所有未提交的更改吗？所有新增、修改、删除的操作都将被丢弃。',
      '撤销确认',
      { confirmButtonText: '确定撤销', cancelButtonText: '继续编辑', type: 'warning' }
    )
    
    clearAllPending()
    emit('clear-pending')
    alertSuccess('已撤销所有未提交的更改', '已撤销')
  } catch {}
}

// ========== 清除pending状态(供外部调用)==========

function clearAllPending() {
  pendingNewRows.length = 0
  pendingModifiedMap.clear()
  pendingDeletedSet.clear()
  selectedRows.value.clear()
  deleteMode.value = false
  editingCell.value = null
  editingValue.value = ''
}

// 暴露给父组件
defineExpose({ clearAllPending })

// ========== SQL生成 ==========

function formatSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  return `'${String(val).replace(/'/g, "\\'")}'`
}

function generateUpdateSQL(rowKey: string): string {
  const change = pendingModifiedMap.get(rowKey)
  if (!change) return ''
  
  const sets: string[] = []
  for (const col of props.columns) {
    if (change.original[col] !== change.current[col]) {
      sets.push(`\`${col}\` = ${formatSqlValue(change.current[col])}`)
    }
  }
  
  const pkVal = formatSqlValue(change.original[primaryKeyColumn.value])
  return `UPDATE \`${props.database}\`.\`${props.table}\` SET ${sets.join(', ')} WHERE \`${primaryKeyColumn.value}\` = ${pkVal} LIMIT 1`
}

function generateDeleteSQL(rowKey: string): string {
  const row = props.rows.find(r => getRowKey(r) === rowKey)
  if (!row) return ''
  
  const conditions: string[] = []
  for (const col of props.columns.slice(0, 3)) {
    const val = row[col]
    if (val !== null && val !== undefined) {
      conditions.push(`\`${col}\` = ${formatSqlValue(val)}`)
    }
  }
  
  return `DELETE FROM \`${props.database}\`.\`${props.table}\` WHERE ${conditions.join(' AND ')} LIMIT 1`
}

// ========== 分页 ==========

function handlePageChange(page: number) { emit('page-change', page) }
function handleSizeChange(size: number) { emit('page-change', 1) }

// ========== 工具函数 ==========

function formatCellValue(value: any, column: string): string {
  if (value === null || value === undefined) return '<span style="color:#c0c4cc;">NULL</span>'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') { try { return JSON.stringify(value) } catch { return '[Object]' } }
  if (typeof value === 'string' && value.length > 200) return value.substring(0, 200) + '...'
  return String(value)
}

function convertValue(val: any, column: string): any {
  if (val === '' || val === null || val === undefined) return null
  const info = getColumnTypeInfo(column)
  if (info) {
    if (info.data_type === 'TINYINT' && info.type?.includes('tinyint(1)')) return val ? 1 : 0
    if (['INT', 'BIGINT'].includes(info.data_type)) { const n = Number(val); if (!isNaN(n)) return n }
    if (['DECIMAL', 'FLOAT', 'DOUBLE', 'NUMERIC'].includes(info.data_type)) { const n = parseFloat(String(val)); if (!isNaN(n)) return n }
  }
  return String(val)
}

function isColumnRequired(col: string): boolean {
  const lower = col.toLowerCase()
  if (lower === 'id') return false
  if (lower.includes('name') || lower.includes('title')) return true
  return false
}

// ========== 列类型辅助函数 ==========

function getColumnTypeInfo(col: string) {
  return props.columnTypes?.[col] || null
}

function isBooleanColumn(col: string): boolean {
  const info = getColumnTypeInfo(col)
  if (info) return info.data_type === 'TINYINT' && info.type?.includes('tinyint(1)')
  return col.toLowerCase().includes('is_') || col.toLowerCase().includes('_flag')
}

function isNumberColumn(col: string): boolean {
  const info = getColumnTypeInfo(col)
  if (info) return ['INT', 'BIGINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'NUMERIC'].includes(info.data_type)
  return false
}

function isDateColumn(col: string): boolean {
  const info = getColumnTypeInfo(col)
  if (info) return ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(info.data_type)
  return false
}

function isJsonColumn(col: string): boolean {
  const info = getColumnTypeInfo(col)
  if (info) return info.data_type === 'JSON'
  return false
}

function isLongTextColumn(col: string): boolean {
  const info = getColumnTypeInfo(col)
  if (info) return ['TEXT', 'MEDIUMTEXT', 'LONGTEXT'].includes(info.data_type)
  return false
}

function getColumnHint(col: string): string {
  const info = getColumnTypeInfo(col)
  if (!info) return ''
  const parts: string[] = []
  parts.push(info.type)
  if (!info.nullable) parts.push('非空')
  if (info.is_key) parts.push('主键/唯一')
  return parts.join(' · ')
}
</script>

<style scoped lang="scss">
.table-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .table-header {
    padding: 8px 12px;
    border-bottom: 1px solid #e4e7ed;
    background: #fafafa;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 12px;

    .title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 6px;
      .el-icon { color: #409eff; }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      flex-wrap: wrap;
    }
  }

  .table-container {
    flex: 1;
    overflow: hidden;
    position: relative;

    :deep(.el-table) { font-size: 13px; }
    :deep(.el-table__cell) { padding: 4px 6px !important; }
    :deep(.el-table__header th) { background-color: #f5f7fa; color: #303133; font-weight: 600; }

    :deep(.row-new) { background-color: #f0f9eb !important; &:hover > td { background-color: #e1f3d8 !important; } }
    :deep(.row-modified) { background-color: #fdf6ec !important; &:hover > td { background-color: #faecd8 !important; } }
    :deep(.row-deleted) { opacity: 0.5; text-decoration: line-through; background-color: #fef0f0 !important; }
  }

  .table-footer {
    padding: 8px 12px;
    border-top: 1px solid #ebeef5;
    text-align: right;
    font-size: 12px;
    color: #909399;
    background: #fafafa;
  }
}

.cell-value {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.15s;
  &:hover { background-color: #ecf5ff; color: #409eff; }
}
.cell-modified { color: #e6a23c !important; font-weight: 500; }
.cell-new { color: #67c23a !important; }
.modify-icon { color: #e6a23c; font-size: 11px; margin-left: 2px; }
.cell-editor { width: 100%; :deep(.el-input__inner) { padding: 0 4px; } }

.delete-confirm-content p { margin: 0 0 12px 0; color: #303133; }
.delete-confirm-content p:last-child { font-size: 13px; color: #909399; }

.form-type-hint { font-size: 11px; color: #909399; margin-top: 4px; }

.submit-preview {
  p { margin: 0 0 16px 0; color: #303133; font-size: 14px; }
  .change-group { margin-bottom: 16px; h4 { margin: 0 0 8px 0; color: #303133; font-size: 13px; } .sql-preview { background: #f5f7fa; border-radius: 4px; padding: 8px 10px; margin-bottom: 6px; font-size: 12px; code { font-family: 'Monaco','Menlo',monospace; color: #409eff; word-break: break-all; line-height: 1.6; } } }
}
</style>
