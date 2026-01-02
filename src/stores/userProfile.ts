import { defineStore } from 'pinia'
import { reactive } from 'vue'
import api from '@/api/index'

export const userProfile = defineStore('userProfile', () => {
  const user = reactive({
    id: 0,
    account: '',
    name: '',
    email: '',
    status: null,
    phone_number: null,
    create_date: null,
    remark: null,
    avatar: '',
  })
  const getuser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const result = await api.userApi.userInfo()
    if (result.data.code == 200) {
      Object.assign(user, result.data.data)
    }
    user.avatar =
      'https://ui-avatars.com/api/?name=' + user.name + '&background=random&color=fff&size=256'
  }
  const clear = async () => {
    Object.assign(user, {
      id: 0,
      account: '',
      name: '',
      email: '',
      status: null,
      phone_number: null,
      create_date: null,
      remark: null,
      avatar: '',
    })
  }
  return {
    user,
    getuser,
    clear,
  }
})
