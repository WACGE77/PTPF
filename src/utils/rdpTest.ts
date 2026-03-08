import Guacamole from 'guacamole-common-js'
import requests from '@/requests'

/**
 * RDP连接测试脚本
 * 用于测试RDP连接和数据传输
 */
export const testRdpConnection = async (resource: number, voucher: number, token: string) => {
  try {
    console.log('开始测试RDP连接...')
    
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
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立')
    }
    
    ws.onmessage = (event) => {
      console.log('收到消息:', event.data)
      // 尝试解析消息格式
      try {
        const data = JSON.parse(event.data)
        console.log('解析后的消息:', data)
      } catch (e) {
        console.log('消息不是JSON格式:', event.data)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }
    
    ws.onclose = (event) => {
      console.log('WebSocket连接关闭:', event.code, event.reason)
    }
    
    // 5秒后关闭连接
    setTimeout(() => {
      console.log('关闭WebSocket连接')
      ws.close()
    }, 5000)
    
  } catch (error) {
    console.error('测试RDP连接失败:', error)
  }
}

/**
 * 测试Guacamole客户端
 */
export const testGuacamoleClient = (container: HTMLElement, resource: number, voucher: number, token: string) => {
  try {
    console.log('开始测试Guacamole客户端...')
    
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
    
    // 创建Guacamole WebSocket隧道
    const tunnel = new Guacamole.WebSocketTunnel(wsUrl)
    
    // 创建Guacamole客户端
    const client = new Guacamole.Client(tunnel)
    
    // 获取显示元素
    const display = client.getDisplay()
    display.attach(container)
    
    // 处理键盘事件
    const keyboard = client.getKeyboard()
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
    const mouse = client.getMouse()
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
    container.addEventListener('mousedown', handleMousedown)
    container.addEventListener('mousemove', handleMousemove)
    container.addEventListener('mouseup', handleMouseup)
    container.addEventListener('wheel', handleWheel)
    
    // 调整显示大小
    const resizeDisplay = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      console.log('调整显示大小:', width, height)
      display.resize(width, height)
    }
    
    // 初始调整大小
    resizeDisplay()
    window.addEventListener('resize', resizeDisplay)
    
    // 监听客户端状态
    client.onstatechange = (state: number) => {
      console.log('客户端状态变更:', state)
      switch (state) {
        case Guacamole.Client.State.CONNECTING:
          console.log('正在连接...')
          break
        case Guacamole.Client.State.CONNECTED:
          console.log('已连接')
          break
        case Guacamole.Client.State.DISCONNECTING:
          console.log('正在断开连接...')
          break
        case Guacamole.Client.State.DISCONNECTED:
          console.log('已断开连接')
          break
        case Guacamole.Client.State.IDLE:
          console.log('空闲')
          break
      }
    }
    
    // 监听错误
    client.onerror = (error: any) => {
      console.error('Guacamole客户端错误:', error)
    }
    
    // 清理函数
    const cleanup = () => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('keyup', handleKeyup)
      container.removeEventListener('mousedown', handleMousedown)
      container.removeEventListener('mousemove', handleMousemove)
      container.removeEventListener('mouseup', handleMouseup)
      container.removeEventListener('wheel', handleWheel)
      window.removeEventListener('resize', resizeDisplay)
      client.disconnect()
      tunnel.disconnect()
    }
    
    return cleanup
    
  } catch (error) {
    console.error('测试Guacamole客户端失败:', error)
    return () => {}
  }
}
