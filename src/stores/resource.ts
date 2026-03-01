import { defineStore } from 'pinia'
import { reactive } from 'vue'
import api from '@/api/index'
import requests from '@/requests'
import type { ResourceGroup, Resource, Voucher, TreeNode } from '@/struct/resource'

const request_error = requests.request_error

export const resourceStore = defineStore('resource', () => {
  const groups = reactive<ResourceGroup[]>([])
  const resources = reactive<Resource[]>([])
  const vouchers = reactive<Voucher[]>([])
  const treeData = reactive<TreeNode[]>([])

  const getGroups = async (refresh = false) => {
    if (!refresh && groups.length > 0) return groups
    try {
      const res = await api.groupApi.getGroup({ all: true })
      if (res.data.code === 200) {
        groups.splice(0, groups.length, ...res.data.detail)
        buildTreeData()
        return groups
      }
    } catch (err) {
      request_error(err)
    }
    return []
  }

  const getResources = async (refresh = false) => {
    if (!refresh && resources.length > 0) return resources
    try {
      const res = await api.resourceApi.getResource({ all: true })
      if (res.data.code === 200) {
        resources.splice(0, resources.length, ...res.data.detail)
        return resources
      }
    } catch (err) {
      request_error(err)
    }
    return []
  }

  const getVouchers = async (refresh = false) => {
    if (!refresh && vouchers.length > 0) return vouchers
    try {
      const res = await api.voucherApi.getVoucher({ all: true })
      if (res.data.code === 200) {
        vouchers.splice(0, vouchers.length, ...res.data.detail)
        return vouchers
      }
    } catch (err) {
      request_error(err)
    }
    return []
  }

  const loadAll = async () => {
    await Promise.all([getGroups(true), getResources(true), getVouchers(true)])
    buildTreeData()
  }

  // 通用的树构建方法，支持指定包含的节点类型
  const buildTree = (includeTypes: ('resource' | 'voucher')[] = ['resource', 'voucher']): TreeNode[] => {
    const groupMap = new Map<number, TreeNode>()
    
    // 构建组节点
    groups.forEach(g => {
      groupMap.set(g.id, {
        id: g.id,
        label: g.name,
        type: 'group',
        children: [],
        data: g
      })
    })

    // 构建组之间的父子关系
    const rootGroups: TreeNode[] = []
    groups.forEach(g => {
      const node = groupMap.get(g.id)!
      if (g.parent && groupMap.has(g.parent)) {
        groupMap.get(g.parent)!.children!.push(node)
      } else {
        rootGroups.push(node)
      }
    })

    // 根据类型添加资源节点
    if (includeTypes.includes('resource')) {
      resources.forEach(r => {
        const resourceNode: TreeNode = {
          id: r.id,
          label: r.name,
          type: 'resource',
          children: [],
          data: r
        }
        const groupNode = groupMap.get(r.group)
        if (groupNode) {
          groupNode.children!.push(resourceNode)
        } else {
          rootGroups.push(resourceNode)
        }
      })
    }

    // 根据类型添加凭证节点
    if (includeTypes.includes('voucher')) {
      vouchers.forEach(v => {
        const voucherNode: TreeNode = {
          id: v.id,
          label: v.name,
          type: 'voucher',
          data: v
        }
        const groupNode = groupMap.get(v.group)
        if (groupNode) {
          groupNode.children!.push(voucherNode)
        } else {
          rootGroups.push(voucherNode)
        }
      })
    }

    return rootGroups
  }

  // 构建完整的树形数据（包含资源和凭证）
  const buildTreeData = () => {
    const result = buildTree(['resource', 'voucher'])
    treeData.splice(0, treeData.length, ...result)
  }

  // 便捷方法：构建只包含资源的树
  const buildResourceTree = (): TreeNode[] => {
    return buildTree(['resource'])
  }

  // 便捷方法：构建只包含凭证的树
  const buildVoucherTree = (): TreeNode[] => {
    return buildTree(['voucher'])
  }

  const getResourcesByGroup = (groupId: number) => {
    return resources.filter(r => r.group === groupId)
  }

  const getVouchersByGroup = (groupId: number) => {
    return vouchers.filter(v => v.group === groupId)
  }

  const getVouchersByResource = (resourceId: number) => {
    const resource = resources.find(r => r.id === resourceId)
    return resource?.vouchers || []
  }

  const addGroup = async (data: Record<string, unknown>) => {
    await api.groupApi.addGroup(data)
    await getGroups(true)
  }

  const updateGroup = async (data: Record<string, unknown>) => {
    await api.groupApi.updateGroup(data)
    await getGroups(true)
  }

  const deleteGroup = async (idList: number[]) => {
    await api.groupApi.deleteGroup({ id_list: idList })
    await loadAll()
  }

  const addResource = async (data: Record<string, unknown>) => {
    await api.resourceApi.addResource(data)
    await getResources(true)
  }

  const updateResource = async (data: Record<string, unknown>) => {
    await api.resourceApi.updateResource(data)
    await getResources(true)
  }

  const deleteResource = async (idList: number[]) => {
    await api.resourceApi.deleteResource({ id_list: idList })
    await getResources(true)
  }

  const addVoucher = async (data: Record<string, unknown>) => {
    await api.voucherApi.addVoucher(data)
    await getVouchers(true)
  }

  const updateVoucher = async (data: Record<string, unknown>) => {
    await api.voucherApi.updateVoucher(data)
    await getVouchers(true)
  }

  const deleteVoucher = async (idList: number[]) => {
    await api.voucherApi.deleteVoucher({ id_list: idList })
    await getVouchers(true)
  }

  return {
    groups,
    resources,
    vouchers,
    treeData,
    getGroups,
    getResources,
    getVouchers,
    loadAll,
    getResourcesByGroup,
    getVouchersByGroup,
    getVouchersByResource,
    addGroup,
    updateGroup,
    deleteGroup,
    addResource,
    updateResource,
    deleteResource,
    addVoucher,
    updateVoucher,
    deleteVoucher,
    buildTree,
    buildResourceTree,
    buildVoucherTree
  }
})
