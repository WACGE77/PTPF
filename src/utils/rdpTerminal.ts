import requests from '@/requests'
import type { Ref } from 'vue'
import type { Dom } from '@/struct/terminal'
import Guacamole from 'guacamole-common-js'

/**
 * RDP终端实现
 * 基于Guacamole协议实现Windows远程桌面访问
 */
export class RdpShell {
  private container: Dom = null
  private client: Guacamole.Client | null = null
  private tunnel: Guacamole.WebSocketTunnel | null = null
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private errorMessage: string = ''
  private cleanup?: () => void

  /**
   * 连接到RDP服务器
   * @param resource 资源ID
   * @param voucher 凭证ID
   * @param token 认证令牌
   * @param options 连接选项
   */
  public async connect(resource: number, voucher: number, token: string, options?: {
    resolution?: string
    color_depth?: number
    enable_clipboard?: boolean
  }) {
    this.status = 'connecting'
    try {
      const params = new URLSearchParams()
      params.append('token', token)
      params.append('resource_id', String(resource))
      params.append('voucher_id', String(voucher))
      params.append('resolution', options?.resolution || '1024x768')
      params.append('color_depth', String(options?.color_depth || 16))
      params.append('enable_clipboard', String(options?.enable_clipboard !== false))

      const wsUrl = requests.getWsBaseUrl() + `/terminal/rdp/?${params.toString()}`
      console.log('RDP连接URL:', wsUrl)
      this.initGuacamole(wsUrl)
    } catch (error: any) {
      this.status = 'error'
      this.errorMessage = error.message || '连接失败'
      console.error('RDP connection error:', error)
    }
  }

  /**
   * 初始化Guacamole客户端
   * @param wsUrl WebSocket URL
   */
  private initGuacamole(wsUrl: string) {
    if (!this.container) {
      console.error('容器未初始化')
      this.status = 'error'
      this.errorMessage = '容器未初始化'
      return
    }
    
    console.log('初始化Guacamole客户端...')
    console.log('WebSocket URL:', wsUrl)
    
    try {
      // 创建Guacamole WebSocket隧道
      this.tunnel = new Guacamole.WebSocketTunnel(wsUrl)
      console.log('创建WebSocket隧道成功')
      
      // 监听隧道事件
      this.tunnel.onopen = () => {
        console.log('WebSocket隧道已打开')
      }
      
      this.tunnel.onerror = (error: any) => {
        console.error('WebSocket隧道错误:', error)
        this.status = 'error'
        this.errorMessage = `隧道错误: ${error.message || '未知错误'}`
      }
      
      this.tunnel.onclose = () => {
        console.log('WebSocket隧道已关闭')
      }
      
      // 创建Guacamole客户端
      this.client = new Guacamole.Client(this.tunnel)
      console.log('创建Guacamole客户端成功')
      
      // 监听客户端状态
      this.client.onstatechange = (state: number) => {
        console.log('Guacamole客户端状态变更:', state)
        switch (state) {
          case Guacamole.Client.State.CONNECTING:
            this.status = 'connecting'
            console.log('正在连接...')
            break
          case Guacamole.Client.State.CONNECTED:
            this.status = 'connected'
            console.log('已连接')
            // 连接成功后再次调整大小
            setTimeout(() => {
              const width = this.container?.clientWidth || 1024
              const height = this.container?.clientHeight || 768
              console.log('连接成功后调整显示大小:', width, height)
              this.resize(width, height)
            }, 100)
            break
          case Guacamole.Client.State.DISCONNECTING:
            console.log('正在断开连接...')
            break
          case Guacamole.Client.State.DISCONNECTED:
            this.status = 'disconnected'
            console.log('已断开连接')
            break
          case Guacamole.Client.State.IDLE:
            console.log('空闲')
            break
        }
      }
      
      // 监听错误
      this.client.onerror = (error: any) => {
        console.error('Guacamole客户端错误:', error)
        this.status = 'error'
        this.errorMessage = error.message || '连接错误'
      }
      
      // 监听指令处理
      this.client.oninstruction = (instruction: string, args: string[]) => {
        console.log('收到Guacamole指令:', instruction, args)
      }
      
      // 获取显示元素
      const display = this.client.getDisplay()
      console.log('创建显示元素:', display)
      
      if (display && display.getElement) {
        const displayElement = display.getElement()
        console.log('获取显示DOM元素:', displayElement)
        
        if (displayElement) {
          // 清空容器并添加显示元素
          this.container.innerHTML = ''
          this.container.appendChild(displayElement)
          
          // 设置显示元素样式
          displayElement.style.width = '100%'
          displayElement.style.height = '100%'
        }
      } else {
        console.error('无法获取显示元素')
        this.status = 'error'
        this.errorMessage = '无法获取显示元素'
      }
      
      // 设置容器样式
      this.container.style.position = 'relative'
      this.container.style.overflow = 'hidden'
      this.container.style.width = '100%'
      this.container.style.height = '100%'
      
      // 处理键盘事件
      console.log('设置键盘事件处理...')
      const keyboard = this.client.getKeyboard()
      console.log('创建键盘处理器:', keyboard)
      
      const handleKeydown = (e: KeyboardEvent) => {
        console.log('键盘按下:', e.key)
        keyboard.handleKeydown(e)
      }
      
      const handleKeyup = (e: KeyboardEvent) => {
        console.log('键盘释放:', e.key)
        keyboard.handleKeyup(e)
      }
      
      document.addEventListener('keydown', handleKeydown)
      document.addEventListener('keyup', handleKeyup)
      
      // 处理鼠标事件
      console.log('设置鼠标事件处理...')
      const mouse = this.client.getMouse()
      console.log('创建鼠标处理器:', mouse)
      
      const handleMousedown = (e: MouseEvent) => {
        console.log('鼠标按下:', e.button)
        mouse.handleMouseDown(e)
      }
      
      const handleMousemove = (e: MouseEvent) => {
        mouse.handleMouseMove(e)
      }
      
      const handleMouseup = (e: MouseEvent) => {
        console.log('鼠标释放:', e.button)
        mouse.handleMouseUp(e)
      }
      
      const handleWheel = (e: WheelEvent) => {
        mouse.handleWheel(e)
      }
      
      this.container.addEventListener('mousedown', handleMousedown)
      this.container.addEventListener('mousemove', handleMousemove)
      this.container.addEventListener('mouseup', handleMouseup)
      this.container.addEventListener('wheel', handleWheel)
      
      // 调整显示大小
      const width = this.container.clientWidth
      const height = this.container.clientHeight
      console.log('调整显示大小:', width, height)
      this.resize(width, height)
      
      // 清理函数
      this.cleanup = () => {
        console.log('清理Guacamole客户端...')
        document.removeEventListener('keydown', handleKeydown)
        document.removeEventListener('keyup', handleKeyup)
        if (this.container) {
          this.container.removeEventListener('mousedown', handleMousedown)
          this.container.removeEventListener('mousemove', handleMousemove)
          this.container.removeEventListener('mouseup', handleMouseup)
          this.container.removeEventListener('wheel', handleWheel)
        }
        this.close()
      }
    } catch (error: any) {
      console.error('初始化Guacamole客户端失败:', error)
      this.status = 'error'
      this.errorMessage = `初始化失败: ${error.message || '未知错误'}`
    }
  }

  /**
   * 调整终端大小
   * @param width 宽度
   * @param height 高度
   */
  public resize(width: number, height: number) {
    if (this.status === 'connected' && this.client) {
      try {
        const display = this.client.getDisplay()
        if (display && display.resize) {
          display.resize(width, height)
          console.log('调整显示大小成功:', width, height)
        } else {
          console.warn('无法调整显示大小: display对象不存在或没有resize方法')
        }
      } catch (error) {
        console.error('调整显示大小时出错:', error)
      }
    }
  }

  /**
   * 挂载终端到容器
   * @param containerEl 容器元素
   */
  public mount(containerEl: HTMLElement) {
    this.container = containerEl
    
    const resizeHandler = () => {
      if (this.container) {
        this.resize(this.container.clientWidth, this.container.clientHeight)
      }
    }

    window.addEventListener('resize', resizeHandler)

    // 清理函数会在initGuacamole中被覆盖
    this.cleanup = () => {
      window.removeEventListener('resize', resizeHandler)
      this.close()
    }
  }

  /**
   * 关闭终端连接
   */
  public close() {
    if (this.client) {
      try {
        this.client.disconnect()
      } catch (error) {
        console.error('断开客户端连接失败:', error)
      }
      this.client = null
    }
    if (this.tunnel) {
      try {
        this.tunnel.disconnect()
      } catch (error) {
        console.error('断开隧道连接失败:', error)
      }
      this.tunnel = null
    }
    this.status = 'disconnected'
  }

  /**
   * 获取终端状态
   * @returns 终端状态
   */
  public getStatus() {
    return this.status
  }

  /**
   * 获取错误信息
   * @returns 错误信息
   */
  public getErrorMessage() {
    return this.errorMessage
  }
}

export default RdpShell
