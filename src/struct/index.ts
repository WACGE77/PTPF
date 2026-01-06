//HomeView-----------------------------------------------------
export interface MenuItemObject {
  id: number
  name: string
  path: string
  component: string
  icon: string
  children?: MenuItemObject[]
}
//OverView------------------------------------------------------
interface ItemRecord {
  id: number
  name?: string
  username?: string
  ipv4?: string
  ipv6?: string
}
export interface LoginRecord {
  id: number
  ip: string
  user: ItemRecord
  status: string
  date: string
}
export interface SessionRecord {
  id: number
  user: ItemRecord
  resource: ItemRecord
  voucher: ItemRecord
  start_time: string
  end_time: string | null
  status: string
  ip: string
}
export interface OperationRecord {
  id: number
  user: ItemRecord
  ip: string
  operation: string
  status: boolean
  date: string
}

//Role-----------------------------------------------------
export interface Role {
  id?: number
  name: string
  code: string
  description: string
  create_date?: string
  protected?: boolean
}
//User---------------------------------------------
export interface User {
  id?: number
  account: string
  name: string
  password?: string
  email: string
  status: boolean
  phone_number?: string | null
  create_date: string
  remark: string | null
  protected?: boolean
}
export interface UserFormRules {
  account?: { required: boolean; message: string; trigger: string }[]
  name?: { required: boolean; message: string; trigger: string }[]
  email?: { required: boolean; message: string; trigger: string }[]
  phone_number?: { required: boolean; message: string; trigger: string }[]
  password?: { required: boolean; message: string; trigger: string | string[] }[]
}
//Voucher-------------------------------------------
export interface Voucher {
  id?: number
  auth_type?: string
  code: string
  username: string
  password?: string
  private_key?: string
  description?: string
  create_date?: string
  create_user?: string
}
//Resource-------------------------------------------
export interface Resource {
  id: number
  name: string
  code: string
  ipv4_address: string | null
  ipv6_address: string | null
  domain: string | null
  port: number
  status: boolean
  is_production: boolean
  description: string | null
  create_date: string
  vouchers?: Voucher[]
}
//Terminal-------------------------------------------
export interface TerminalData {
  type: number
  data: TerminalAuth | string | TerminalResize
}
export interface TerminalAuth {
  token: string
  resource_id: number
  voucher_id: number
}
export interface TerminalResize {
  cols: number
  rows: number
}
