import { ref, reactive, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import requests from '@/requests'

export interface PaginationConfig {
  pageSize?: number
  pageSizes?: number[]
}

export interface UseTableOptions<T> {
  apiPath: string
  pagination?: PaginationConfig
  defaultSearchParams?: Record<string, any>
}

export function useTable<T = any>(options: UseTableOptions<T>) {
  const {
    apiPath,
    pagination = { pageSize: 10, pageSizes: [10, 20, 50, 100] },
    defaultSearchParams = {}
  } = options

  const loading = ref(false)
  const data = ref<T[]>([]) as Ref<T[]>
  const currentPage = ref(1)
  const pageSize = ref(pagination.pageSize || 10)
  const total = ref(0)

  const searchParams = reactive<Record<string, any>>({ ...defaultSearchParams })

  const loadData = async (extraParams?: Record<string, any>) => {
    try {
      loading.value = true
      const params: any = {
        page_number: currentPage.value,
        page_size: pageSize.value,
        ...searchParams,
        ...extraParams
      }

      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key]
        }
      })

      const res = await requests.get(apiPath, params)
      if (res.data.code === 200) {
        data.value = res.data.detail || []
        total.value = res.data.total || 0
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
    } finally {
      loading.value = false
    }
  }

  const search = () => {
    currentPage.value = 1
    loadData()
  }

  const reset = (newParams?: Record<string, any>) => {
    Object.keys(searchParams).forEach(key => {
      searchParams[key] = defaultSearchParams[key] ?? ''
    })
    if (newParams) {
      Object.assign(searchParams, newParams)
    }
    currentPage.value = 1
    loadData()
  }

  const refresh = () => {
    loadData()
  }

  return {
    loading,
    data,
    currentPage,
    pageSize,
    total,
    searchParams,
    loadData,
    search,
    reset,
    refresh
  }
}
