import requests from '@/requests'
import type { Ref } from 'vue'
import { Terminal } from 'xterm'
import type { IDisposable } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
interface Auth {
  token: string | null
  resource_id: number
  voucher_id: number
}
interface Option {
  cols: number
  rows: number
}
interface ShellCommand {
  type: number
  data: Option | Auth | string
}

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
  public async connect(auth: ShellCommand) {
    if (!this.status && !this.lock) {
      this.lock = true
      this.websocket = new WebSocket(requests.getWsBaseUrl() + '/terminal/ssh/')
      this.websocket.onopen = () => {
        this.status = true
        this.websocket?.send(JSON.stringify(auth))
        this.resize()
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

  public mount(terminalRef: Ref) {
    this.container = terminalRef
    this.term.open(terminalRef.value!)
    this.fitAddon.fit()
  }

  public colse() {
    this.websocket?.close()
    this.term.dispose()
  }
}

export default Shell
