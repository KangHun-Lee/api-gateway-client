import axios from 'axios'
import { useApi } from '@/composables'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

interface requestNoticesWithPaging {
  page?: number
  size?: number
  searchText?: string
  pgType?: number
}

interface CreateNotices {
  id?: number
  pgType: number
  title: string
  content: string
  userId?: number
  noticeStartDate?: string
  noticeEndDate?: string
  index?: number
}

export interface notices {
  id: number
  pgType: number
  pgTypeName: number
  title: string
  content: string
  userId: number
  noticeStartDate?: string
  noticeEndDate?: string
  index?: number
  saveDateTime: string
}

export interface user {
  id: number
  employeeNo: string
  name: string
  departmentName: string
  positionName: string
  email: string
}

export interface noticesUserInfo {
  notices: notices
  user: user
}

export interface noticesIndex {
  id: number
  index: number
}

interface swapNoticeList {
  firstNotices: noticesIndex
  secondNotices: noticesIndex
}

export const NoticesService = {
  async saveNotices(
    pgType: number,
    title: string,
    content: string,
    noticeStartDate?: string,
    noticeEndDate?: string
  ) {
    const userId = authStore.user?.id
    const params: CreateNotices = { pgType, title, content, userId }

    if (noticeStartDate) params.noticeStartDate = noticeStartDate
    if (noticeEndDate) params.noticeEndDate = noticeEndDate

    await axios.post('/api/internal-api/v1/notices', params)
  },
  async updateNotices(
    id: number,
    pgType: number,
    title: string,
    content: string,
    noticeStartDate?: string,
    noticeEndDate?: string,
    index?: number
  ) {
    const userId = authStore.user?.id

    const params: CreateNotices = { id, pgType, title, content, userId }

    if (noticeStartDate) params.noticeStartDate = noticeStartDate
    if (noticeEndDate) params.noticeEndDate = noticeEndDate
    if (index) params.index = index

    await axios.put('/api/internal-api/v1/notices', params)
  },
  async deleteNoticesList(ids: number[]) {
    await axios.put('/api/internal-api/v1/notices/delete', ids)
  },
  async getNoticeUserInfoList() {
    const { data } = await useApi<any, any>('/api/internal-api/v1/notices')

    return data.value.data
  },
  async swapIndex(firstNotices: noticesIndex, secondNotices: noticesIndex) {
    const params: swapNoticeList = { firstNotices, secondNotices }
    await axios.put('/api/internal-api/v1/notices/swapIndex', params)
  },
  async geteNoticeUserInfoListWithConditionAndPaging(
    page: number,
    size: number,
    searchText: string,
    pgType: number
  ) {
    const params: requestNoticesWithPaging = { page, size, searchText, pgType }

    const { data } = await useApi<any, requestNoticesWithPaging>(
      '/api/internal-api/v1/notices/search-with-paging',
      { params }
    )

    return data.value.data
  },
  async getNoticesWithId(id: number) {
    const { data } = await useApi<any, number>('/api/internal-api/v1/notices/' + id)

    return data.value.data
  }
}
