import axios from 'axios'
import qs from 'qs'
import { useApi } from '@/composables'

interface RequestAccessLog {
  excludeTest?: boolean
  startDate?: string
  endDate?: string
  eventType?: number
  pgType?: number
  searchType?: string
  searchText?: string
}

interface RequestAccessLogWithPaging {
  page?: number
  size?: number
  excludeTest?: boolean
  startDate?: string
  endDate?: string
  eventType?: number
  pgType?: number
  searchType?: string
  searchText?: string
}

export interface SearchWithPagingData {
  id: number
  hospitalId: string
  hospitalName: string
  workDatetime: string
  userId: string
  patientUid: string
  ip: string
  macAddress: string
  pcName: string
  eventType: string
  rootMenu: string | null
  viewId: string | null
  viewName: string | null
  log: string
  logDetail: string
  etc: string
  workType: string
  version: string
  programType: string
}

export interface SearchData {
  id: number
  workDatetime: string
  programType: string
  workType: string
  version: string
  eventType: string
  rootMenu: string | null
  viewId: string | null
  viewName: string | null
  log: string
  logDetail: string
  etc: string
  hospitalId: string
  hospitalName: string
  pcName: string
  loadingSpeed: string
}

export interface AccessLogData {
  hospitalId: string
  hospitalName: string
  workDatetime: string
  userId: string
  patientUid: string
  ip: string
  macAddress: string
  pcName: string
  eventType: string
  rootMenu: string
  viewId: string
  workType: string
  version: string
  programType: string
  loadingSpeed: string
  description: string
}

export const AccessLogService = {
  async getAccessLogsWithConditionAndPaging(
    page?: number,
    size?: number,
    excludeTest?: boolean,
    startDate?: string,
    endDate?: string,
    eventType?: number,
    pgType?: number,
    searchType?: string,
    searchText?: string
  ) {
    const params: RequestAccessLogWithPaging = {}

    params.page = page
    params.excludeTest = excludeTest
    if (size) params.size = size
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (eventType !== undefined && eventType !== null) params.eventType = eventType
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, RequestAccessLogWithPaging>(
      '/api/internal-api/v1/access-logs/search-with-paging',
      {
        params,
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: 'repeat' })
        }
      }
    )

    return data.value.data
  },

  async getAccessLogsWithCondition(
    excludeTest?: boolean,
    startDate?: string,
    endDate?: string,
    eventType?: number,
    pgType?: number,
    searchType?: string,
    searchText?: string
  ) {
    const params: RequestAccessLog = {}

    params.excludeTest = excludeTest
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (eventType !== undefined && eventType !== null) params.eventType = eventType
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, RequestAccessLog>(
      '/api/internal-api/v1/access-logs/search',
      {
        params,
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: 'repeat' })
        }
      }
    )

    return data.value.data
  },

  async getAccessLogWithPc(id: number) {
    const { data } = await useApi<any, number>('/api/internal-api/v1/access-logs/with-pc/' + id)
    return data
  }
}
