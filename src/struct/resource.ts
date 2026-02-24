export interface ResourceGroup {
  id: number
  name: string
  description: string | null
  create_date: string
  update_date: string
  level: number
  parent: number | null
  root: number
}

export interface Voucher {
  id: number
  name: string
  username: string
  description: string | null
  create_date: string
  update_date: string
  group: number
}

export interface Resource {
  id: number
  name: string
  status: boolean
  ipv4_address: string
  ipv6_address: string | null
  domain: string | null
  port: number
  description: string | null
  create_date: string
  update_date: string
  group: number
  protocol: number
  vouchers: Voucher[]
}

export interface TreeNode {
  id: number
  label: string
  type: 'group' | 'resource' | 'voucher'
  children?: TreeNode[]
  data: ResourceGroup | Resource | Voucher
}
