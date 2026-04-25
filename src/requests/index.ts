import axios from 'axios'
import { ElMessage } from 'element-plus'

const protocol = 'https:'
const host = 'www.wacgee.icu'
const wsProtocol = 'wss:'

const BASE_URL = `${protocol}//${host}/api`
const BASE_WS_URL = `${wsProtocol}//${host}/api`
let refreshProcess: Promise<boolean> | null = null

export const request_error = (error:any) => {
  let errMsg:string = ""
  
  if (typeof error === 'string') {
    errMsg = error
  } else if (typeof error === 'object' && error !== null) {
    if (error.response) {
      const detail = error.response.data.detail
      if(Array.isArray(detail)){
        errMsg = detail[0]
      }else if(typeof detail === 'object'){
        errMsg = Object.values(detail)[0] as string
      }else if(typeof detail === 'string') {
        errMsg = detail
      } else if (typeof error.response.data === 'string') {
        errMsg = error.response.data
      }
    } else if (error.message) {
      errMsg = error.message
    } else {
      errMsg = JSON.stringify(error)
    }
  } else {
    errMsg = '未知错误'
  }
  
  ElMessage.error(errMsg)
}

const refreshToken = async () => {
  if (refreshProcess) return refreshProcess
  
  const { default: api } = await import('@/api')
  
  refreshProcess = api.authApi
    .refresh({})
    .then((result) => {
      if (result.data.code === 200) {
        localStorage.setItem('token', result.data.token.access)
        return true
      }
      return false
    })
    .catch(() => {
      return false
    })
    .finally(() => {
      refreshProcess = null
    })
  return refreshProcess
}

const requests = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

requests.interceptors.request.use(
  (config) => {
    config.headers.Authorization = localStorage.getItem('token') || ''
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

requests.interceptors.response.use(
  async (response) => {
    return response
  },
  async(error) => {
    const originalConfig = error.response?.config
    const url = originalConfig?.url || "";
    const isLoginApi = url.includes("/login");
    if (error.response?.status === 401 && originalConfig && !originalConfig._retry && !isLoginApi) {
      originalConfig._retry = true
      const success = await refreshToken()
      if (success) {
        return requests(error.response?.config)
      } else {
        const { default: router } = await import('@/router')
        await router.push('/login')
      }
    }
    return Promise.reject(error)
  },
)

const get = (url: string, data: Record<string, unknown>) => {
  return requests.get(url, { params: data })
}

const post = (url: string, data: Record<string, unknown>) => {
  return requests.post(url, data)
}

const del = (url: string, data: Record<string, unknown>) => {
  return requests.delete(url, { data })
}

const put = (url: string, data: Record<string, unknown>) => {
  return requests.put(url, data)
}

const patch = (url: string, data: Record<string, unknown>) => {
  return requests.patch(url, data)
}

const getBaseUrl = (): string => {
  return BASE_URL
}
const getWsBaseUrl = (): string => {
  return BASE_WS_URL
}
export default {
  requests,
  get,
  post,
  del,
  put,
  patch,
  getBaseUrl,
  getWsBaseUrl,
  request_error
}
