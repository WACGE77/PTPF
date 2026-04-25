import { ElMessage, ElMessageBox } from 'element-plus'

export function toastSuccess(message: string) {
  ElMessage.success(message)
}

export function toastError(message: string) {
  ElMessage.error(message)
}

export function alertSuccess(message: string, title = '成功') {
  return ElMessageBox.alert(message, title, { confirmButtonText: '确定', type: 'success' })
}

export function alertError(message: string, title = '失败') {
  return ElMessageBox.alert(message, title, { confirmButtonText: '确定', type: 'error' })
}

export function alertInfo(message: string, title = '提示') {
  return ElMessageBox.alert(message, title, { confirmButtonText: '确定', type: 'info' })
}

export function confirm(message: string, title = '确认') {
  return ElMessageBox.confirm(message, title, { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
}

export default {
  toastSuccess,
  toastError,
  alertSuccess,
  alertError,
  alertInfo,
  confirm
}
