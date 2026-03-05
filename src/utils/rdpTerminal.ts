import requests from '@/requests'
import type { Ref } from 'vue'
import type { Dom } from '@/struct/terminal'

export class RdpShell {
  private container: Dom = null
  private websocket: WebSocket | null = null
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private errorMessage: string = ''
  private cleanup?: () => void

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

      this.websocket = new WebSocket(requests.getWsBaseUrl() + `/terminal/rdp/?${params.toString()}`)
      
      this.websocket.onopen = () => {
        this.status = 'connected'
      }
      
      this.websocket.onmessage = (event: MessageEvent) => {
        // 处理Guacamole协议数据
        console.log('RDP message:', event.data)
      }
      
      this.websocket.onclose = () => {
        this.status = 'disconnected'
      }
      
      this.websocket.onerror = (error) => {
        this.status = 'error'
        this.errorMessage = error.message || '连接错误'
        console.error('RDP connection error:', error)
      }
    } catch (error) {
      this.status = 'error'
      this.errorMessage = error.message || '连接失败'
      console.error('RDP connection error:', error)
    }
  }

  public resize(width: number, height: number) {
    if (this.status === 'connected' && this.websocket) {
      const option = {
        type: 1,
        data: {
          cols: width,
          rows: height
        }
      }
      this.websocket.send(JSON.stringify(option))
    }
  }

  public mount(containerEl: HTMLElement) {
    this.container = containerEl
    
    const resizeHandler = () => {
      if (this.container) {
        this.resize(this.container.clientWidth, this.container.clientHeight)
      }
    }

    window.addEventListener('resize', resizeHandler)

    this.cleanup = () => {
      window.removeEventListener('resize', resizeHandler)
      this.close()
    }
  }

  public close() {
    this.websocket?.close()
    this.status = 'disconnected'
  }

  public getStatus() {
    return this.status
  }

  public getErrorMessage() {
    return this.errorMessage
  }
}

export default RdpShell
