import router from '@/router'
import axios from 'axios'
import api from '@/api'
const BASE_URL = 'http://106.13.85.137:8000/api'
const BASE_WS_URL = 'ws://106.13.85.137:8000/api'
let refreshProcess: Promise<boolean> | null = null

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
    if (error.response?.status === 401 && originalConfig && !originalConfig._retry) {
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
}
