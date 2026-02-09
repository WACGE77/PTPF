export interface User{
  id?: number
  account?:string
  name?: string
  email?: string
  password?: string
  status?: boolean
  protected?:boolean
  phone_number?: string
  avatar?: string
  create_date?: string
  update_date?: string
  login_date?: string
  remark?: string
  roles?: number[]
}
export interface Role{
  id?: number
  name?: string
  code?: string
  description?:string
  status?:boolean
  protected?: boolean
  create_date?: string
  update_date?: string
}
