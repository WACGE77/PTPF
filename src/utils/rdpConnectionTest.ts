import Guacamole from 'guacamole-common-js'
import requests from '@/requests'

/**
 * RDP连接详细测试工具
 * 用于检查RDP连接的各个环节
 */
export class RdpConnectionTester {
  private ws: WebSocket | null = null
  private client: Guacamole.Client | null = null
  private tunnel: Guacamole.WebSocketTunnel | null = null
  private container: HTMLElement | null = null
  private messageLog: string[] = []

  /**
   * 开始详细测试
   */
  public startTest(container: HTMLElement, resource: number, voucher: number, token: string) {
    this.container = container
    this.messageLog = []
    
    console.log('=== 开始RDP连接详细测试 ===')
    this.log('开始测试RDP连接...')
    
    this.testWebSocketConnection(resource, voucher, token)
      .then(ws => {
        this.log('WebSocket连接成功，开始创建Guacamole客户端...')
        return this.createGuacamoleClient(ws)
      })
      .then(client => {
        this.log('Guacamole客户端创建成功，开始测试显示...')
        return this.testDisplay(client)
      })
      .then(() => {
        this.log('测试完成，检查结果...')
        this.analyzeResults()
      })
      .catch(error => {
        this.log(`测试失败: ${error.message || '未知错误'}`)
        console.error('测试失败:', error)
      })
  }

  /**
   * 测试WebSocket连接
   */
  private async testWebSocketConnection(resource: number, voucher: number, token: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const params = new URLSearchParams()
        params.append('token', token)
        params.append('resource_id', String(resource))
        params.append('voucher_id', String(voucher))
        params.append('resolution', '1024x768')
        params.append('color_depth', '16')
        params.append('enable_clipboard', 'true')

        const wsUrl = requests.getWsBaseUrl() + `/terminal/rdp/?${params.toString()}`
        this.log(`WebSocket URL: ${wsUrl}`)
        
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          this.log('WebSocket连接已建立')
          resolve(ws)
        }
        
        ws.onmessage = (event) => {
          this.log(`收到WebSocket消息: ${event.data.substring(0, 100)}...`)
        }
        
        ws.onerror = (error) => {
          this.log(`WebSocket错误: ${error}`)
          reject(new Error(`WebSocket连接失败: ${error}`))
        }
        
        ws.onclose = (event) => {
          this.log(`WebSocket连接关闭: ${event.code} ${event.reason}`)
        }
        
        // 5秒超时
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket连接超时'))
          }
        }, 5000)
        
      } catch (error) {
        reject(new Error(`创建WebSocket连接失败: ${error}`))
      }
    })
  }

  /**
   * 创建Guacamole客户端
   */
  private createGuacamoleClient(ws: WebSocket): Promise<Guacamole.Client> {
    return new Promise((resolve, reject) => {
      try {
        // 创建Guacamole WebSocket隧道
        const tunnel = new Guacamole.WebSocketTunnel(ws)
        this.tunnel = tunnel
        
        // 创建Guacamole客户端
        const client = new Guacamole.Client(tunnel)
        this.client = client
        
        // 监听客户端状态
        client.onstatechange = (state: number) => {
          const stateNames = {
            [Guacamole.Client.State.CONNECTING]: 'CONNECTING',
            [Guacamole.Client.State.CONNECTED]: 'CONNECTED',
            [Guacamole.Client.State.DISCONNECTING]: 'DISCONNECTING',
            [Guacamole.Client.State.DISCONNECTED]: 'DISCONNECTED',
            [Guacamole.Client.State.IDLE]: 'IDLE'
          }
          this.log(`客户端状态变更: ${stateNames[state] || state}`)
          
          if (state === Guacamole.Client.State.CONNECTED) {
            resolve(client)
          }
        }
        
        // 监听错误
        client.onerror = (error: any) => {
          this.log(`客户端错误: ${error}`)
          reject(new Error(`Guacamole客户端错误: ${error}`))
        }
        
        // 监听指令
        client.oninstruction = (instruction: string, args: string[]) => {
          this.log(`收到指令: ${instruction} ${args.join(', ')}`)
        }
        
        // 5秒超时
        setTimeout(() => {
          if (client.getState() !== Guacamole.Client.State.CONNECTED) {
            reject(new Error('Guacamole客户端连接超时'))
          }
        }, 5000)
        
      } catch (error) {
        reject(new Error(`创建Guacamole客户端失败: ${error}`))
      }
    })
  }

  /**
   * 测试显示
   */
  private testDisplay(client: Guacamole.Client): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.container) {
          reject(new Error('容器未初始化'))
          return
        }
        
        // 获取显示元素
        const display = client.getDisplay()
        this.log(`获取显示元素: ${display}`)
        
        if (!display) {
          reject(new Error('无法获取显示元素'))
          return
        }
        
        // 获取显示DOM元素
        const displayElement = display.getElement()
        this.log(`获取显示DOM元素: ${displayElement}`)
        
        if (!displayElement) {
          reject(new Error('无法获取显示DOM元素'))
          return
        }
        
        // 添加到容器
        this.container.innerHTML = ''
        this.container.appendChild(displayElement)
        this.log('显示元素已添加到容器')
        
        // 设置显示大小
        const width = this.container.clientWidth
        const height = this.container.clientHeight
        this.log(`设置显示大小: ${width}x${height}`)
        
        if (display.resize) {
          display.resize(width, height)
          this.log('显示大小已设置')
        }
        
        // 设置样式
        displayElement.style.width = '100%'
        displayElement.style.height = '100%'
        this.container.style.position = 'relative'
        this.container.style.overflow = 'hidden'
        
        resolve()
        
      } catch (error) {
        reject(new Error(`测试显示失败: ${error}`))
      }
    })
  }

  /**
   * 分析测试结果
   */
  private analyzeResults() {
    this.log('=== 测试结果分析 ===')
    
    // 检查是否有错误
    const hasError = this.messageLog.some(log => log.includes('错误'))
    if (hasError) {
      this.log('测试过程中出现错误，请查看日志')
      return
    }
    
    // 检查是否收到指令
    const hasInstructions = this.messageLog.some(log => log.includes('收到指令'))
    if (!hasInstructions) {
      this.log('未收到任何Guacamole指令，可能后端没有返回数据')
      return
    }
    
    // 检查是否连接成功
    const isConnected = this.messageLog.some(log => log.includes('客户端状态变更: CONNECTED'))
    if (!isConnected) {
      this.log('Guacamole客户端未连接成功')
      return
    }
    
    this.log('测试成功完成，RDP连接应该正常工作')
  }

  /**
   * 记录日志
   */
  private log(message: string) {
    console.log(`[RDP测试] ${message}`)
    this.messageLog.push(message)
    
    // 更新页面显示
    if (this.container) {
      let logElement = this.container.querySelector('.rdp-test-log') as HTMLElement
      if (!logElement) {
        logElement = document.createElement('div')
        logElement.className = 'rdp-test-log'
        logElement.style.position = 'absolute'
        logElement.style.bottom = '10px'
        logElement.style.left = '10px'
        logElement.style.right = '10px'
        logElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        logElement.style.color = 'white'
        logElement.style.padding = '10px'
        logElement.style.borderRadius = '4px'
        logElement.style.fontSize = '12px'
        logElement.style.maxHeight = '200px'
        logElement.style.overflowY = 'auto'
        logElement.style.zIndex = '1000'
        this.container.appendChild(logElement)
      }
      logElement.innerHTML += `<div>${new Date().toLocaleTimeString()} - ${message}</div>`
      logElement.scrollTop = logElement.scrollHeight
    }
  }

  /**
   * 清理资源
   */
  public cleanup() {
    this.log('清理测试资源...')
    
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
    
    if (this.ws) {
      try {
        this.ws.close()
      } catch (error) {
        console.error('关闭WebSocket连接失败:', error)
      }
      this.ws = null
    }
    
    this.container = null
    this.messageLog = []
    this.log('清理完成')
  }
}

/**
 * 创建RDP连接测试实例
 */
export const createRdpConnectionTester = () => {
  return new RdpConnectionTester()
}
