import axios from 'axios'
import { useApi } from '@/composables'
import QueryString from 'qs'

interface RequestCompetitorPc {
  dateTypeName?: string
  startDate?: string
  endDate?: string
  pgTypeList?: number[]
  searchType?: string
  searchText?: string
}

interface RequestCompetitorPcWithPage {
  page?: number
  size?: number
  dateTypeName?: string
  startDate?: string
  endDate?: string
  pgTypeList?: number[]
  searchType?: string
  searchText?: string
}

export interface CompetitorPcData {
  id: number
  hospitalId: string
  hospitalName: string
  ip: string
  macAddress: string
  pcName: string
  pgTypeName: string
  competitorPgName: string
  competitorInstallDatetime: string
  workDatetime: string
}

export const CompetitorPcService = {
  async getCompetitorPcList() {
    return await axios.get('/api/internal-api/v1/competitor-pcs')
  },

  async getCompetitorPcListWithConditon(
    dateTypeName?: string,
    startDate?: string,
    endDate?: string,
    pgTypeList?: number[],
    searchType?: string,
    searchText?: string
  ) {
    const params: RequestCompetitorPc = {}

    params.dateTypeName = dateTypeName
    params.startDate = startDate
    params.endDate = endDate
    if (pgTypeList !== undefined && pgTypeList !== null) params.pgTypeList = pgTypeList
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, RequestCompetitorPc>(
      '/api/internal-api/v1/competitor-pcs/search',
      {
        params,
        paramsSerializer: (params) => QueryString.stringify(params, { arrayFormat: 'repeat' })
      }
    )
    return data.value.data
  },

  async getCompetitorPcListWithConditonWithPaging(
    page?: number,
    size?: number,
    dateTypeName?: string,
    startDate?: string,
    endDate?: string,
    pgTypeList?: number[],
    searchType?: string,
    searchText?: string
  ) {
    const params: RequestCompetitorPcWithPage = {}

    params.page = page
    if (size) params.size = size
    params.dateTypeName = dateTypeName
    params.startDate = startDate
    params.endDate = endDate
    if (pgTypeList !== undefined && pgTypeList !== null) params.pgTypeList = pgTypeList
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, RequestCompetitorPcWithPage>(
      '/api/internal-api/v1/competitor-pcs/search-with-paging',
      {
        params,
        paramsSerializer: (params) => QueryString.stringify(params, { arrayFormat: 'repeat' })
      }
    )
    return data.value.data
  }
}
