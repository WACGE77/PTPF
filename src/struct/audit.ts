interface AuditTime{
  start_time: string,
  end_time: string,
}
interface User{
  id: number,
  name: string
}
interface Resource{
  id: number,
  name: string
  ip: string
}
interface Voucher{
  id: number,
  username: string
}
export interface SessionRecord extends AuditTime {
  id?: number,
  user?: User,
  resource?: Resource,
  voucher?: Voucher,
  status?:string,
  ip?: string
}
export interface LoginRecord extends AuditTime {
  id?: number,
  user?: User,
  ip?: string
  status?:string,
  date?:string
}
