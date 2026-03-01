// 登录日志类型
export interface LoginLog {
  id: number
  user: {
    id: number
    name: string
  }
  ip: string
  status: string
  date: string
}

// 操作日志类型
export interface OperaLog {
  id: number
  user: {
    id: number
    name: string
  }
  ip: string
  operation: string
  status: boolean
  date: string
}

// 会话日志类型
export interface SessionLog {
  id: number
  user: {
    id: number
    name: string
  }
  resource: {
    id: number
    name: string
    ip: string
  }
  voucher: {
    id: number
    username: string
  }
  start_time: string
  end_time: string
  status: string
  ip: string
}
