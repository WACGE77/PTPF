<template>
  <div class="mysql-workspace">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" size="small" @click="showSqlDialog = true" :disabled="!connected">
        <el-icon><EditPen /></el-icon>
        SQL查询
      </el-button>
      <el-button type="success" size="small" @click="showCreateDbDialog = true" :disabled="!connected">
        <el-icon><FolderAdd /></el-icon>
        新建库
      </el-button>
      <el-button size="small" @click="refreshDatabases" :disabled="!connected">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
      <span class="connection-info">
        <el-tag :type="connected ? 'success' : 'info'" size="small" effect="plain">
          {{ connected ? '🟢 已连接' : '⚪ 未连接' }}
        </el-tag>
      </span>
    </div>

    <!-- 主内容区 -->
    <div class="content">
      <!-- 左侧：数据库树形菜单 -->
      <div class="tree-panel">
        <div class="tree-header">
          📁 数据库
          <el-button size="small" text type="primary" @click="showCreateDbDialog = true" :disabled="!connected" style="margin-left:auto;">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        
        <!-- 树形菜单 + 自定义右键菜单 -->
        <div class="tree-wrapper" @contextmenu.prevent>
          <el-tree
            ref="treeRef"
            :data="databaseTree"
            :props="defaultProps"
            node-key="id"
            :expand-on-click-node="true"
            :load="loadNodeChildren"
            lazy
            highlight-current
            @node-click="handleNodeClick"
            @node-dblclick="handleNodeDblClick"
            v-loading="loadingTree"
          >
            <template #default="{ node, data }">
              <span
                class="tree-node"
                @contextmenu.prevent.stop="showContextMenu($event, data)"
              >
                <el-icon v-if="data.type === 'database'" style="color: #409eff; margin-right: 4px;">
                  <Coin />
                </el-icon>
                <el-icon v-else-if="data.type === 'table'" style="color: #67c23a; margin-right: 4px;">
                  <Document />
                </el-icon>
                <span>{{ data.label }}</span>
                <el-tag 
                  v-if="data.type === 'table' && data.rowCount !== undefined" 
                  size="small" 
                  type="info"
                  style="margin-left: 8px;"
                >
                  {{ data.rowCount }} 行
                </el-tag>
              </span>
            </template>
          </el-tree>
        </div>

        <!-- 自定义右键菜单 -->
        <div
          v-if="contextMenuVisible"
          class="custom-context-menu"
          :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
        >
          <div
            v-if="contextMenuNodeData?.type === 'database'"
            class="context-menu-item"
            @click="handleContextMenuCommand('create_table')"
          >
            📋 新建表
          </div>
          <div
            v-if="contextMenuNodeData?.type === 'table'"
            class="context-menu-item danger"
            @click="handleContextMenuCommand('delete_table')"
          >
            🗑️ 删除表
          </div>
          <div
            v-if="contextMenuNodeData?.type === 'table'"
            class="context-menu-item warning"
            @click="handleContextMenuCommand('truncate_table')"
          >
            🧹 清空数据
          </div>
        </div>

        <div v-if="!connected && !loadingTree" class="empty-hint">
          <el-empty description="等待连接..." :image-size="60" />
        </div>
      </div>

      <!-- 右侧：数据展示区 -->
      <div class="data-panel">
        <TableView
          v-if="viewMode === 'table' && currentTable"
          :key="`${currentDatabase}.${currentTable}`"
          ref="tableViewRef"
          :database="currentDatabase"
          :table="currentTable"
          :columns="tableColumns"
          :column-types="tableColumnTypes"
          :rows="tableRows"
          :pagination="pagination"
          :loading="loadingData"
          @page-change="handlePageChange"
          @submit-changes="handleSubmitChanges"
          @refresh="handleRefreshTable"
          @clear-pending="handleClearPending"
        />

        <div v-else-if="viewMode === 'none'" class="empty-state">
          <el-empty description="请选择一个表格查看数据" />
          <p class="hint-text">💡 单击左侧表名查看数据，右键数据库可新建表</p>
        </div>

        <div v-else-if="!connected" class="empty-state">
          <el-empty description="正在连接MySQL服务器...">
            <template #image>
              <el-icon :size="64" class="is-loading"><Loading /></el-icon>
            </template>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- SQL查询对话框 -->
    <el-dialog
      v-model="showSqlDialog"
      title="SQL查询"
      width="70%"
      :close-on-click-modal="false"
    >
      <SQLEditor
        :mysql-shell="mysqlShell"
        @executed="handleSqlExecuted"
      />
    </el-dialog>

    <!-- 新建数据库对话框 -->
    <el-dialog
      v-model="showCreateDbDialog"
      title="📦 新建数据库"
      width="450px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="newDbForm" label-width="100px" size="default">
        <el-form-item label="数据库名" required>
          <el-input
            v-model="newDbForm.name"
            placeholder="请输入数据库名称（仅字母、数字、下划线）"
            clearable
            maxlength="64"
          />
          <div class="form-tip">💡 名称只能包含字母、数字和下划线，不能以数字开头</div>
        </el-form-item>
        <el-form-item label="字符集">
          <el-select v-model="newDbForm.charset" style="width:100%">
            <el-option label="utf8mb4 (推荐)" value="utf8mb4" />
            <el-option label="utf8" value="utf8" />
            <el-option label="latin1" value="latin1" />
            <el-option label="gbk" value="gbk" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序规则">
          <el-select v-model="newDbForm.collation" style="width:100%">
            <el-option label="utf8mb4_general_ci (默认)" value="utf8mb4_general_ci" />
            <el-option label="utf8mb4_unicode_ci" value="utf8mb4_unicode_ci" />
            <el-option label="utf8mb4_bin" value="utf8mb4_bin" />
            <el-option label="utf8_general_ci" value="utf8_general_ci" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDbDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateDatabase" :loading="creatingDb">
          创建数据库
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建表对话框 -->
    <el-dialog
      v-model="showCreateTableDialog"
      title="📋 新建数据表"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="create-table-form">
        <el-form :model="newTableForm" label-width="90px" size="default">
          <el-form-item label="表名" required>
            <el-input
              v-model="newTableForm.name"
              placeholder="请输入表名"
              clearable
              maxlength="64"
            />
          </el-form-item>
          
          <el-form-item label="列定义">
            <div class="columns-editor">
              <div
                v-for="(col, index) in newTableForm.columns"
                :key="index"
                class="column-row"
              >
                <el-input v-model="col.name" placeholder="列名" size="default" style="width:140px;" />
                
                <el-select v-model="col.type" @change="(val) => onTypeChange(val, index)" size="default" style="width:130px;">
                  <el-option-group label="常用类型">
                    <el-option label="INT" value="INT" />
                    <el-option label="VARCHAR(255)" value="VARCHAR(255)" />
                    <el-option label="TEXT" value="TEXT" />
                    <el-option label="DATETIME" value="DATETIME" />
                    <el-option label="DECIMAL(10,2)" value="DECIMAL(10,2)" />
                    <el-option label="BOOLEAN / TINYINT(1)" value="TINYINT(1)" />
                  </el-option-group>
                  <el-option-group label="其他类型">
                    <el-option label="BIGINT" value="BIGINT" />
                    <el-option label="FLOAT" value="FLOAT" />
                    <el-option label="DOUBLE" value="DOUBLE" />
                    <el-option label="DATE" value="DATE" />
                    <el-option label="TIMESTAMP" value="TIMESTAMP" />
                    <el-option label="JSON" value="JSON" />
                  </el-option-group>
                </el-select>
                
                <el-checkbox v-model="col.pk" @change="(val) => onPkChange(index)" style="width:50px;">主键</el-checkbox>
                <el-checkbox v-model="col.notNull" style="width:60px;">非空</el-checkbox>
                <el-checkbox v-model="col.autoInc" @change="(val) => onAutoIncChange(val, index)" :disabled="!isIntegerType(col.type)" style="width:65px;">自增</el-checkbox>
                <el-input
                  v-model="col.defaultVal"
                  placeholder="默认值"
                  size="default"
                  style="width:110px;"
                  clearable
                  :disabled="col.autoInc"
                />
                
                <el-button
                  type="danger"
                  size="default"
                  text
                  @click="removeColumn(index)"
                  :disabled="newTableForm.columns.length <= 1"
                  style="width:36px;padding:0;"
                >
                  ✕
                </el-button>
              </div>
              
              <el-button type="primary" plain size="small" @click="addColumn" style="width:100%;margin-top:8px;">
                <el-icon><Plus /></el-icon> 添加列
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item label="表注释">
            <el-input v-model="newTableForm.comment" placeholder="可选的表注释" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showCreateTableDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTable" :loading="creatingTable">
          创建表
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Coin, Document, EditPen, Refresh, Loading, Plus, FolderAdd } from '@element-plus/icons-vue'
import type MysqlShell from '@/utils/mysqlTerminal'
import type { MysqlMessage } from '@/utils/mysqlTerminal'
import TableView from './TableView.vue'
import SQLEditor from './SQLEditor.vue'

const props = defineProps<{
  mysqlShell: MysqlShell
}>()

interface TreeNode {
  id: string
  label: string
  type: 'database' | 'table'
  database?: string
  table?: string
  rowCount?: number
  leaf?: boolean
  children?: TreeNode[]
}

interface ColumnDef {
  name: string
  type: string
  pk: boolean
  notNull: boolean
  autoInc: boolean
  defaultVal: string
}

const treeRef = ref()
const tableViewRef = ref()
const databaseTree = ref<TreeNode[]>([])
const loadingTree = ref(false)
const connected = ref(false)
const showSqlDialog = ref(false)
const loadingData = ref(false)

// 右键菜单状态
const contextMenuNodeData = ref<TreeNode | null>(null)
const contextMenuVisible = ref(false)
const contextMenuPos = reactive({ x: 0, y: 0 })

// 新建数据库
const showCreateDbDialog = ref(false)
const creatingDb = ref(false)
const newDbForm = reactive({
  name: '',
  charset: 'utf8mb4',
  collation: 'utf8mb4_general_ci'
})

// 新建表
const showCreateTableDialog = ref(false)
const creatingTable = ref(false)
const createTableTargetDb = ref('')
const newTableForm = reactive({
  name: '',
  comment: '',
  columns: [
    { name: 'id', type: 'INT', pk: true, notNull: true, autoInc: true, defaultVal: '' },
    { name: '', type: 'VARCHAR(255)', pk: false, notNull: false, autoInc: false, defaultVal: '' }
  ]
})

const pendingTableLoads = new Map<string, string[]>()

const viewMode = ref<'none' | 'table'>('none')
const currentDatabase = ref('')
const currentTable = ref('')
const tableColumns = ref<string[]>([])
const tableColumnTypes = ref<Record<string, { type: string; data_type: string; nullable: boolean; is_key: boolean }>>({})
const tableRows = ref<any[]>([])
const pagination = ref({
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 0
})

const defaultProps = {
  children: 'children',
  label: 'label',
  isLeaf: (data: TreeNode) => data.type === 'table'
}

// 如果 shell 实例被替换（例如在重连时），重新绑定回调
import { watch } from 'vue'
function bindShellEvents(shell: MysqlShell) {
  // 保存 TerminalView 设置的 onStatusChange 回调，链式调用
  const originalOnStatusChange = shell.onStatusChange
  shell.onStatusChange = () => {
    // 先调用原有回调（更新Tab状态）
    if (originalOnStatusChange) originalOnStatusChange()
    // 再执行 Workspace 内部逻辑
    checkConnectionStatus()
  }
  shell.onData = handleMessage
  checkConnectionStatus()
}

onMounted(() => {
  bindShellEvents(props.mysqlShell)
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  // 不清理 shell.onStatusChange（保留 TerminalView 的 Tab 状态更新回调）
  // 只清理数据回调
  if (props.mysqlShell) {
    props.mysqlShell.onData = undefined
  }
  document.removeEventListener('click', handleGlobalClick)
})

watch(() => props.mysqlShell, (newShell, oldShell) => {
  try {
    if (oldShell) {
      oldShell.onStatusChange = undefined
      oldShell.onData = undefined
    }
  } catch (e) {}
  if (newShell) {
    // 重置所有状态
    connected.value = false
    databaseTree.value = []
    viewMode.value = 'none'
    currentDatabase.value = ''
    currentTable.value = ''
    tableColumns.value = []
    tableRows.value = []
    
    bindShellEvents(newShell)
  }
})

function checkConnectionStatus() {
  const status = props.mysqlShell.getStatus()
  connected.value = status === 'connected'
  if (connected.value) {
    refreshDatabases()
  }
}

function handleStatusChange() {
  checkConnectionStatus()
}

function handleMessage(message: MysqlMessage) {
  console.log('[MySQLWorkspace] 收到消息:', message.type, message)

  switch (message.type) {
    case 'databases':
      handleDatabasesResponse(message.data)
      break
    case 'tables':
      handleTablesResponse(message.data, message.database)
      break
    case 'table_data':
      handleTableDataResponse(message.data)
      break
    case 'query_result':
      handleQueryResultResponse(message.data)
      break
    case 'write_result':
      handleWriteResultResponse(message.data)
      break
    case 'error':
      ElMessage.error(`操作错误: ${message.data}`)
      break
  }
}

function handleDatabasesResponse(databases: string[]) {
  databaseTree.value = databases.map(db => ({
    id: `db_${db}`,
    label: db,
    type: 'database' as const,
    database: db,
    children: [] as TreeNode[]
  }))
  loadingTree.value = false
  
  if (!databases.length) {
    ElMessage.warning('没有可访问的数据库')
  }
}

function handleTablesResponse(tables: string[], database: string) {
  const targetDb = databaseTree.value.find(node => node.database === database)
  if (targetDb) {
    targetDb.children = tables.map(table => ({
      id: `${database}.${table}`,
      label: table,
      type: 'table' as const,
      database: database,
      table: table,
      leaf: true
    }))
    
    pendingTableLoads.set(database, tables)
    
    if (treeRef.value) {
      try {
        treeRef.value.updateKeyChildren(targetDb.id, targetDb.children)
      } catch (e) {}
    }
  }
}

function handleTableDataResponse(data: any) {
  currentDatabase.value = data.database
  currentTable.value = data.table
  tableColumns.value = data.columns || []
  tableColumnTypes.value = data.column_types || {}
  tableRows.value = data.rows || []
  pagination.value = data.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 0 }
  viewMode.value = 'table'
  loadingData.value = false
}

function handleQueryResultResponse(data: any) {
  if (data.columns && data.rows) {
    currentTable.value = '(查询结果)'
    currentDatabase.value = ''
    tableColumns.value = data.columns
    tableRows.value = data.rows
    pagination.value = {
      page: 1,
      pageSize: Math.min(data.total || data.rows.length, 200),
      total: data.total || data.rows.length,
      totalPages: 1
    }
    viewMode.value = 'table'
    showSqlDialog.value = false
    
    if (data.truncated) {
      ElMessage.warning(`结果集过大，仅显示前200行（共${data.total}行）`)
    }
  }
}

function handleWriteResultResponse(data: any) {
  if (data.success !== false) {
    ElMessage.success(`操作成功！影响 ${data.affected_rows} 行`)
    // 刷新相关数据
    if (currentTable.value && currentTable.value !== '(查询结果)') {
      loadTableData(currentDatabase.value, currentTable.value)
    }
    // 如果刚创建了库或表，刷新数据库列表
    refreshDatabases()
  } else {
    ElMessage.error('操作失败')
  }
}

function handleSqlExecuted(result: any) {}

// ========== 懒加载 ==========
function loadNodeChildren(node: any, resolve: Function) {
  if (node.data.type === 'database') {
    const db = node.data.database
    
    const cached = pendingTableLoads.get(db)
    if (cached && cached.length > 0) {
      const children = cached.map(table => ({
        id: `${db}.${table}`,
        label: table,
        type: 'table' as const,
        database: db,
        table: table,
        leaf: true
      }))
      resolve(children)
      return
    }
    
    props.mysqlShell.getTables(db)
    
    let attempts = 0
    const maxAttempts = 50
    const poll = setInterval(() => {
      attempts++
      const result = pendingTableLoads.get(db)
      if (result && result.length > 0) {
        clearInterval(poll)
        const children = result.map(table => ({
          id: `${db}.${table}`,
          label: table,
          type: 'table' as const,
          database: db,
          table: table,
          leaf: true
        }))
        resolve(children)
      } else if (attempts >= maxAttempts) {
        clearInterval(poll)
        resolve([])
      }
    }, 100)
  } else {
    resolve([])
  }
}

// ========== 树节点事件 ==========
function handleNodeClick(data: TreeNode) {
  if (data.type === 'table') {
    // 切换表前清除pending状态
    tableViewRef.value?.clearAllPending()
    currentDatabase.value = data.database
    currentTable.value = data.table
    if (connected.value) {
      loadTableData(data.database, data.table)
    }
  }
}

function handleNodeDblClick(data: TreeNode) {
  if (data.type === 'table' && connected.value) {
    // 切换表前清除pending状态
    tableViewRef.value?.clearAllPending()
    loadTableData(data.database, data.table)
  }
}

function showContextMenu(event: MouseEvent, data: any) {
  contextMenuNodeData.value = data
  contextMenuPos.x = event.clientX
  contextMenuPos.y = event.clientY
  contextMenuVisible.value = true
}

function hideContextMenu() {
  contextMenuVisible.value = false
  contextMenuNodeData.value = null
}

function handleGlobalClick() {
  if (contextMenuVisible.value) {
    hideContextMenu()
  }
}

function handleContextMenuCommand(command: string) {
  const node = contextMenuNodeData.value
  hideContextMenu()
  if (command === 'create_table' && node?.type === 'database') {
    openCreateTableDialog(node.database)
  } else if (command === 'delete_table' && node?.type === 'table') {
    handleDeleteTable(node)
  } else if (command === 'truncate_table' && node?.type === 'table') {
    handleTruncateTable(node)
  }
}

// ========== 删除表 ==========
function handleDeleteTable(nodeData: TreeNode) {
  const db = nodeData.database
  const tbl = nodeData.table

  ElMessageBox.confirm(
    `确定要删除表 \`${db}\`.\`${tbl}\` 吗？此操作将<strong>永久删除</strong>该表及其所有数据，不可恢复！`,
    '⚠️ 删除表确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'error', dangerouslyUseHTMLString: true }
  ).then(() => {
    const sql = `DROP TABLE \`${db}\`.\`${tbl}\``
    console.log('[MySQLWorkspace] DROP TABLE:', sql)
    props.mysqlShell.executeWrite(sql)

    // 如果当前正在查看被删除的表，清空视图
    if (currentDatabase.value === db && currentTable.value === tbl) {
      viewMode.value = 'none'
      currentDatabase.value = ''
      currentTable.value = ''
      tableViewRef.value?.clearAllPending()
    }

    ElMessage.info('删除表请求已发送')
  }).catch(() => {})
}

// ========== 清空表数据 ==========
function handleTruncateTable(nodeData: TreeNode) {
  const db = nodeData.database
  const tbl = nodeData.table

  ElMessageBox.confirm(
    `确定要清空表 \`${db}\`.\`${tbl}\` 的所有数据吗？此操作将删除表中所有行，不可恢复！`,
    '⚠️ 清空数据确认',
    { confirmButtonText: '确认清空', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
  ).then(() => {
    const sql = `TRUNCATE TABLE \`${db}\`.\`${tbl}\``
    console.log('[MySQLWorkspace] TRUNCATE TABLE:', sql)
    props.mysqlShell.executeWrite(sql)

    // 如果当前正在查看被清空的表，刷新数据
    if (currentDatabase.value === db && currentTable.value === tbl) {
      loadTableData(db, tbl)
    }

    ElMessage.info('清空数据请求已发送')
  }).catch(() => {})
}

// ========== 清除pending状态(由TableView撤销触发)==========
function handleClearPending() {
  // TableView已经自行清除内部状态，这里可以做额外的父级清理
  console.log('[MySQLWorkspace] 收到clear-pending事件')
}

// ========== 分页/加载 ==========
function loadTableData(database: string, table: string, page: number = 1) {
  loadingData.value = true
  viewMode.value = 'table'
  
  props.mysqlShell.getTableData(database, table, page, pagination.value.pageSize)
}

function handlePageChange(page: number) {
  if (currentDatabase.value && currentTable.value) {
    loadTableData(currentDatabase.value, currentTable.value, page)
  }
}

function refreshDatabases() {
  loadingTree.value = true
  props.mysqlShell.getDatabases()
}

// ========== 事务式提交（批量执行所有待提交变更）==========
function handleSubmitChanges(payload: any) {
  if (!currentDatabase.value || !currentTable.value) {
    ElMessage.error('请先选择一个表')
    return
  }

  const db = payload.database || currentDatabase.value
  const tbl = payload.table || currentTable.value
  const pkCol = payload.primaryKeyColumn || 'id'
  const sqls: string[] = []

  // 1. INSERT 新增行
  for (const row of payload.newRows || []) {
    const cols = Object.keys(row).filter(c => row[c] !== null && row[c] !== undefined)
    if (cols.length === 0) continue
    const escapedCols = cols.map(c => `\`${c}\``).join(', ')
    const escapedVals = cols.map(c => {
      const v = row[c]
      if (v === null || v === undefined) return 'NULL'
      if (typeof v === 'number') return String(v)
      return `'${String(v).replace(/'/g, "\\'")}'`
    }).join(', ')
    sqls.push(`INSERT INTO \`${db}\`.\`${tbl}\` (${escapedCols}) VALUES (${escapedVals})`)
  }

  // 2. UPDATE 已修改行
  for (const [key, change] of payload.modifiedRows?.entries() || []) {
    const sets: string[] = []
    for (const col of tableColumns.value) {
      if (change.original[col] !== change.current[col]) {
        const v = change.current[col]
        if (v === null || v === undefined) {
          sets.push(`\`${col}\` = NULL`)
        } else if (typeof v === 'number') {
          sets.push(`\`${col}\` = ${v}`)
        } else {
          sets.push(`\`${col}\` = '${String(v).replace(/'/g, "\\'")}'`)
        }
      }
    }
    if (sets.length > 0) {
      const pkVal = change.original[pkCol]
      const pkStr = typeof pkVal === 'number' ? String(pkVal) : `'${String(pkVal).replace(/'/g, "\\'")}'`
      sqls.push(`UPDATE \`${db}\`.\`${tbl}\` SET ${sets.join(', ')} WHERE \`${pkCol}\` = ${pkStr} LIMIT 1`)
    }
  }

  // 3. DELETE 标记删除的行
  for (const key of payload.deletedKeys || []) {
    const originalRow = props.mysqlShell.getOriginalRow?.(key)
    if (!originalRow) continue
    const conditions: string[] = []
    for (const col of tableColumns.value.slice(0, 3)) {
      const v = originalRow[col]
      if (v !== null && v !== undefined) {
        if (typeof v === 'number') {
          conditions.push(`\`${col}\` = ${v}`)
        } else {
          conditions.push(`\`${col}\` = '${String(v).replace(/'/g, "\\'")}'`)
        }
      }
    }
    if (conditions.length > 0) {
      sqls.push(`DELETE FROM \`${db}\`.\`${tbl}\` WHERE ${conditions.join(' AND ')} LIMIT 1`)
    }
  }

  if (sqls.length === 0) {
    ElMessage.warning('没有需要提交的更改')
    return
  }

  console.log(`[MySQLWorkspace] 批量提交 ${sqls.length} 条SQL`)
  
  // 逐条发送SQL（后端会逐条返回write_result）
  for (const sql of sqls) {
    props.mysqlShell.executeWrite(sql)
  }

  ElMessage.success(`已提交 ${sqls.length} 条更改到数据库，等待响应...`)
}

// ========== 刷新表格数据 ==========
function handleRefreshTable() {
  if (currentDatabase.value && currentTable.value) {
    loadTableData(currentDatabase.value, currentTable.value)
  }
}

// ========== 创建数据库 ==========
function handleCreateDatabase() {
  const name = newDbForm.name.trim()
  if (!name) {
    ElMessage.warning('请输入数据库名称')
    return
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    ElMessage.error('数据库名不合法：只能包含字母、数字、下划线，且不能以数字开头')
    return
  }

  creatingDb.value = true
  const charset = newDbForm.charset || 'utf8mb4'
  const collation = newDbForm.collation || 'utf8mb4_general_ci'
  const sql = `CREATE DATABASE \`${name}\` CHARACTER SET \`${charset}\` COLLATE \`${collation}\``
  
  console.log('[MySQLWorkspace] CREATE DATABASE:', sql)
  props.mysqlShell.executeWrite(sql)
  
  creatingDb.value = false
  showCreateDbDialog.value = false
  newDbForm.name = ''
  ElMessage.info('数据库创建请求已发送，列表将自动刷新')
}

// ========== 创建表 ==========
function openCreateTableDialog(database: string) {
  createTableTargetDb.value = database
  newTableForm.name = ''
  newTableForm.comment = ''
  newTableForm.columns = [
    { name: 'id', type: 'INT', pk: true, notNull: true, autoInc: true, defaultVal: '' },
    { name: '', type: 'VARCHAR(255)', pk: false, notNull: false, autoInc: false, defaultVal: '' }
  ]
  showCreateTableDialog.value = true
}

function addColumn() {
  newTableForm.columns.push({
    name: '',
    type: 'VARCHAR(255)',
    pk: false,
    notNull: false,
    autoInc: false,
    defaultVal: ''
  })
}

function removeColumn(index: number) {
  if (newTableForm.columns.length > 1) {
    newTableForm.columns.splice(index, 1)
  }
}

function handleCreateTable() {
  const tableName = newTableForm.name.trim()
  if (!tableName) {
    ElMessage.warning('请输入表名')
    return
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(tableName)) {
    ElMessage.error('表名不合法：只能包含字母、数字、下划线，且不能以数字开头')
    return
  }

  const validCols = newTableForm.columns.filter(c => c.name.trim())
  if (validCols.length === 0) {
    ElMessage.warning('至少需要一列')
    return
  }

  const pkCols = validCols.filter(c => c.pk)
  // 要求且仅允许一个主键列（简化约束，便于数据编辑）
  if (pkCols.length !== 1) {
    ElMessage.error('请且只能选择一个主键列（主键列将用于唯一标识）')
    return
  }

  // 自增列校验
  const autoIncCols = validCols.filter(c => c.autoInc)
  if (autoIncCols.length > 1) {
    ElMessage.error('只允许一个自增列')
    return
  }
  if (autoIncCols.length === 1 && !isIntegerType(autoIncCols[0].type)) {
    ElMessage.error('自增列必须为整数类型（INT/BIGINT/TINYINT）')
    return
  }
  
  const colDefs = validCols.map(col => {
    let def = `\`${col.name.trim()}\` ${col.type}`
    if (col.autoInc) def += ' AUTO_INCREMENT'
    if (col.notNull || col.pk) def += ' NOT NULL'
    if (!col.autoInc && col.defaultVal !== '' && col.defaultVal !== null && col.defaultVal !== undefined) {
      def += ` DEFAULT '${col.defaultVal.replace(/'/g, "\\'")}'`
    }
    return def
  })

  if (pkCols.length > 0) {
    const pkNames = pkCols.map(c => `\`${c.name.trim()}\``).join(', ')
    colDefs.push(`PRIMARY KEY (${pkNames})`)
  }

  const commentPart = newTableForm.comment ? ` COMMENT '${newTableForm.comment.replace(/'/g, "\\'")}'` : ''

  const sql = `CREATE TABLE \`${createTableTargetDb.value}\`.\`${tableName}\` (\n  ${colDefs.join(',\n  ')}\n)${commentPart}`

  console.log('[MySQLWorkspace] CREATE TABLE:', sql)
  
  creatingTable.value = true
  
  props.mysqlShell.executeWrite(sql)
  
  creatingTable.value = false
  showCreateTableDialog.value = false
  ElMessage.success('表创建请求已发送，列表将自动刷新')
}

// ======= 表单控件与校验辅助函数 =======
function isIntegerType(type: string) {
  return /^(INT|BIGINT|TINYINT)/i.test((type || '').trim())
}

function onTypeChange(val: string, index: number) {
  const col = newTableForm.columns[index]
  col.type = val
  if (!isIntegerType(val) && col.autoInc) {
    // 禁止非整数字段自增
    ElMessage.warning('自增仅支持整数类型，已取消自增设置')
    col.autoInc = false
  }
}

function onPkChange(index: number) {
  const col = newTableForm.columns[index]
  if (col.pk) {
    newTableForm.columns.forEach((c, i) => {
      c.pk = (i === index)
      if (c.pk) c.notNull = true
    })
  }
}

function onAutoIncChange(val: boolean, index: number) {
  const col = newTableForm.columns[index]
  if (val) {
    if (!isIntegerType(col.type)) {
      ElMessage.error('自增只能用于整数类型（INT/BIGINT/TINYINT）')
      col.autoInc = false
      return
    }
    newTableForm.columns.forEach((c, i) => { if (i !== index) c.autoInc = false })
    col.pk = true
    col.notNull = true
  }
}
</script>

<style scoped lang="scss">
.mysql-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;

  .toolbar {
    padding: 8px 12px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    .connection-info {
      margin-left: auto;
    }
  }

  .content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .tree-panel {
    width: 240px;
    min-width: 200px;
    max-width: 320px;
    border-right: 1px solid #e4e7ed;
    overflow-y: auto;
    padding: 8px;
    flex-shrink: 0;

    .tree-header {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      padding: 6px 0;
      border-bottom: 1px solid #ebeef5;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }

    .tree-wrapper {
      position: relative;
    }

    .tree-node {
      display: flex;
      align-items: center;
      font-size: 13px;
      cursor: pointer;

      &:hover {
        color: #409eff;
      }
    }

    .empty-hint {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #909399;
      font-size: 12px;
    }
  }

  .data-panel {
    flex: 1;
    overflow: auto;
    position: relative;

    .empty-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #909399;

      .hint-text {
        margin-top: 16px;
        font-size: 13px;
        color: #c0c4cc;
      }
    }
  }
}

.custom-context-menu {
  position: fixed;
  z-index: 3000;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;

  .context-menu-item {
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #303133;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f7fa;
      color: #409eff;
    }

    &.danger {
      &:hover {
        background-color: #fef0f0;
        color: #f56c6c;
      }
    }

    &.warning {
      &:hover {
        background-color: #fdf6ec;
        color: #e6a23c;
      }
    }
  }
}

.form-tip {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

.create-table-form {
  .columns-editor {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 10px;
    max-height: 300px;
    overflow-y: auto;

    .column-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 0;
      border-bottom: 1px dashed #ebeef5;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
}
</style>
