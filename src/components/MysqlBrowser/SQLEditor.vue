<template>
  <div class="sql-editor">
    <!-- SQL 输入区 -->
    <div class="editor-area">
      <el-input
        v-model="sqlText"
        type="textarea"
        :rows="8"
        placeholder="请输入SQL语句，例如：
SELECT * FROM users WHERE id > 100
LIMIT 50;"
        resize="vertical"
      />
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <el-button 
        type="primary" 
        @click="executeSql"
        :loading="executing"
        :disabled="!sqlText.trim()"
      >
        <el-icon><VideoPlay /></el-icon>
        执行 (Ctrl+Enter)
      </el-button>
      
      <el-button @click="clearSql">
        清空
      </el-button>
      
      <div class="history-toggle">
        <el-dropdown @command="loadFromHistory">
          <el-button size="small" text>
            历史记录
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu v-if="historyList.length > 0">
              <el-dropdown-item 
                v-for="(item, index) in historyList" 
                :key="index"
                :command="index"
              >
                {{ item.sql.substring(0, 60) }}{{ item.sql.length > 60 ? '...' : '' }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 执行结果提示 -->
    <div v-if="lastResult" class="result-info" :class="lastResult.success ? 'success' : 'error'">
      <span v-if="lastResult.success">
        ✅ 查询成功！返回 {{ lastResult.rowCount || lastResult.total }} 行，耗时 {{ lastResult.executionTime }}ms
      </span>
      <span v-else>
        ❌ 执行失败: {{ lastResult.error }}
      </span>
    </div>

    <!-- 快捷操作提示 -->
    <div class="tips">
      <p>💡 提示：</p>
      <ul>
        <li>按 Ctrl+Enter 快速执行</li>
        <li>支持 SELECT / INSERT / UPDATE / DELETE 语句</li>
        <li>查询结果将显示在右侧数据面板中</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, ArrowDown } from '@element-plus/icons-vue'
import type MysqlShell from '@/utils/mysqlTerminal'

const props = defineProps<{
  mysqlShell: MysqlShell
}>()

const emit = defineEmits<{
  'executed': [result: any]
}>()

const sqlText = ref('')
const executing = ref(false)
const historyList = ref<{ sql: string; time: Date }[]>([])
const lastResult = ref<{
  success?: boolean
  rowCount?: number
  total?: number
  executionTime?: number
  error?: string
} | null>(null)

onMounted(() => {
  // 注册键盘快捷键
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Enter 执行SQL
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    executeSql()
  }
}

/**
 * 执行SQL
 */
async function executeSql() {
  const sql = sqlText.value.trim()
  if (!sql) {
    ElMessage.warning('请输入SQL语句')
    return
  }

  // 简单的SQL安全检查（前端预检）
  if (isDangerousSql(sql)) {
    const confirmed = await confirmDangerousOperation(sql)
    if (!confirmed) return
  }

  executing.value = true
  lastResult.value = null

  try {
    const startTime = Date.now()
    
    // 判断是查询还是写操作
    const upperSql = sql.trim().toUpperCase()
    if (upperSql.startsWith('SELECT') || upperSql.startsWith('SHOW') || upperSql.startsWith('DESCRIBE') || upperSql.startsWith('EXPLAIN')) {
      props.mysqlShell.executeQuery(sql)
    } else {
      props.mysqlShell.executeWrite(sql)
    }
    
    // 结果会在 MySQLWorkspace 的 handleMessage 中处理
    // 这里我们暂时设置一个乐观结果，实际结果由父组件更新
    
    // 记录历史
    historyList.value.unshift({
      sql: sql,
      time: new Date()
    })
    
    // 只保留最近20条历史
    if (historyList.value.length > 20) {
      historyList.value = historyList.value.slice(0, 20)
    }
    
    emit('executed', { sql })
    
  } catch (error: any) {
    lastResult.value = {
      success: false,
      error: error.message || String(error)
    }
    ElMessage.error(`SQL执行错误: ${error.message}`)
  } finally {
    executing.value = false
  }
}

/**
 * 危险SQL检测
 */
function isDangerousSql(sql: string): boolean {
  const upperSql = sql.trim().toUpperCase()
  
  const dangerousPatterns = [
    /^DROP\s+(DATABASE|TABLE|INDEX)\s+/i,
    /^TRUNCATE\s+TABLE\s+/i,
    /^DELETE\s+FROM\s+\w+\s*$/i,  // DELETE 无 WHERE 条件
    /^UPDATE\s+\w+\s+SET\s+/i,     // UPDATE 需要检查是否有WHERE
  ]
  
  return dangerousPatterns.some(pattern => pattern.test(upperSql))
}

/**
 * 确认危险操作
 */
async function confirmDangerousOperation(sql: string): Promise<boolean> {
  try {
    const ElMessageBoxModule = await import('element-plus')
    const { ElMessageBox } = ElMessageBoxModule.default || ElMessageBoxModule
    
    await ElMessageBox.confirm(
      `⚠️ 检测到可能危险的SQL操作：\n\n${sql}\n\n确定要继续执行吗？`,
      '安全警告',
      {
        confirmButtonText: '确定执行',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    return true
  } catch {
    return false
  }
}

/**
 * 清空SQL
 */
function clearSql() {
  sqlText.value = ''
  lastResult.value = null
}

/**
 * 从历史加载
 */
function loadFromHistory(index: number) {
  const item = historyList.value[index]
  if (item) {
    sqlText.value = item.sql
  }
}
</script>

<style scoped lang="scss">
.sql-editor {
  padding: 12px;

  .editor-area {
    margin-bottom: 12px;

    :deep(.el-textarea__inner) {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .history-toggle {
      margin-left: auto;
    }
  }

  .result-info {
    padding: 10px 12px;
    border-radius: 4px;
    margin-bottom: 12px;
    font-size: 13px;
    animation: fadeIn 0.3s ease;

    &.success {
      background-color: #f0f9eb;
      border: 1px solid #e1f3d8;
      color: #67c23a;
    }

    &.error {
      background-color: #fef0f0;
      border: 1px solid #fde2e2;
      color: #f56c6c;
    }
  }

  .tips {
    padding: 12px;
    background: #fafafa;
    border-radius: 4px;
    font-size: 12px;
    color: #909399;

    p {
      margin: 0 0 6px 0;
      font-weight: 600;
    }

    ul {
      margin: 0;
      padding-left: 18px;

      li {
        margin: 2px 0;
        line-height: 1.5;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
