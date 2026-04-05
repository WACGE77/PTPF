import requests from '@/requests'
import type { Dom } from '@/struct/terminal'
import Guacamole from 'guacamole-common-js'

const isDev = import.meta.env.DEV

const log = (...args: any[]) => {
  if (isDev) console.log('[RDP]', ...args)
}

const logError = (...args: any[]) => {
  if (isDev) console.error('[RDP]', ...args)
}

export class RdpShell {
  private container: Dom = null
  private client: Guacamole.Client | null = null
  private tunnel: Guacamole.WebSocketTunnel | null = null
  private _status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private errorMessage: string = ''
  private cleanup?: () => void
  private clipboardEnabled: boolean = true
  private clipboardCleanup?: () => void
  private resizeObserver: ResizeObserver | null = null
  private resizeTimer: ReturnType<typeof setTimeout> | null = null
  private resizeDebounceDelay: number = 500
  
  public onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void
  
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 3000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private autoReconnect: boolean = true
  
  private connectionParams: {
    resource: number
    voucher: number
    token: string
    options?: {
      resolution?: string
      color_depth?: number
      enable_clipboard?: boolean
    }
  } | null = null

  private setStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error') {
    const oldStatus = this._status
    this._status = status
    if (oldStatus !== status && this.onStatusChange) {
      this.onStatusChange(status)
    }
  }

  public async connect(resource: number, voucher: number, token: string, options?: {
    resolution?: string
    color_depth?: number
    enable_clipboard?: boolean
  }) {
    this.connectionParams = { resource, voucher, token, options }
    this.reconnectAttempts = 0
    
    this.setStatus('connecting')
    
    try {
      // 使用容器实际大小作为初始分辨率，确保获取准确的尺寸
      let resolution = options?.resolution
      if (!resolution && this.container) {
        // 使用getBoundingClientRect获取更准确的尺寸
        const rect = this.container.getBoundingClientRect()
        const width = Math.max(1024, Math.floor(rect.width))
        const height = Math.max(768, Math.floor(rect.height))
        resolution = `${width}x${height}`
        log(`计算初始分辨率: ${resolution}`)
      } else if (!resolution) {
        resolution = '1024x768'
        log(`使用默认分辨率: ${resolution}`)
      }
      const colorDepth = options?.color_depth || 32
      const enableClipboard = options?.enable_clipboard !== false

      const wsUrl = `${requests.getWsBaseUrl()}/terminal/rdp/?token=${encodeURIComponent(token)}&resource=${resource}&voucher=${voucher}&resolution=${resolution}&color_depth=${colorDepth}&enable_clipboard=${enableClipboard}`
      log('连接URL:', wsUrl)
      
      this.initGuacamole(wsUrl)
    } catch (error: any) {
      logError('连接错误:', error)
      this.setStatus('error')
      this.errorMessage = error.message || '连接失败'
      this.tryReconnect()
    }
  }

  private initGuacamole(wsUrl: string) {
    if (!this.container) {
      logError('容器未初始化')
      this.setStatus('error')
      this.errorMessage = '容器未初始化'
      return
    }
    
    log('初始化Guacamole客户端...')
    
    // 清理之前的实例，避免冲突
    this.cleanupPreviousInstance()
    
    try {
      // 清空容器内容，确保没有旧的显示元素
      this.container.innerHTML = ''
      
      // 设置容器样式，确保正确的显示环境
      this.container.style.backgroundColor = '#000'
      this.container.style.overflow = 'hidden'
      this.container.style.position = 'relative'
      this.container.style.width = '100%'
      this.container.style.height = '100%'
      this.container.style.padding = '0'
      this.container.style.margin = '0'
      
      // 创建新的隧道和客户端实例
      this.tunnel = new Guacamole.WebSocketTunnel(wsUrl)
      this.client = new Guacamole.Client(this.tunnel)
      
      // 配置隧道错误处理
      this.tunnel.onerror = (error: any) => {
        logError('WebSocket隧道错误:', error)
        this.setStatus('error')
        this.errorMessage = `隧道错误: ${error.message || '未知错误'}`
      }
      
      // 配置客户端状态变更处理
      this.client.onstatechange = (state: number) => {
        log('客户端状态变更:', state)
        switch (state) {
          case Guacamole.Client.State.CONNECTING:
            this.setStatus('connecting')
            break
          case Guacamole.Client.State.CONNECTED:
            log('已连接，准备调整显示')
            this.setStatus('connected')
            this.reconnectAttempts = 0
            // 延迟调整显示，确保会话完全初始化
            setTimeout(() => {
              requestAnimationFrame(() => this.doResize())
            }, 500)
            break
          case Guacamole.Client.State.DISCONNECTED:
            this.setStatus('disconnected')
            if (this.autoReconnect) {
              this.tryReconnect()
            }
            break
        }
      }
      
      // 配置客户端错误处理
      this.client.onerror = (error: any) => {
        logError('客户端错误:', error)
        this.setStatus('error')
        this.errorMessage = error.message || '连接错误'
      }
      
      // 配置显示
      const display = this.client.getDisplay()
      if (display && display.getElement) {
        const displayElement = display.getElement()
        if (displayElement) {
          // 清空容器并添加显示元素
          this.container.innerHTML = ''
          this.container.appendChild(displayElement)
          
          // 设置显示元素样式
          displayElement.style.width = '100%'
          displayElement.style.height = '100%'
          displayElement.style.position = 'absolute'
          displayElement.style.top = '0'
          displayElement.style.left = '0'
          displayElement.style.margin = '0'
          displayElement.style.padding = '0'
          displayElement.style.overflow = 'hidden'
          displayElement.style.transform = 'translateZ(0)'
          displayElement.style.backfaceVisibility = 'hidden'
          displayElement.style.perspective = '1000px'
        }
      }
      
      // 设置输入处理器
      this.setupInputHandlers()
      
      // 设置 resize observer
      this.setupResizeObserver()
      
      // 连接客户端
      log('连接Guacamole客户端...')
      this.client.connect('')
      
      // 设置剪贴板
      this.setupClipboard()
      
      // 设置清理函数
      this.cleanup = () => {
        this.destroy()
      }
    } catch (error: any) {
      logError('初始化失败:', error)
      this.setStatus('error')
      this.errorMessage = `初始化失败: ${error.message || '未知错误'}`
    }
  }

  private setupResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        log(`ResizeObserver: ${width}x${height}, status: ${this._status}`)
        if (width > 0 && height > 0) {
          requestAnimationFrame(() => this.doResize())
        }
      }
    })
    
    this.resizeObserver.observe(this.container)
    
    const fullscreenHandler = () => {
      requestAnimationFrame(() => this.doResize())
    }
    document.addEventListener('fullscreenchange', fullscreenHandler)
    
    const resizeHandler = () => {
      requestAnimationFrame(() => this.doResize())
    }
    window.addEventListener('resize', resizeHandler)
    
    const originalCleanup = this.cleanup
    this.cleanup = () => {
      this.resizeObserver?.disconnect()
      this.resizeObserver = null
      document.removeEventListener('fullscreenchange', fullscreenHandler)
      window.removeEventListener('resize', resizeHandler)
      originalCleanup?.()
    }
  }

  private doResize() {
    // 清除之前的定时器
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer)
    }
    
    this.resizeTimer = setTimeout(() => {
      this._doResize()
    }, this.resizeDebounceDelay)
  }
  
  private _doResize() {
    if (!this.client || !this.container) {
      log('doResize跳过: client或container不存在')
      return
    }
    
    // 确保容器样式正确，避免padding和border影响
    this.container.style.padding = '0'
    this.container.style.border = 'none'
    this.container.style.overflow = 'hidden'
    this.container.style.position = 'relative'
    this.container.style.width = '100%'
    this.container.style.height = '100%'
    
    // 获取容器的实际尺寸，使用getBoundingClientRect以获得更准确的尺寸
    const rect = this.container.getBoundingClientRect()
    const containerWidth = Math.max(1, Math.floor(rect.width))
    const containerHeight = Math.max(1, Math.floor(rect.height))
    
    log(`doResize - 容器尺寸: ${containerWidth}x${containerHeight}`)
    
    if (containerWidth <= 100 || containerHeight <= 100) {
      log('容器尺寸过小，跳过')
      return
    }
    
    const display = this.client.getDisplay()
    if (!display) {
      log('Display不存在，跳过')
      return
    }
    
    // 计算目标分辨率，确保至少1024x768，并且是8的倍数以获得更好的性能
    // 为了确保状态栏显示，我们使用容器的实际尺寸作为目标分辨率
    const targetWidth = Math.max(1024, Math.floor(containerWidth / 16) * 16)
    const targetHeight = Math.max(768, Math.floor(containerHeight / 16) * 16)
    
    log(`计算目标分辨率: ${targetWidth}x${targetHeight}`)
    
    // 先发送新的分辨率到服务器
    try {
      this.client.sendSize(targetWidth, targetHeight)
      log(`发送分辨率到服务器: ${targetWidth}x${targetHeight}`)
    } catch (error) {
      logError('发送分辨率失败:', error)
      return
    }
    
    // 使用更保守的调整策略，避免频繁调整导致guacd错误
    let attempts = 0
    const maxAttempts = 3
    
    const adjustDisplay = () => {
      attempts++
      
      const displayWidth = display.getWidth()
      const displayHeight = display.getHeight()
      
      log(`doResize - 尝试 ${attempts}/${maxAttempts}, Display尺寸: ${displayWidth}x${displayHeight}`)
      
      // 调整显示缩放，确保完全填满容器
      if (displayWidth > 0 && displayHeight > 0) {
        // 计算缩放比例，使用较大的比例以确保完全填满容器
        const scaleX = containerWidth / displayWidth
        const scaleY = containerHeight / displayHeight
        const scale = Math.max(scaleX, scaleY)
        
        // 应用缩放
        display.scale(scale)
        
        // 计算偏移，确保显示居中
        const offsetX = (containerWidth - displayWidth * scale) / 2
        const offsetY = (containerHeight - displayHeight * scale) / 2
        
        // 确保偏移值为整数，避免模糊
        const intOffsetX = Math.round(offsetX)
        const intOffsetY = Math.round(offsetY)
        
        // 确保显示元素的样式正确
        const displayElement = display.getElement()
        if (displayElement) {
          // 设置位置和缩放
          displayElement.style.transform = `translate(${intOffsetX}px, ${intOffsetY}px) scale(${scale})`
          displayElement.style.transformOrigin = 'top left'
          
          // 确保基本样式正确
          displayElement.style.width = '100%'
          displayElement.style.height = '100%'
          displayElement.style.position = 'absolute'
          displayElement.style.top = '0'
          displayElement.style.left = '0'
          displayElement.style.margin = '0'
          displayElement.style.padding = '0'
          displayElement.style.overflow = 'hidden'
          displayElement.style.backfaceVisibility = 'hidden'
          displayElement.style.perspective = '1000px'
        }
        
        log(`缩放: ${scale.toFixed(3)}, 偏移: (${intOffsetX}, ${intOffsetY})`)
      } else if (attempts < maxAttempts) {
        // 如果显示尺寸还未更新，继续尝试
        setTimeout(adjustDisplay, 500)
      }
    }
    
    // 开始调整显示
    setTimeout(adjustDisplay, 300)
  }

  private setupInputHandlers() {
    if (!this.container || !this.client) return

    const display = this.client.getDisplay()
    const displayElement = display?.getElement()
    if (!displayElement) return

    displayElement.addEventListener('mousedown', this.handleMouseDown)
    displayElement.addEventListener('mousemove', this.handleMouseMove)
    displayElement.addEventListener('mouseup', this.handleMouseUp)
    displayElement.addEventListener('contextmenu', (e: Event) => e.preventDefault())
    displayElement.addEventListener('wheel', this.handleWheel, { passive: false })
    
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
  }

  private removeInputHandlers() {
    if (!this.container || !this.client) return

    const display = this.client.getDisplay()
    const displayElement = display?.getElement()
    if (displayElement) {
      displayElement.removeEventListener('mousedown', this.handleMouseDown)
      displayElement.removeEventListener('mousemove', this.handleMouseMove)
      displayElement.removeEventListener('mouseup', this.handleMouseUp)
      displayElement.removeEventListener('wheel', this.handleWheel)
    }
    
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.client || this._status !== 'connected') return
    e.preventDefault()
    this.client.sendMouseState(this.createMouseState(e), true)
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.client || this._status !== 'connected') return
    this.client.sendMouseState(this.createMouseState(e), true)
  }

  private handleMouseUp = (e: MouseEvent) => {
    if (!this.client || this._status !== 'connected') return
    e.preventDefault()
    this.client.sendMouseState(this.createMouseState(e), true)
  }

  private handleWheel = (e: WheelEvent) => {
    if (!this.client || this._status !== 'connected') return
    e.preventDefault()
    
    const display = this.client.getDisplay()
    const displayElement = display?.getElement()
    if (!displayElement) return

    const rect = displayElement.getBoundingClientRect()
    const mouseState: Guacamole.Mouse.State = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      left: false,
      middle: false,
      right: false,
      up: e.deltaY < 0,
      down: e.deltaY > 0
    }
    
    this.client.sendMouseState(mouseState, true)
  }

  private createMouseState(e: MouseEvent): Guacamole.Mouse.State {
    const display = this.client?.getDisplay()
    const displayElement = display?.getElement()
    if (!displayElement) {
      return { x: 0, y: 0, left: false, middle: false, right: false, up: false, down: false }
    }

    const rect = displayElement.getBoundingClientRect()
    
    // 计算鼠标在显示元素内的相对位置
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // 获取显示元素的transform样式，计算实际缩放比例
    const transform = window.getComputedStyle(displayElement).transform
    let scale = 1
    
    if (transform !== 'none') {
      // 解析transform矩阵获取缩放比例
      const matrix = transform.match(/matrix\(([^)]+)\)/)
      if (matrix) {
        const values = matrix[1].split(',').map(parseFloat)
        scale = values[0] // 假设等比例缩放
      }
    }
    
    // 根据缩放比例调整鼠标位置
    const adjustedX = Math.round(x / scale)
    const adjustedY = Math.round(y / scale)
    
    return {
      x: adjustedX,
      y: adjustedY,
      left: (e.buttons & 1) !== 0,
      middle: (e.buttons & 4) !== 0,
      right: (e.buttons & 2) !== 0,
      up: false,
      down: false
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.client || this._status !== 'connected') return
    e.preventDefault()
    const keysym = this.getKeysym(e)
    if (keysym) {
      this.client.sendKeyEvent(1, keysym)
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    if (!this.client || this._status !== 'connected') return
    e.preventDefault()
    const keysym = this.getKeysym(e)
    if (keysym) {
      this.client.sendKeyEvent(0, keysym)
    }
  }

  private getKeysym(e: KeyboardEvent): number | null {
    const keyMap: Record<string, number> = {
      'Tab': 0xff09, 'Enter': 0xff0d, 'Escape': 0xff1b,
      'Backspace': 0xff08, 'Delete': 0xffff, 'Insert': 0xff63,
      'Home': 0xff50, 'End': 0xff57,
      'PageUp': 0xff55, 'PageDown': 0xff56,
      'ArrowLeft': 0xff51, 'ArrowUp': 0xff52,
      'ArrowRight': 0xff53, 'ArrowDown': 0xff54,
      'Shift': 0xffe1, 'Control': 0xffe3, 'Alt': 0xffe9,
      'Meta': 0xffeb, 'CapsLock': 0xffe5
    }
    
    if (keyMap[e.key]) return keyMap[e.key]
    
    if (e.key.startsWith('F') && e.key.length <= 3) {
      const num = parseInt(e.key.slice(1))
      if (num >= 1 && num <= 12) return 0xffbe + num - 1
    }
    
    if (e.key.length === 1) return e.key.charCodeAt(0)
    
    return null
  }

  private setupClipboard() {
    if (!this.client || !this.clipboardEnabled) return

    this.client.onclipboard = (stream: Guacamole.InputStream, mimetype: string) => {
      if (mimetype === 'text/plain') {
        const reader = new Guacamole.StringReader(stream)
        let text = ''
        reader.ontext = (chunk: string) => { text += chunk }
        reader.onend = () => {
          navigator.clipboard?.writeText(text).catch(() => {})
        }
      }
    }

    const handlePaste = (e: ClipboardEvent) => {
      if (this._status !== 'connected' || !this.client) return
      const text = e.clipboardData?.getData('text/plain')
      if (text) this.setClipboard(text)
    }

    const handleCopy = async () => {
      if (this._status !== 'connected' || !this.client) return
      try {
        const text = await navigator.clipboard?.readText()
        if (text) this.setClipboard(text)
      } catch {}
    }

    document.addEventListener('paste', handlePaste)
    document.addEventListener('copy', handleCopy)

    this.clipboardCleanup = () => {
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('copy', handleCopy)
    }
  }

  private tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log('达到最大重连次数')
      return
    }
    
    this.reconnectAttempts++
    log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(() => {
      if (this.connectionParams) {
        this.connect(
          this.connectionParams.resource,
          this.connectionParams.voucher,
          this.connectionParams.token,
          this.connectionParams.options
        )
      }
    }, this.reconnectDelay)
  }

  public mount(containerEl: HTMLElement) {
    this.container = containerEl
  }

  private cleanupPreviousInstance() {
    log('清理之前的Guacamole实例...')
    
    // 清理定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    // 清理resize定时器
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = null
    }
    
    // 清理剪贴板处理
    if (this.clipboardCleanup) {
      this.clipboardCleanup()
      this.clipboardCleanup = undefined
    }
    
    // 清理 resize observer
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    
    // 清理输入处理器
    this.removeInputHandlers()
    
    // 断开并清理客户端和隧道
    if (this.client) {
      try { 
        this.client.disconnect() 
      } catch (error) {
        logError('断开客户端连接失败:', error)
      }
      this.client = null
    }
    if (this.tunnel) {
      try { 
        this.tunnel.disconnect() 
      } catch (error) {
        logError('断开隧道连接失败:', error)
      }
      this.tunnel = null
    }
  }

  private destroy() {
    this.autoReconnect = false
    this.cleanupPreviousInstance()
    this.setStatus('disconnected')
  }

  public close() {
    this.destroy()
  }

  public getStatus() {
    return this._status
  }

  public getErrorMessage() {
    return this.errorMessage
  }

  public setClipboard(text: string) {
    if (this._status === 'connected' && this.client) {
      try {
        const stream = this.client.createClipboardStream('text/plain')
        const writer = new Guacamole.StringWriter(stream)
        writer.sendText(text)
        writer.end()
      } catch (error) {
        logError('设置剪贴板失败:', error)
      }
    }
  }

  public reconnect() {
    if (this.connectionParams) {
      this.close()
      this.connect(
        this.connectionParams.resource,
        this.connectionParams.voucher,
        this.connectionParams.token,
        this.connectionParams.options
      )
    }
  }
}

export default RdpShell
