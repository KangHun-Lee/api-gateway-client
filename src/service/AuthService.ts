import axios from 'axios'
import qs from 'qs'
import { useApi } from '@/composables'

interface RequestLogin {
  employeeNo: string
  password: string
}

export const AuthService = {
  async getLogs() {
    return await axios.get('/api/internal-api/v1/logs')
  },

  async siginIn(employeeNo: string, password: string) {
    const { data } = await axios.post('/api/auth/v1/login', {
      employeeNo: employeeNo,
      password: password
    })

    return data.value.data
  },
  async loadInfo() {
    const { data } = await axios.get('/api/auth/v1/my-info')

    return data.value.data
  }
}
