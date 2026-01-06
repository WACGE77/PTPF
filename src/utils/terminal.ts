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
  private fitAddon: FitAddon
  private websocket: WebSocket | null = null
  private container: Ref | null = null
  private status: boolean = false
  private lock: boolean = false
  private OnData: IDisposable | null = null
  private OnResize: IDisposable | null = null
  public cleanup?: () => void
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
  public async connect(auth: TerminalData) {
    if (!this.status && !this.lock) {
      this.lock = true
      this.websocket = new WebSocket(requests.getWsBaseUrl() + `/terminal/ssh/`)
      this.websocket.onopen = () => {
        this.status = true
        this.websocket?.send(JSON.stringify(auth))
        this.resize()
        this.term.write('正在连接服务器...\r\n')
        this.lock = false
      }
      this.websocket.onmessage = (event: MessageEvent) => {
        this.term.write(event.data)
      }
      this.websocket.onclose = () => {
        this.OnData?.dispose()
        this.status = false
        this.lock = false
      }
      this.OnData = this.term.onData((data) => {
        if (this.status) {
          const tmp = { type: 2, data: data }
          this.websocket?.send(JSON.stringify(tmp))
        }
      })
      this.OnResize = this.term.onResize(() => {
        if (this.status) {
          this.resize()
        }
      })
    }
  }

  public resize() {
    if (this.status) {
      this.fitAddon.fit()
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
