import requests from '@/requests'

const userApi = {
  getUser: (data: Record<string, unknown>) => requests.post('/rbac/user/list/', data),
  addtUser: (data: Record<string, unknown>) => requests.post('/rbac/user/add/', data),
  deleteUser: (data: Record<string, unknown>) => requests.post('/rbac/user/delete/', data),
  updateUser: (data: Record<string, unknown>) => requests.post('/rbac/user/modify/', data),
}

const roleApi = {
  getRole: (data: Record<string, unknown>) => requests.post('/rbac/role/list/', data),
  addtRole: (data: Record<string, unknown>) => requests.post('/rbac/role/add/', data),
  deleteRole: (data: Record<string, unknown>) => requests.post('/rbac/role/delete/', data),
  updateRole: (data: Record<string, unknown>) => requests.post('/rbac/role/modify/', data),
}

const resourceApi = {
  getResource: (data: Record<string, unknown>) => requests.post('/resource/resource/list/', data),
  addtResource: (data: Record<string, unknown>) => requests.post('/resource/resource/add/', data),
  deleteResource: (data: Record<string, unknown>) =>
    requests.post('/resource/resource/delete/', data),
  updateResource: (data: Record<string, unknown>) =>
    requests.post('/resource/resource/modify/', data),
}

const voucherApi = {
  getVoucher: (data: Record<string, unknown>) => requests.post('/resource/voucher/list/', data),
  addtVoucher: (data: Record<string, unknown>) => requests.post('/resource/voucher/add/', data),
  deleteVoucher: (data: Record<string, unknown>) =>
    requests.post('/resource/voucher/delete/', data),
  updateVoucher: (data: Record<string, unknown>) =>
    requests.post('/resource/voucher/modify/', data),
}

const authApi = {
  login: (data: Record<string, unknown>) => requests.post('/rbac/login/', data),
  logout: (data: Record<string, unknown>) => requests.post('/rbac/logout/', data),
  refresh: (data: Record<string, unknown>) => requests.post('/rbac/refresh/', data),
}

const permissionApi = {
  getPermission: (data: Record<string, unknown>) => requests.post('/rbac/perm/', data),
  getRolePermission: (role_id: number, data: Record<string, unknown>) =>
    requests.post('/perm/base-auth/' + role_id + '/get/', data),
  setRolePermission: (data: Record<string, unknown>) => requests.post('/perm/base-auth/mod/', data),
  getUserRole: (user_id: number, data: Record<string, unknown>) =>
    requests.post('/perm/role-bind/' + user_id + '/modify/', data),
}

const auditApi = {
  getAllLogin: (data: Record<string, unknown>) => requests.post('/audit/all/login/', data),
  getALLOpera: (data: Record<string, unknown>) => requests.post('/audit/all/opera/', data),
  getAllSession: (data: Record<string, unknown>) => requests.post('/audit/all/session/', data),
  getSelfLogin: (data: Record<string, unknown>) => requests.post('/audit/self/login/', data),
  getSelfOpera: (data: Record<string, unknown>) => requests.post('/audit/self/opera/', data),
  getSelfSession: (data: Record<string, unknown>) => requests.post('/audit/self/session/', data),
}

export default {
  userApi,
  roleApi,
  resourceApi,
  voucherApi,
  authApi,
  permissionApi,
  auditApi,
}
