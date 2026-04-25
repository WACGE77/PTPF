import requests from '@/requests'
import type { Ref } from 'vue'

export interface MysqlMessage {
  type: 'databases' | 'tables' | 'columns' | 'query_result' | 'table_data' | 'write_result' | 'error'
  data: any
  database?: string
  table?: string
}

export class MySQLShell {
  private websocket: WebSocket | null = null
  private container: HTMLElement | null = null
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private lock: boolean = false
  private errorMessage: string = ''
  public onStatusChange?: () => void
  public onData?: (data: MysqlMessage) => void
  public cleanup?: () => void

  constructor() {}

  private updateStatus(newStatus: 'disconnected' | 'connecting' | 'connected' | 'error', msg?: string) {
    this.status = newStatus
    if (msg) this.errorMessage = msg
    if (this.onStatusChange) {
      this.onStatusChange()
    }
  }

  public getStatus() {
    return this.status
  }

  public getErrorMessage() {
    return this.errorMessage
  }

  public async connect(resource: number, voucher: number, token: string) {
    if (this.status !== 'disconnected' && this.status !== 'error' && !this.lock) {
      return
    }
    
    this.lock = true
    this.updateStatus('connecting')

    const params = new URLSearchParams()
    params.append('token', token)
    params.append('resource_id', String(resource))
    params.append('voucher_id', String(voucher))

    const wsUrl = requests.getWsBaseUrl() + `/terminal/mysql/?${params.toString()}`
    
    console.log('[MySQL] 正在连接:', wsUrl)
    
    this.websocket = new WebSocket(wsUrl)

    this.websocket.onopen = () => {
      console.log('[MySQL] ✅ WebSocket 连接成功')
      this.errorMessage = ''
      this.updateStatus('connected')
      
      // 自动请求数据库列表
      this.send({ action: 'get_databases' })
      
      this.lock = false
    }

    this.websocket.onmessage = (event: MessageEvent) => {
      try {
        const message: MysqlMessage = JSON.parse(event.data)
        if (this.onData) {
          this.onData(message)
        }
      } catch (e) {
        console.error('[MySQL] 消息解析错误:', e, event.data)
      }
    }

    this.websocket.onerror = (error: Event) => {
      const msg = 'WebSocket连接错误'
      console.error('[MySQL] ❌ ' + msg, error)
      this.updateStatus('error', msg)
      this.lock = false
    }

    this.websocket.onclose = (event: CloseEvent) => {
      let msg = `连接已关闭 (code: ${event.code})`
      if (event.reason) msg += ` - ${event.reason}`
      console.log('[MySQL] ' + msg)
      this.updateStatus('disconnected', msg)
      this.lock = false
    }
  }

  /**
   * 发送指令到后端
   */
  public send(data: Record<string, any>) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data)
      this.websocket.send(message)
      return true
    }
    console.warn('[MySQL] WebSocket 未连接，无法发送消息')
    return false
  }

  /**
   * 获取数据库列表
   */
  public getDatabases() {
    return this.send({ action: 'get_databases' })
  }

  /**
   * 获取指定数据库的表列表
   */
  public getTables(database: string) {
    return this.send({ action: 'get_tables', database })
  }

  /**
   * 获取表的列信息
   */
  public getTableColumns(database: string, table: string) {
    return this.send({ action: 'get_table_columns', database, table })
  }

  /**
   * 执行SQL查询
   */
  public executeQuery(sql: string) {
    return this.send({ action: 'query', sql })
  }

  /**
   * 获取表数据（分页）
   */
  public getTableData(database: string, table: string, page: number = 1, pageSize: number = 50) {
    return this.send({
      action: 'get_table_data',
      database,
      table,
      page,
      page_size: pageSize
    })
  }

  /**
   * 执行写操作
   */
  public executeWrite(sql: string) {
    return this.send({ action: 'execute_write', sql })
  }

  /**
   * 挂载到DOM容器
   */
  public mount(containerEl: HTMLElement) {
    this.container = containerEl
    
    const resizeHandler = () => {
      if (this.container) {
      }
    }

    window.addEventListener('resize', resizeHandler)

    this.cleanup = () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }

  /**
   * 关闭连接
   */
  public close() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    if (this.cleanup) {
      this.cleanup()
    }
  }
}

export default MySQLShell
