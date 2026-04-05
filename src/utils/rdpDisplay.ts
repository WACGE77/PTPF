import Guacamole from 'guacamole-common-js'
import requests from '@/requests'

/**
 * RDP显示实现
 * 用于处理后端返回的Guacamole绘图指令并在网页上显示RDP桌面
 */
export class RdpDisplay {
  private container: HTMLElement
  private client: Guacamole.Client
  private tunnel: Guacamole.WebSocketTunnel
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private errorMessage: string = ''
  private cleanupFunctions: (() => void)[] = []

  /**
   * 构造函数
   * @param container 显示容器元素
   */
  constructor(container: HTMLElement) {
    this.container = container
    this.client = null as any
    this.tunnel = null as any
  }

  /**
   * 连接到RDP服务器
   * @param resource 资源ID
   * @param voucher 凭证ID
   * @param token 认证令牌
   * @param options 连接选项
   */
  public connect(resource: number, voucher: number, token: string, options?: {
    resolution?: string
    color_depth?: number
    enable_clipboard?: boolean
  }) {
    this.status = 'connecting'
    try {
      const params = new URLSearchParams()
      params.append('token', token)
      params.append('resource', String(resource))
      params.append('voucher', String(voucher))
      params.append('resolution', options?.resolution || '1024x768')
      params.append('color_depth', String(options?.color_depth || 32))
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
        this.status = 'disconnected'
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
            // 连接成功后调整显示大小
            this.resize(this.container.clientWidth, this.container.clientHeight)
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
      
      // 监听指令处理（这里可以看到后端返回的绘图指令）
      this.client.oninstruction = (instruction: string, args: string[]) => {
        console.log('收到Guacamole指令:', instruction, args)
        // 指令类型包括：
        // - "rect": 绘制矩形
        // - "img": 绘制图像
        // - "fill": 填充区域
        // - "copy": 复制区域
        // - "move": 移动光标
        // - "sync": 同步操作
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
      this.container.style.backgroundColor = '#000'
      
      // 处理键盘事件
      this.setupKeyboardEvents()
      
      // 处理鼠标事件
      this.setupMouseEvents()
      
      // 处理窗口大小变化
      this.setupResizeEvents()
      
      // 开始连接（这是关键步骤）
      console.log('开始Guacamole连接...')
      this.client.connect()
      
    } catch (error: any) {
      console.error('初始化Guacamole客户端失败:', error)
      this.status = 'error'
      this.errorMessage = `初始化失败: ${error.message || '未知错误'}`
    }
  }

  /**
   * 设置键盘事件处理
   */
  private setupKeyboardEvents() {
    if (!this.client) return
    
    const keyboard = this.client.getKeyboard()
    console.log('创建键盘处理器:', keyboard)
    
    const handleKeydown = (e: KeyboardEvent) => {
      keyboard.handleKeydown(e)
    }
    
    const handleKeyup = (e: KeyboardEvent) => {
      keyboard.handleKeyup(e)
    }
    
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('keyup', handleKeyup)
    
    this.cleanupFunctions.push(() => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('keyup', handleKeyup)
    })
  }

  /**
   * 设置鼠标事件处理
   */
  private setupMouseEvents() {
    if (!this.client) return
    
    const mouse = this.client.getMouse()
    console.log('创建鼠标处理器:', mouse)
    
    const handleMousedown = (e: MouseEvent) => {
      mouse.handleMouseDown(e)
    }
    
    const handleMousemove = (e: MouseEvent) => {
      mouse.handleMouseMove(e)
    }
    
    const handleMouseup = (e: MouseEvent) => {
      mouse.handleMouseUp(e)
    }
    
    const handleWheel = (e: WheelEvent) => {
      mouse.handleWheel(e)
    }
    
    this.container.addEventListener('mousedown', handleMousedown)
    this.container.addEventListener('mousemove', handleMousemove)
    this.container.addEventListener('mouseup', handleMouseup)
    this.container.addEventListener('wheel', handleWheel)
    
    this.cleanupFunctions.push(() => {
      this.container.removeEventListener('mousedown', handleMousedown)
      this.container.removeEventListener('mousemove', handleMousemove)
      this.container.removeEventListener('mouseup', handleMouseup)
      this.container.removeEventListener('wheel', handleWheel)
    })
  }

  /**
   * 设置窗口大小变化处理
   */
  private setupResizeEvents() {
    const resizeHandler = () => {
      this.resize(this.container.clientWidth, this.container.clientHeight)
    }
    
    window.addEventListener('resize', resizeHandler)
    
    this.cleanupFunctions.push(() => {
      window.removeEventListener('resize', resizeHandler)
    })
  }

  /**
   * 调整显示大小
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
   * 关闭连接
   */
  public close() {
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
      this.client = null as any
    }
    
    // 关闭隧道
    if (this.tunnel) {
      try {
        this.tunnel.disconnect()
      } catch (error) {
        console.error('断开隧道连接失败:', error)
      }
      this.tunnel = null as any
    }
    
    this.status = 'disconnected'
  }

  /**
   * 获取连接状态
   * @returns 连接状态
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

/**
 * 创建RDP显示实例
 * @param container 显示容器元素
 * @returns RDP显示实例
 */
export const createRdpDisplay = (container: HTMLElement) => {
  return new RdpDisplay(container)
}
