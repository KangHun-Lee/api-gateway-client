import axios from 'axios'
import { useApi } from '@/composables'

interface Pc {
  excludeTest?: boolean
  pgType?: number
  searchType?: string
  searchText?: string
}

interface PcRequestWithPage {
  page?: number
  size?: number
  excludeTest?: boolean
  pgType?: number
  searchType?: string
  searchText?: string
}

interface DateRangeRequest {
  startDate?: string
  endDate?: string
}

interface MultiSearch {
  excludeTest?: boolean
  pgType?: number
  workType?: number
  perfSpecName?: string
  searchType?: string
  searchText?: string
}

interface MultiSearchWithPage {
  page?: number
  size?: number
  excludeTest?: boolean
  pgType?: number
  workType?: number
  perfSpecName?: string
  searchType?: string
  searchText?: string
}

export interface PcData {
  id: number
  hospitalId: string
  hospitalName: string
  ip: string
  macAddress: string
  pcName: string
  cpu: string
  memory: string
  gpu: string
  os: string
  workTypeName: string
  pgTypeName: string
  firstDatetime: string // ISO 8601 날짜 문자열
  lastDatetime: string // ISO 8601 날짜 문자열
}

export interface DataEntry {
  id: number
  hospitalId: string
  hospitalName: string
  ip: string
  macAddress: string
  pcName: string
  cpu: string
  memory: string
  gpu: string
  os: string
  workTypeName: string
  pgTypeName: string
  version: string
  perfSpecScore: string
  firstDatetime: string
  lastDatetime: string
  monResol: string
  perfSpecName: string
}

export const PcService = {
  async getPcs() {
    return await axios.get('/api/internal-api/v1/pcs')
  },

  async getPcsWithCondition(
    excludeTest?: boolean,
    pgType?: number,
    searchType?: string,
    searchText?: string
  ) {
    const params: Pc = {}

    params.excludeTest = excludeTest
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, Pc>('/api/internal-api/v1/pcs/search', { params })
    return data.value.data
  },

  async getPcsWithConditionWithPaging(
    page?: number,
    size?: number,
    excludeTest?: boolean,
    pgType?: number,
    searchType?: string,
    searchText?: string
  ) {
    const params: PcRequestWithPage = {}

    params.page = page
    params.excludeTest = excludeTest
    if (size) params.size = size
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, Pc>('/api/internal-api/v1/pcs/search-with-paging', {
      params
    })
    return data.value.data
  },

  async getPc(id: number) {
    return await axios.get('/api/internal-api/v1/pcs/' + id)
  },

  async getPmsUsageListBetweenStartAndDate(startDate?: string, endDate?: string) {
    const params: DateRangeRequest = {}

    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const { data } = await useApi<any, DateRangeRequest>(
      '/api/internal-api/v1/pcs/pms-usage-list',
      {
        params
      }
    )
    return data.value.data
  },

  async getPcsMultiSearch(
    excludeTest?: boolean,
    pgType?: number,
    workType?: number,
    perfSpecName?: string,
    searchType?: string,
    searchText?: string
  ) {
    const params: MultiSearch = {}

    params.excludeTest = excludeTest
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (workType !== undefined && workType !== null) params.workType = workType
    if (perfSpecName) params.perfSpecName = perfSpecName
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, MultiSearch>('/api/internal-api/v1/pcs/multi-search', {
      params
    })
    return data.value.data
  },

  async getPcsMultiSearchWithPaging(
    page?: number,
    size?: number,
    excludeTest?: boolean,
    pgType?: number,
    workType?: number,
    perfSpecName?: string,
    searchType?: string,
    searchText?: string
  ) {
    const params: MultiSearchWithPage = {}

    params.page = page
    params.excludeTest = excludeTest
    if (size) params.size = size
    if (pgType !== undefined && pgType !== null) params.pgType = pgType
    if (workType !== undefined && workType !== null) params.workType = workType
    if (perfSpecName) params.perfSpecName = perfSpecName
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, MultiSearchWithPage>(
      '/api/internal-api/v1/pcs/multi-search-with-paging',
      {
        params
      }
    )

    return data.value.data
  }
}
