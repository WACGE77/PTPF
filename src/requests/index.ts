import router from '@/router'
import axios from 'axios'
import api from '@/api'
import { ElMessage } from 'element-plus'
const BASE_URL = 'http://localhost:8000/api'
const BASE_WS_URL = 'ws://localhost:8000/api'
let refreshProcess: Promise<boolean> | null = null
export const request_error = (error:any) => {
  let errMsg:string = ""
  
  // 检查error是否直接是错误信息
  if (typeof error === 'string') {
    errMsg = error
  } else if (typeof error === 'object' && error !== null) {
    // 如果error是对象，尝试获取其中的错误信息
    if (error.response) {
      // 处理API响应错误
      const detail = error.response.data.detail
      if(Array.isArray(detail)){
        errMsg = detail[0]
      }else if(typeof detail === 'object'){
        errMsg = Object.values(detail)[0] as string
      }else if(typeof detail === 'string') {
        errMsg = detail
      } else if (typeof error.response.data === 'string') {
        // 直接使用响应数据作为错误信息
        errMsg = error.response.data
      }
    } else if (error.message) {
      // 使用error.message作为错误信息
      errMsg = error.message
    } else {
      // 尝试将对象转换为字符串
      errMsg = JSON.stringify(error)
    }
  } else {
    // 其他情况，使用默认错误信息
    errMsg = '未知错误'
  }
  
  ElMessage.error(errMsg)
}
const refreshToken = () => {
  if (refreshProcess) return refreshProcess
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
    console.log('发送API请求:', config.url)
    console.log('请求头:', config.headers)
    config.headers.Authorization = localStorage.getItem('token') || ''
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  },
)

requests.interceptors.response.use(
  async (response) => {
    console.log('API响应:', response.config.url, response.status)
    console.log('响应数据:', response.data)
    return response
  },
  async(error) => {
    console.error('响应错误:', error.config?.url, error.response?.status)
    console.error('错误信息:', error.message)
    const originalConfig = error.response?.config
    const url = originalConfig?.url || "";
    const isLoginApi = url.includes("/login");
    if (error.response?.status === 401 && originalConfig && !originalConfig._retry && !isLoginApi) {
      originalConfig._retry = true
      const success = await refreshToken()
      if (success) {
        return requests(error.response?.config)
      } else {
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
