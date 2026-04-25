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
    requests.post('/resource/resource/edit/', data),

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
  getGroupPermission:(data:Record<string, unknown>) => requests.get('/perm/group-auth/get/',data),
  setGroupPermission:(data:Record<string, unknown>) => requests.post('/perm/group-auth/edit/',data),
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

const smtpApi = {
  getCurrent: () => requests.get('/alert/smtp/current/', {}),
  getSmtp: (data: Record<string, unknown>) => requests.get('/alert/smtp/get/', data),
  addSmtp: (data: Record<string, unknown>) => requests.post('/alert/smtp/add/', data),
  deleteSmtp: (data: Record<string, unknown>) => requests.post('/alert/smtp/del/', data),
  updateSmtp: (data: Record<string, unknown>) => requests.post('/alert/smtp/edit/', data),
  testEmail: (data: Record<string, unknown>) => requests.requests.post('/alert/smtp/test-email/', data, { timeout: 15000 }),
}

const alertMethodApi = {
  getAlertMethod: (data: Record<string, unknown>) => requests.get('/alert/method/get/', data),
  addAlertMethod: (data: Record<string, unknown>) => requests.post('/alert/method/add/', data),
  deleteAlertMethod: (data: Record<string, unknown>) => requests.post('/alert/method/del/', data),
  updateAlertMethod: (data: Record<string, unknown>) => requests.post('/alert/method/edit/', data),
}

const alertTemplateApi = {
  getAlertTemplate: (data: Record<string, unknown>) => requests.get('/alert/template/get/', data),
  addAlertTemplate: (data: Record<string, unknown>) => requests.post('/alert/template/add/', data),
  deleteAlertTemplate: (data: Record<string, unknown>) => requests.post('/alert/template/del/', data),
  updateAlertTemplate: (data: Record<string, unknown>) => requests.post('/alert/template/edit/', data),
}

const probeRuleApi = {
  getProbeRule: (data: Record<string, unknown>) => requests.get('/alert/rule/get/', data),
  addProbeRule: (data: Record<string, unknown>) => requests.post('/alert/rule/add/', data),
  deleteProbeRule: (data: Record<string, unknown>) => requests.post('/alert/rule/del/', data),
  updateProbeRule: (data: Record<string, unknown>) => requests.post('/alert/rule/edit/', data),
  toggleProbeRule: (id: number) => requests.post(`/alert/rule/${id}/toggle/`, {}),
}

const probeLogApi = {
  getProbeLog: (data: Record<string, unknown>) => requests.get('/alert/log/get/', data),
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
  routeApi,
  smtpApi,
  alertMethodApi,
  alertTemplateApi,
  probeRuleApi,
  probeLogApi
}
