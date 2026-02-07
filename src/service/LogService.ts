import axios from 'axios'
import qs from 'qs'
import { useApi } from '@/composables'

interface RequestLog {
  excludeTest?: boolean
  eventTypes?: number[]
  startDate?: string
  endDate?: string
  pgType?: number
  searchType?: string
  searchText?: string
}

interface RequestLogWithPaging {
  page?: number
  size?: number
  excludeTest?: boolean
  eventTypes?: number[]
  startDate?: string
  endDate?: string
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
}

export interface LogData {
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
  errorCode: string
  log: string
  logDetail: string | null
  etc: string | null
  workType: string
  version: string
  programType: string
}

export const LogService = {
  async getLogs() {
    return await axios.get('/api/internal-api/v1/logs')
  },

  async getLogsWithCondition(
    excludeTest?: boolean,
    eventTypes?: number[],
    startDate?: string,
    endDate?: string,
    pgType?: number,
    searchType?: string,
    searchText?: string
  ) {
    const params: RequestLog = {}

    params.excludeTest = excludeTest
    if (eventTypes) params.eventTypes = eventTypes
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, RequestLog>('/api/internal-api/v1/logs/search', {
      params,
      paramsSerializer: (params) => {
        return qs.stringify(params, { arrayFormat: 'repeat' })
      }
    })

    return data.value.data
  },

  async getLogsWithConditionForChart(
    excludeTest?: boolean,
    eventTypes?: number[],
    startDate?: string,
    endDate?: string,
    pgType?: number,
    searchType?: string,
    searchText?: string
  ) {
    const params: RequestLog = {}

    params.excludeTest = excludeTest
    if (eventTypes) params.eventTypes = eventTypes
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, RequestLog>('/api/internal-api/v1/logs/search-for-chart', {
      params,
      paramsSerializer: (params) => {
        return qs.stringify(params, { arrayFormat: 'repeat' })
      }
    })

    return data.value.data
  },

  async getLogsWithConditionAndPaging(
    page?: number,
    size?: number,
    excludeTest?: boolean,
    eventTypes?: number[],
    startDate?: string,
    endDate?: string,
    pgType?: number,
    searchType?: string,
    searchText?: string
  ) {
    const params: RequestLogWithPaging = {}

    params.page = page
    params.excludeTest = excludeTest
    if (size) params.size = size
    if (eventTypes) params.eventTypes = eventTypes
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, RequestLogWithPaging>(
      '/api/internal-api/v1/logs/search-with-paging',
      {
        params,
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: 'repeat' })
        }
      }
    )

    return data.value.data
  },

  getLog(id: number) {
    return axios.get('/api/internal-api/v1/logs/' + id)
  },

  async getLogWithPc(id: number) {
    const { data } = await useApi<any, number>('/api/internal-api/v1/logs/with-pc/' + id)
    return data
  }
}
