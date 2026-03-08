import requests from '@/requests'

/**
 * Guacamole数据格式测试工具
 * 用于检查后端传回的数据是否为有效的Guacamole协议数据
 */
export class GuacamoleDataTester {
  private ws: WebSocket | null = null
  private messageCount: number = 0
  private startTime: number = 0

  /**
   * 测试后端数据格式
   */
  public async testBackendDataFormat(resource: number, voucher: number, token: string) {
    console.log('=== 开始测试后端数据格式 ===')
    this.messageCount = 0
    this.startTime = Date.now()
    
    try {
      // 构建WebSocket连接URL
      const params = new URLSearchParams()
      params.append('token', token)
      params.append('resource_id', String(resource))
      params.append('voucher_id', String(voucher))
      params.append('resolution', '1024x768')
      params.append('color_depth', '16')
      params.append('enable_clipboard', 'true')

      const wsUrl = requests.getWsBaseUrl() + `/terminal/rdp/?${params.toString()}`
      console.log('WebSocket URL:', wsUrl)
      
      // 创建WebSocket连接
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket连接已建立')
        console.log('开始接收后端数据...')
      }
      
      this.ws.onmessage = (event) => {
        this.messageCount++
        const elapsedTime = Date.now() - this.startTime
        
        console.log(`\n📡 收到消息 #${this.messageCount} (${elapsedTime}ms):`)
        console.log('原始数据长度:', event.data.length)
        console.log('原始数据:', event.data)
        
        // 分析Guacamole协议数据
        this.analyzeGuacamoleData(event.data)
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket错误:', error)
      }
      
      this.ws.onclose = (event) => {
        console.log('\n🔚 WebSocket连接关闭:', event.code, event.reason)
        console.log(`总共接收了 ${this.messageCount} 条消息`)
      }
      
      // 30秒后关闭连接
      setTimeout(() => {
        console.log('\n⏰ 30秒后关闭WebSocket连接')
        if (this.ws) {
          this.ws.close()
          this.ws = null
        }
      }, 30000)
      
    } catch (error) {
      console.error('❌ 测试后端数据格式失败:', error)
    }
  }

  /**
   * 分析Guacamole协议数据
   */
  private analyzeGuacamoleData(data: string) {
    try {
      // Guacamole协议格式: 指令长度+指令+参数长度+参数+...
      console.log('🔍 分析Guacamole协议数据:')
      
      let position = 0
      while (position < data.length) {
        // 读取指令长度
        const lengthEnd = data.indexOf('.', position)
        if (lengthEnd === -1) {
          console.log('⚠️  无效的Guacamole数据格式: 缺少长度分隔符')
          break
        }
        
        const lengthStr = data.substring(position, lengthEnd)
        const length = parseInt(lengthStr)
        if (isNaN(length)) {
          console.log('⚠️  无效的Guacamole数据格式: 长度不是数字')
          break
        }
        
        position = lengthEnd + 1
        
        // 读取指令或参数
        if (position + length > data.length) {
          console.log('⚠️  无效的Guacamole数据格式: 数据长度不足')
          break
        }
        
        const content = data.substring(position, position + length)
        console.log(`  - 内容: "${content}" (长度: ${length})`)
        
        position += length
      }
      
      console.log('✅ Guacamole数据格式分析完成')
      
    } catch (error) {
      console.error('❌ 分析Guacamole数据时出错:', error)
    }
  }

  /**
   * 清理资源
   */
  public cleanup() {
    if (this.ws) {
      try {
        this.ws.close()
      } catch (error) {
        console.error('关闭WebSocket连接失败:', error)
      }
      this.ws = null
    }
  }
}

/**
 * 创建Guacamole数据测试实例
 */
export const createGuacamoleDataTester = () => {
  return new GuacamoleDataTester()
}

/**
 * 快速测试后端数据格式
 */
export const testBackendData = (resource: number, voucher: number, token: string) => {
  const tester = new GuacamoleDataTester()
  tester.testBackendDataFormat(resource, voucher, token)
  return tester
}
