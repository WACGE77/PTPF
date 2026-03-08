import Guacamole from 'guacamole-common-js'
import requests from '@/requests'

/**
 * RDP调试工具
 * 用于详细测试RDP连接和数据格式
 */
export class RdpDebugger {
  private ws: WebSocket | null = null
  private client: Guacamole.Client | null = null
  private tunnel: Guacamole.WebSocketTunnel | null = null
  private container: HTMLElement | null = null
  private cleanupFunctions: (() => void)[] = []

  /**
   * 测试WebSocket连接并记录详细数据
   */
  public async testWebSocketConnection(resource: number, voucher: number, token: string) {
    console.log('=== 开始WebSocket连接测试 ===')
    
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
      }
      
      this.ws.onmessage = (event) => {
        console.log('📡 收到消息:')
        console.log('原始数据长度:', event.data.length)
        console.log('原始数据:', event.data)
        
        // 尝试解析消息格式
        try {
          // 检查是否为JSON格式
          if (event.data.startsWith('{')) {
            const data = JSON.parse(event.data)
            console.log('🔍 解析后的JSON消息:', data)
          } else {
            // 检查是否为Guacamole协议格式
            console.log('🔍 可能是Guacamole协议数据')
            console.log('数据前100字符:', event.data.substring(0, 100) + '...')
          }
        } catch (e) {
          console.log('⚠️  消息不是JSON格式')
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket错误:', error)
      }
      
      this.ws.onclose = (event) => {
        console.log('🔚 WebSocket连接关闭:', event.code, event.reason)
      }
      
      // 10秒后关闭连接
      setTimeout(() => {
        console.log('⏰ 关闭WebSocket连接')
        if (this.ws) {
          this.ws.close()
          this.ws = null
        }
      }, 10000)
      
    } catch (error) {
      console.error('❌ 测试WebSocket连接失败:', error)
    }
  }

  /**
   * 测试完整的RDP连接
   */
  public testRdpConnection(container: HTMLElement, resource: number, voucher: number, token: string, options?: {
    resolution?: string
    color_depth?: number
    enable_clipboard?: boolean
  }) {
    console.log('=== 开始完整RDP连接测试 ===')
    
    try {
      this.container = container
      
      // 构建WebSocket连接URL
      const params = new URLSearchParams()
      params.append('token', token)
      params.append('resource_id', String(resource))
      params.append('voucher_id', String(voucher))
      params.append('resolution', options?.resolution || '1024x768')
      params.append('color_depth', String(options?.color_depth || 16))
      params.append('enable_clipboard', String(options?.enable_clipboard !== false))

      const wsUrl = requests.getWsBaseUrl() + `/terminal/rdp/?${params.toString()}`
      console.log('WebSocket URL:', wsUrl)
      
      // 创建Guacamole WebSocket隧道
      this.tunnel = new Guacamole.WebSocketTunnel(wsUrl)
      
      // 监听隧道事件
      this.tunnel.onopen = () => {
        console.log('✅ Guacamole隧道已打开')
      }
      
      this.tunnel.onerror = (error: any) => {
        console.error('❌ Guacamole隧道错误:', error)
      }
      
      this.tunnel.onclose = () => {
        console.log('🔚 Guacamole隧道已关闭')
      }
      
      // 创建Guacamole客户端
      this.client = new Guacamole.Client(this.tunnel)
      
      // 监听客户端状态
      this.client.onstatechange = (state: number) => {
        console.log('📊 客户端状态变更:', state)
        switch (state) {
          case Guacamole.Client.State.CONNECTING:
            console.log('🔄 正在连接...')
            this.updateStatus('正在连接...')
            break
          case Guacamole.Client.State.CONNECTED:
            console.log('✅ 已连接')
            this.updateStatus('已连接')
            break
          case Guacamole.Client.State.DISCONNECTING:
            console.log('🔄 正在断开连接...')
            this.updateStatus('正在断开连接...')
            break
          case Guacamole.Client.State.DISCONNECTED:
            console.log('🔚 已断开连接')
            this.updateStatus('已断开连接')
            break
          case Guacamole.Client.State.IDLE:
            console.log('💤 空闲')
            this.updateStatus('空闲')
            break
        }
      }
      
      // 监听错误
      this.client.onerror = (error: any) => {
        console.error('❌ Guacamole客户端错误:', error)
        this.updateStatus(`错误: ${error.message || '未知错误'}`)
      }
      
      // 监听指令处理
      this.client.oninstruction = (instruction: string, args: string[]) => {
        console.log('📋 收到指令:', instruction, args)
      }
      
      // 获取显示元素
      const display = this.client.getDisplay()
      console.log('🖥️ 创建显示元素:', display)
      // 正确的添加显示元素到容器的方法
      if (display && display.getElement) {
        const displayElement = display.getElement()
        console.log('🖥️ 获取显示元素:', displayElement)
        if (displayElement) {
          container.innerHTML = ''
          container.appendChild(displayElement)
        }
      } else {
        console.error('❌ 无法获取显示元素')
        this.updateStatus('无法获取显示元素')
      }
      
      // 处理键盘事件
      console.log('⌨️ 设置键盘事件处理...')
      const handleKeydown = (e: KeyboardEvent) => {
        console.log('⌨️ 键盘按下:', e.key)
      }
      const handleKeyup = (e: KeyboardEvent) => {
        console.log('⌨️ 键盘释放:', e.key)
      }
      document.addEventListener('keydown', handleKeydown)
      document.addEventListener('keyup', handleKeyup)
      this.cleanupFunctions.push(() => {
        document.removeEventListener('keydown', handleKeydown)
        document.removeEventListener('keyup', handleKeyup)
      })
      
      // 处理鼠标事件
      console.log('🖱️ 设置鼠标事件处理...')
      const handleMousedown = (e: MouseEvent) => {
        console.log('🖱️ 鼠标按下:', e.button)
      }
      const handleMousemove = (e: MouseEvent) => {
        console.log('🖱️ 鼠标移动:', e.clientX, e.clientY)
      }
      const handleMouseup = (e: MouseEvent) => {
        console.log('🖱️ 鼠标释放:', e.button)
      }
      const handleWheel = (e: WheelEvent) => {
        console.log('🖱️ 鼠标滚轮:', e.deltaY)
      }
      container.addEventListener('mousedown', handleMousedown)
      container.addEventListener('mousemove', handleMousemove)
      container.addEventListener('mouseup', handleMouseup)
      container.addEventListener('wheel', handleWheel)
      this.cleanupFunctions.push(() => {
        container.removeEventListener('mousedown', handleMousedown)
        container.removeEventListener('mousemove', handleMousemove)
        container.removeEventListener('mouseup', handleMouseup)
        container.removeEventListener('wheel', handleWheel)
      })
      
      // 调整显示大小
      const resizeDisplay = () => {
        if (container) {
          const width = container.clientWidth
          const height = container.clientHeight
          console.log('📐 调整显示大小:', width, height)
          // 暂时注释掉resize调用，避免可能的错误
          // display.resize(width, height)
        }
      }
      
      // 初始调整大小
      resizeDisplay()
      window.addEventListener('resize', resizeDisplay)
      this.cleanupFunctions.push(() => {
        window.removeEventListener('resize', resizeDisplay)
      })
      
      console.log('✅ RDP连接测试已启动')
      this.updateStatus('准备就绪')
      
    } catch (error) {
      console.error('❌ 测试RDP连接失败:', error)
      this.updateStatus(`初始化失败: ${error.message || '未知错误'}`)
    }
  }

  /**
   * 清理资源
   */
  public cleanup() {
    console.log('=== 清理RDP调试资源 ===')
    
    // 执行所有清理函数
    this.cleanupFunctions.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('清理函数执行失败:', error)
      }
    })
    this.cleanupFunctions = []
    
    // 关闭客户端
    if (this.client) {
      try {
        this.client.disconnect()
      } catch (error) {
        console.error('断开客户端连接失败:', error)
      }
      this.client = null
    }
    
    // 关闭隧道
    if (this.tunnel) {
      try {
        this.tunnel.disconnect()
      } catch (error) {
        console.error('断开隧道连接失败:', error)
      }
      this.tunnel = null
    }
    
    // 关闭WebSocket
    if (this.ws) {
      try {
        this.ws.close()
      } catch (error) {
        console.error('关闭WebSocket连接失败:', error)
      }
      this.ws = null
    }
    
    this.container = null
    console.log('✅ 清理完成')
  }

  /**
   * 更新状态显示
   */
  private updateStatus(status: string) {
    if (this.container) {
      // 检查是否存在状态元素
      let statusElement = this.container.querySelector('.rdp-status') as HTMLElement
      if (!statusElement) {
        // 创建状态元素
        statusElement = document.createElement('div')
        statusElement.className = 'rdp-status'
        statusElement.style.position = 'absolute'
        statusElement.style.top = '10px'
        statusElement.style.left = '10px'
        statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        statusElement.style.color = 'white'
        statusElement.style.padding = '5px 10px'
        statusElement.style.borderRadius = '4px'
        statusElement.style.fontSize = '12px'
        statusElement.style.zIndex = '1000'
        this.container.appendChild(statusElement)
      }
      statusElement.textContent = status
    }
  }
}

/**
 * 创建RDP调试实例
 */
export const createRdpDebugger = () => {
  return new RdpDebugger()
}

/**
 * 快速测试RDP连接
 */
export const quickRdpTest = (resource: number, voucher: number, token: string) => {
  const debuggerInstance = new RdpDebugger()
  debuggerInstance.testWebSocketConnection(resource, voucher, token)
  return debuggerInstance
}
