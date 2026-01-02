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
