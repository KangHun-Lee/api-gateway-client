import axios from 'axios'
import { useApi } from '@/composables'

interface CreateRoleScreenAccess {
  roleId: number
  screenIdList: number[]
}

interface RequestAccountInfoWithPaging {
  page?: number
  size?: number
  searchText?: string
}
export interface RoleScreenAccessData {
  id: number
  roleId: number
  screenId: number
}

export interface userResponse {
  id: number
  employeeNo: string
  name: string
  email: string
  departmentName: string
  positionName: string
}

export interface roleScreenAccessResponse {
  id: number
  roleId: number
  screenId: number
}

export interface userAuthResponse {
  id: number
  userId: number
  roleId: number
}
export interface userAuthRequest {
  id: number
  roleId: number
}

export const AccessScreenService = {
  async getRoleList() {
    const { data } = await useApi<any, any>('/api/internal-api/v1/roles')

    return data.value.data
  },

  async getScreensWithRole(id: number) {
    const { data } = await useApi<any, number>('/api/internal-api/v1/access-screens/role/' + id)

    return data.value.data
  },
  async saveRoleScreenAccess(roleId: number, screenIdList: number[]) {
    const params: CreateRoleScreenAccess = { roleId, screenIdList }

    await axios.post(`/api/internal-api/v1/access-screens/role`, params)
  },

  async getAccountInfosWithConditionAndPaging(page: number, size: number, searchText: string) {
    const params: RequestAccountInfoWithPaging = {}

    params.page = page
    params.size = size
    params.searchText = searchText

    const { data } = await useApi<any, RequestAccountInfoWithPaging>(
      '/api/internal-api/v1/access-screens/users/search-with-paging',
      { params }
    )

    return data.value.data
  },
  async updateUserRoleAccess(userAuthList: userAuthRequest[]) {
    await axios.post('/api/internal-api/v1/auth', userAuthList)
  }
}
