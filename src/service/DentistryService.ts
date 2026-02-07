import axios from 'axios'
import { useApi } from '@/composables'

interface DentistryRequest {
  excludeTest?: boolean
  startDate?: string
  endDate?: string
  searchType?: string
  searchText?: string
}

interface DentistryRequestWithPage {
  page?: number
  size?: number
  excludeTest?: boolean
  startDate?: string
  endDate?: string
  searchType?: string
  searchText?: string
}

export const DentistryService = {
  async getDentistryWithConditionWithPaging(
    page?: number,
    size?: number,
    excludeTest?: boolean,
    startDate?: string,
    endDate?: string,
    searchType?: string,
    searchText?: string
  ) {
    const params: DentistryRequestWithPage = {}

    params.page = page
    params.excludeTest = excludeTest
    if (size) params.size = size
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, DentistryRequestWithPage>('/api/internal-api/v1/dentistry', {
      params
    })
    return data.value.data
  },

  async getDentistryWithCondition(
    excludeTest?: boolean,
    startDate?: string,
    endDate?: string,
    searchType?: string,
    searchText?: string
  ) {
    const params: DentistryRequest = {}

    params.excludeTest = excludeTest
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, DentistryRequest>('/api/internal-api/v1/dentistry/export', {
      params
    })
    return data.value.data
  },

  async getPmsUsageStatusWithCondition(
    excludeTest?: boolean,
    startDate?: string,
    endDate?: string,
    searchType?: string,
    searchText?: string
  ) {
    const params: DentistryRequest = {}

    params.excludeTest = excludeTest
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (searchType !== 'none') params.searchType = searchType
    if (searchText) params.searchText = searchText

    const { data } = await useApi<any, DentistryRequest>(
      '/api/internal-api/v1/dentistry/pms-usage-status',
      {
        params
      }
    )
    return data.value.data
  }
}
