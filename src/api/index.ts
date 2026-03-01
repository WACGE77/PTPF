import requests from '@/requests'

const userApi = {
  getUser: (data: Record<string, unknown>) => requests.get('/rbac/user/get/', data),
  addUser: (data: Record<string, unknown>) => requests.post('/rbac/user/add/', data),
  deleteUser: (data: Record<string, unknown>) => requests.post('/rbac/user/del/', data),
  updateUser: (data: Record<string, unknown>) => requests.post('/rbac/user/edit/', data),
  resetPassword: (data: Record<string, unknown>) => requests.post('/rbac/user/reset-password/', data),
  userInfo: () => requests.get('/rbac/user/detail/', {}),
  bind:(data:Record<string, unknown>) => requests.post('rbac/user/role/',data)
}

const roleApi = {
  getRole: (data: Record<string, unknown>) => requests.get('/rbac/role/get/', data),
  addRole: (data: Record<string, unknown>) => requests.post('/rbac/role/add/', data),
  deleteRole: (data: Record<string, unknown>) => requests.post('/rbac/role/del/', data),
  updateRole: (data: Record<string, unknown>) => requests.post('/rbac/role/edit/', data)
}

const groupApi = {
  getGroup:(data: Record<string, unknown>) => requests.get('/resource/group/get/',data),
  deleteGroup:(data: Record<string, unknown>) => requests.post('/resource/group/del/',data),
  updateGroup:(data: Record<string, unknown>) => requests.post('/resource/group/edit/',data),
  addGroup:(data: Record<string, unknown>) => requests.post('/resource/group/add/',data)
}

const resourceApi = {
  getResource: (data: Record<string, unknown>) => requests.get('/resource/resource/get/', data),
  addResource: (data: Record<string, unknown>) => requests.post('/resource/resource/add/', data),
  deleteResource: (data: Record<string, unknown>) =>
    requests.post('/resource/resource/del/', data),
  updateResource: (data: Record<string, unknown>) =>
    requests.post('/resource/resource/edit/', data)
}

const voucherApi = {
  getVoucher: (data: Record<string, unknown>) => requests.get('/resource/voucher/get/', data),
  addVoucher: (data: Record<string, unknown>) => requests.post('/resource/voucher/add/', data),
  deleteVoucher: (data: Record<string, unknown>) =>
    requests.post('/resource/voucher/del/', data),
  updateVoucher: (data: Record<string, unknown>) =>
    requests.post('/resource/voucher/edit/', data),
}

const authApi = {
  login: (data: Record<string, unknown>) => requests.post('/rbac/login/', data),
  logout: () => requests.post('/rbac/logout/', {}),
  refresh: (data: Record<string, unknown>) => requests.post('/rbac/refresh/', data),
}

const permissionApi = {
  getSystemPermission:(data:Record<string, unknown>) => requests.get('/rbac/role/get/permission/',data),
  setSystemPermission:(data:Record<string, unknown>) => requests.post('/rbac/role/edit/permission/',data),
  getGroupPermission:(data:Record<string, unknown>) => requests.post('/rbac/group-auth/edit/',data),
  userBind:(data:Record<string, unknown>) => requests.post('/rbac/user/role/',data),
  getPermissionList:(data:Record<string, unknown>) => requests.get('/rbac/perm/',data)
}

const auditApi = {
  loginLog: (data:Record<string, unknown>) => requests.get('/audit/login/get/',data),
  operaLog: (data:Record<string, unknown>) => requests.get('/audit/opera/get/',data),
  sessionLog: (data:Record<string, unknown>) => requests.get('/audit/session/get/',data)
}

const routeApi = {
  getRoutes: () => {
    console.log('调用getRoutes API...')
    return requests.get('/rbac/routes/', {})
  } 
}

export default {
  userApi,
  roleApi,
  groupApi,
  permissionApi,
  resourceApi,
  voucherApi,
  authApi,
  auditApi,
  routeApi
}
