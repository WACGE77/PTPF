import requests from '@/requests'
import type { Ref } from 'vue'
import { Terminal } from 'xterm'
import type { IDisposable } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import type { TerminalData } from '@/struct'
export class Shell {
  //private
  public term: Terminal
  private readonly fitAddon: FitAddon
  private websocket: WebSocket | null = null
  private container: Ref | null = null
  private status: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private lock: boolean = false
  private OnData: IDisposable | null = null
  private OnResize: IDisposable | null = null
  public cleanup?: () => void
  public onStatusChange?: () => void
  private errorMessage: string = ''
  
  constructor() {
    this.term = new Terminal({
      fontSize: 14,
      theme: {
        // 主题颜色
        background: '#2f4050',
        foreground: '#fff',
      },
    })
    this.fitAddon = new FitAddon()
    this.term.loadAddon(this.fitAddon)
  }
  
  private updateStatus(newStatus: 'disconnected' | 'connecting' | 'connected' | 'error', errorMsg: string = '') {
    this.status = newStatus
    this.errorMessage = errorMsg
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
  
  public async connect(resource:number,voucher:number,token:string) {
    if (this.status !== 'disconnected' && this.status !== 'error' && !this.lock) {
      return
    }
    this.lock = true
    this.updateStatus('connecting')
    
    const params = new URLSearchParams()
    params.append('token',token)
    params.append('resource',String(resource))
    params.append('voucher',String(voucher))
    this.websocket = new WebSocket(requests.getWsBaseUrl() + `/terminal/ssh/?${params.toString()}`)
    this.websocket.onopen = () => {
      this.updateStatus('connected')
      this.fitAddon.fit()
      this.resize()
      this.term.write('正在连接服务器...\r\n')
      this.lock = false
    }
    this.websocket.onmessage = (event: MessageEvent) => {
      this.term.write(event.data)
    }
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.updateStatus('error', '连接出错')
      this.lock = false
    }
    this.websocket.onclose = () => {
      this.OnData?.dispose()
      this.updateStatus('disconnected')
      this.lock = false
    }
    this.OnData = this.term.onData((data) => {
      if (this.status === 'connected') {
        const tmp = { type: 2, data: data }
        this.websocket?.send(JSON.stringify(tmp))
      }
    })
    this.OnResize = this.term.onResize(() => {
      if (this.status === 'connected') {
        this.resize()
      }
    })
  }

  public resize() {
    if (this.status === 'connected') {
      const option = {
        type: 1,
        data: {
          cols: this.term.cols,
          rows: this.term.rows,
        },
      }
      this.websocket?.send(JSON.stringify(option))
    }
  }

  public mount(containerEl: HTMLElement) {
    this.term.open(containerEl)

    this.fitAddon.fit()

    const resizeHandler = () => {
      this.fitAddon.fit()
    }

    window.addEventListener('resize', resizeHandler)

    this.cleanup = () => {
      window.removeEventListener('resize', resizeHandler)
      this.term.dispose()
    }
  }

  public close() {
    this.websocket?.close()
    this.term.dispose()
  }
}

export default Shell
