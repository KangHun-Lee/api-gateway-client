<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PcService } from '@/service/PcService'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import type {
  DataTableFilterMeta,
  DataTableFilterMetaData,
  DataTableOperatorFilterMetaData,
  DataTablePageEvent
} from 'primevue/datatable'
import { useI18n } from 'vue-i18n'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'
import * as XLSX from 'xlsx'

interface DentalPcPerfDataEntry {
  id: number
  hospitalId: string
  hospitalName: string
  serverUnspecifiedCount: number
  serverLowSpecCount: number
  serverMinimumSpecCount: number
  serverRecommendedSpecCount: number
  serverHighSpecCount: number
  clientUnspecifiedCount: number
  clientLowSpecCount: number
  clientMinimumSpecCount: number
  clientRecommendedSpecCount: number
  clientHighSpecCount: number
  totalPcCount: number
}

interface DataEntry {
  id: number
  hospitalId: string
  hospitalName: string
  cpu: string
  memory: string
  os: string
  pgTypeName: string
  version: string
  workTypeName: string
  ip: string
  macAddress: string
  pcName: string
  lastDatetime: string
  monResol: string
  perfSpecName: string
  perfSpecScore: string
}

const { t } = useI18n()

let dppDataEntries = ref<DentalPcPerfDataEntry[]>([]) // dpp = dentalPcPerf
const sortedDppDataEntries = computed(() => {
  return [...dppDataEntries.value].sort((a, b) => {
    const hospitalIdCompare = a.hospitalId.localeCompare(b.hospitalId)
    return hospitalIdCompare
  })
})
const pagedDppDataEntries = computed(() => {
  const start = currentDppPage.value * dppPageSize.value
  const end = start + dppPageSize.value
  return sortedDppDataEntries.value.slice(start, end)
})

let dataEntries = ref<DataEntry[]>([])
const dataTable = ref()
const programs = [
  { label: '두번에', value: 0 },
  { label: '하나로', value: 1 },
  { label: 'OneClick', value: 2 },
  { label: 'OneCodi', value: 3 },
  { label: 'OneMessenger', value: 4 }
]
const selectedProgram = ref<number>(2)
const searchText = ref<string>('')
const resultSize = ref(0)
const perfLoading = ref<boolean>(true)
const loading = ref<boolean>(true)
const filters = ref<DataTableFilterMeta>({})

const checkedExcludeTest = ref<boolean>(true)
// const lastDay = ref<number>(90)
const selectedSearchType = ref<string>('none')
const searchTypes = [
  { label: '선택', value: 'none' },
  { label: '치과명', value: 'hospitalName' },
  { label: '요양기관번호', value: 'hospitalId' },
  { label: 'CPU', value: 'cpu' },
  { label: 'RAM', value: 'memory' },
  { label: 'OS', value: 'os' },
  { label: '설치날짜', value: 'lastDateTime' }
]

const dppTotalRecords = ref<number>(0)
const dppPageSizes = ref<number[]>([5, 10, 20, 30, 50])
const dppPageSize = ref<number>(dppPageSizes.value[0])
const currentDppPage = ref<number>(0)

const totalRecords = ref<number>(0)
const rowsPerPage = ref<number[]>([5, 10, 20, 30, 50])
const currentRowsPerPage = ref<number>(rowsPerPage.value[0])
const currentPage = ref<number>(0)

const { successToast, errorToast } = useToastHelper()
// const emit = defineEmits<{
//   toggleView: [value: boolean]
// }>()

async function fetchData() {
  loading.value = true
  try {
    const pcs = await PcService.getPcsWithConditionWithPaging(
      currentPage.value,
      currentRowsPerPage.value,
      checkedExcludeTest.value,
      selectedProgram.value,
      selectedSearchType.value,
      searchText.value
    )
    resultSize.value = pcs.content && pcs.content.length === 0 ? 0 : pcs.totalElements
    totalRecords.value = pcs.content && pcs.content.length === 0 ? 0 : pcs.totalElements
    dataEntries.value = pcs.content
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.pc.authorization.error'))
      } else {
        errorToast()
      }
    }
    loading.value = false
  }
  loading.value = false
  successToast(t('api.pc.success'))
}

async function getDentalPcPerfData() {
  perfLoading.value = true
  try {
    const pcs = await PcService.getPcsWithCondition(
      checkedExcludeTest.value,
      selectedProgram.value,
      selectedSearchType.value,
      searchText.value
    )

    if (pcs) {
      const dentalGroupedMap = new Map<string, DentalPcPerfDataEntry>()
      pcs.forEach((item: DataEntry) => {
        const key = `${item.hospitalId}`
        let index = 0
        if (!dentalGroupedMap.has(key)) {
          dentalGroupedMap.set(key, {
            id: index,
            hospitalId: item.hospitalId,
            hospitalName: item.hospitalName,
            serverUnspecifiedCount: 0,
            serverLowSpecCount: 0,
            serverMinimumSpecCount: 0,
            serverRecommendedSpecCount: 0,
            serverHighSpecCount: 0,
            clientUnspecifiedCount: 0,
            clientLowSpecCount: 0,
            clientMinimumSpecCount: 0,
            clientRecommendedSpecCount: 0,
            clientHighSpecCount: 0,
            totalPcCount: 0
          })
          index = index + 1
        }

        const target = dentalGroupedMap.get(key)!
        switch (item.perfSpecName) {
          case '미지정':
            if (item.workTypeName === 'SERVER') {
              target.serverUnspecifiedCount++
            } else {
              target.clientUnspecifiedCount++
            }
            break
          case '저사양':
            if (item.workTypeName === 'SERVER') {
              target.serverLowSpecCount++
            } else {
              target.clientLowSpecCount++
            }
            break
          case '최소사양':
            if (item.workTypeName === 'SERVER') {
              target.serverMinimumSpecCount++
            } else {
              target.clientMinimumSpecCount++
            }
            break
          case '권장사양':
            if (item.workTypeName === 'SERVER') {
              target.serverRecommendedSpecCount++
            } else {
              target.clientRecommendedSpecCount++
            }
            break
          case '고사양':
            if (item.workTypeName === 'SERVER') {
              target.serverHighSpecCount++
            } else {
              target.clientHighSpecCount++
            }
            break
        }

        target.totalPcCount++
      })

      dppDataEntries.value = Array.from(dentalGroupedMap.values())
      dppTotalRecords.value = dppDataEntries.value.length
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.pc.authorization.error'))
      } else {
        errorToast()
      }
    }
    perfLoading.value = false
  }
  perfLoading.value = false
}

const onDppPageChange = (event: DataTablePageEvent) => {
  currentDppPage.value = event.page
  dppPageSize.value = event.rows
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.page
  currentRowsPerPage.value = event.rows
  fetchData()
}

const onSearchClick = () => {
  fetchData()
  getDentalPcPerfData()
  currentPage.value = 0
  currentDppPage.value = 0
}

const onHospitalNameClick = async (selectedHospitalId: string) => {
  selectedSearchType.value = 'hospitalId'
  searchText.value = selectedHospitalId
  await fetchData()
  currentPage.value = 0
}

onMounted(() => {
  fetchData()
  getDentalPcPerfData()
})

function convertDate(date: string) {
  const formattedDate = date.split('T')[0]
  return formattedDate
}

const exportExcel = async () => {
  const pcs = await PcService.getPcsWithCondition(
    checkedExcludeTest.value,
    selectedProgram.value,
    selectedSearchType.value,
    searchText.value
  )

  if (!sortedDppDataEntries?.value.length || !pcs.length) return

  const sheet1Headers = [
    t('view.pc.dentalPcPerformance.hospitalId'),
    t('view.pc.dentalPcPerformance.hospitalName'),
    t('view.pc.dentalPcPerformance.serverUnspecifiedCount'),
    t('view.pc.dentalPcPerformance.serverLowSpecCount'),
    t('view.pc.dentalPcPerformance.serverMinimumSpecCount'),
    t('view.pc.dentalPcPerformance.serverRecommendedSpecCount'),
    t('view.pc.dentalPcPerformance.serverHighSpecCount'),
    t('view.pc.dentalPcPerformance.clientUnspecifiedCount'),
    t('view.pc.dentalPcPerformance.clientLowSpecCount'),
    t('view.pc.dentalPcPerformance.clientMinimumSpecCount'),
    t('view.pc.dentalPcPerformance.clientRecommendedSpecCount'),
    t('view.pc.dentalPcPerformance.clientHighSpecCount'),
    t('view.pc.dentalPcPerformance.totalPcCount')
  ]
  const sheet2Headers = [
    t('view.pc.hospitalName'),
    t('view.pc.hospitalId'),
    t('view.pc.workType'),
    t('view.pc.cpu'),
    t('view.pc.memory'),
    t('view.pc.os'),
    t('view.pc.monResol'),
    t('view.pc.pgType'),
    t('view.pc.version'),
    t('view.pc.perfSpecScore'),
    t('view.pc.perfSpecName'),
    t('view.pc.pcName'),
    t('view.pc.ip'),
    t('view.pc.macAddress'),
    t('view.pc.lastDatetime')
  ]
  const sheet1Data = [
    sheet1Headers,
    ...sortedDppDataEntries.value.map((item) => [
      item.hospitalId,
      item.hospitalName,
      item.serverUnspecifiedCount,
      item.serverLowSpecCount,
      item.serverMinimumSpecCount,
      item.serverRecommendedSpecCount,
      item.serverHighSpecCount,
      item.clientUnspecifiedCount,
      item.clientLowSpecCount,
      item.clientMinimumSpecCount,
      item.clientRecommendedSpecCount,
      item.clientHighSpecCount,
      item.totalPcCount
    ])
  ]
  const sheet2Data = [
    sheet2Headers,
    ...pcs.map((item: DataEntry) => [
      item.hospitalId,
      item.hospitalName,
      item.workTypeName,
      item.cpu,
      item.memory,
      item.os,
      item.monResol,
      item.pgTypeName,
      item.version,
      item.perfSpecName,
      item.perfSpecScore,
      item.pcName,
      item.ip,
      item.macAddress,
      item.lastDatetime
    ])
  ]

  const worksheet1 = XLSX.utils.aoa_to_sheet(sheet1Data)
  const worksheet2 = XLSX.utils.aoa_to_sheet(sheet2Data)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet1, '치과별 PC 성능')
  XLSX.utils.book_append_sheet(workbook, worksheet2, '전체 데이터')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  downloadExcelBlob(excelBuffer, '치과별_PC_성능.xlsx')
}

function downloadExcelBlob(content: ArrayBuffer, filename: string) {
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  link.click()

  URL.revokeObjectURL(url)
}

const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    hospitalName: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    hospitalId: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    workTypeName: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
    },
    cpu: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    },
    memory: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    os: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    },
    lastDatetime: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    }
  }
}

initFilters()

const clearFilter = () => {
  initFilters()
}

function workTypeSeverity(workTypeName: string) {
  switch (workTypeName) {
    case 'SERVER':
      return 'info'
    case 'CLIENT':
      return 'warn'
  }
}

function pgTypeSeverity(pgTypeName: string) {
  switch (pgTypeName) {
    case '두번에':
      return 'contrast'
    case '하나로':
      return 'warn'
    case 'OneClick':
      return 'success'
    case 'OneCodi':
      return 'danger'
    case 'OneMessenger':
      return 'secondary'
  }
}

function getPerfSpecClass(perfSpecName: string) {
  switch (perfSpecName) {
    case '미지정':
      return 'unspecified-spec'
    case '저사양':
      return 'low-spec'
    case '최소사양':
      return 'minimum-spec'
    case '권장사양':
      return 'recommended-spec'
    case '고사양':
      return 'high-spec'
    default:
      return 'total'
  }
}

function onFilter(event: { filters: DataTableFilterMeta }) {
  filters.value = event.filters
  const cleanedFilters = cleanFilters(filters.value)
  console.log('######', cleanedFilters)
}

function cleanFilters(filters: DataTableFilterMeta) {
  const cleanedFilters: Record<string, DataTableOperatorFilterMetaData> = {}

  Object.keys(filters).forEach((key) => {
    const filter = filters[key]

    if (typeof filter === 'object' && filter !== null && 'constraints' in filter) {
      const validConstraints = filter.constraints.filter((constraint) => constraint.value !== null)

      if (validConstraints.length > 0) {
        cleanedFilters[key] = {
          ...filter,
          constraints: validConstraints
        }
      }
    }
  })

  return cleanedFilters
}
</script>

<template>
  <!-- 검색 및 내보내기 섹션 -->
  <div class="search-section">
    <div style="display: flex">
      <ToggleSwitch v-model="checkedExcludeTest" />
      <label>{{ t('view.searchArea.excludeTest') }}</label>
    </div>
    <FloatLabel variant="on">
      <Select
        v-model="selectedProgram"
        :options="programs"
        optionLabel="label"
        optionValue="value"
        placeholder="프로그램 선택"
        input-class="p-inputtext-sm"
        style="width: 8vw"
        size="small"
      />
      <label>{{ t('view.searchArea.programType') }}</label>
    </FloatLabel>

    <div class="search-text-area">
      <FloatLabel variant="on">
        <Select
          v-model="selectedSearchType"
          :options="searchTypes"
          optionLabel="label"
          optionValue="value"
          :placeholder="t('view.common.select')"
          input-class="p-inputtext-sm"
          style="width: 7vw"
        />
        <label>{{ t('view.searchArea.searchType') }}</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText type="text" v-model="searchText" size="small" @keydown.enter = "onSearchClick" />
        </IconField>
        <label>{{ t('view.searchArea.searchText') }}</label>
      </FloatLabel>
      <Button :label="t('view.common.search')" @click="onSearchClick" size="small" />
      <Button :label="t('view.common.export')" @click="exportExcel" size="small" />
      <!-- <Button
          :label="t('view.searchArea.db')"
          class="pi pi-database"
          @click="emit('toggleView', false)"
          size="small"
        /> -->
    </div>
  </div>

  <!-- 치과별 PC 성능 섹션 -->
  <div class="dental-pc-perf-section">
    <div class="dental-pc-perf-table">
      <DataTable
        v-model:filters="filters"
        :value="pagedDppDataEntries"
        ref="dataTable"
        paginator
        :first="currentDppPage * dppPageSize"
        style="font-size: 12px"
        dataKey="id"
        filterDisplay="menu"
        :totalRecords="dppTotalRecords"
        :rows-per-page-options="dppPageSizes"
        :rows="dppPageSize"
        @page="onDppPageChange"
        :loading="perfLoading"
        :globalFilterFields="['hospitalId', 'hospitalName']"
        @filter="onFilter"
        scrollable
        removableSort
        lazy
      >
        <template #header>
          <div class="table-header">
            {{ t('view.pc.dentalPcPerformance.title') }}
          </div>
          <div class="search-result">
            {{ t('view.searchArea.searchResult') }} :
            <strong class="search-result-count">{{ dppTotalRecords }}</strong>
          </div>
        </template>
        <template #empty> Pc Information Data Not found. </template>
        <template #loading> Loading Pc Infomation data. Please wait. </template>
        <Column
          field="hospitalId"
          :header="t('view.pc.dentalPcPerformance.hospitalId')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            {{ data.hospitalId }}
          </template>
        </Column>
        <Column
          field="hospitalName"
          :header="t('view.pc.dentalPcPerformance.hospitalName')"
          style="min-width: 7rem; max-width: 15rem"
        >
          <template #body="{ data }">
            <Button class="link-button" @click="onHospitalNameClick(data.hospitalId)">
              {{ data.hospitalName }}
            </Button>
          </template>
        </Column>
        <Column
          field="serverUnspecifiedCount"
          :header="t('view.pc.dentalPcPerformance.serverUnspecifiedCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'unspecified-spec': data.serverUnspecifiedCount !== 0 }">
              {{ data.serverUnspecifiedCount }}
            </span>
          </template>
        </Column>
        <Column
          field="serverLowSpecCount"
          :header="t('view.pc.dentalPcPerformance.serverLowSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'low-spec': data.serverLowSpecCount !== 0 }">
              {{ data.serverLowSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="serverMinimumSpecCount"
          :header="t('view.pc.dentalPcPerformance.serverMinimumSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'minimum-spec': data.serverMinimumSpecCount !== 0 }">
              {{ data.serverMinimumSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="serverRecommendedSpecCount"
          :header="t('view.pc.dentalPcPerformance.serverRecommendedSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'recommended-spec': data.serverRecommendedSpecCount !== 0 }">
              {{ data.serverRecommendedSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="serverHighSpecCount"
          :header="t('view.pc.dentalPcPerformance.serverHighSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'high-spec': data.serverHighSpecCount !== 0 }">
              {{ data.serverHighSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="clientUnspecifiedCount"
          :header="t('view.pc.dentalPcPerformance.clientUnspecifiedCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'unspecified-spec': data.clientUnspecifiedCount !== 0 }">
              {{ data.clientUnspecifiedCount }}
            </span>
          </template>
        </Column>
        <Column
          field="clientLowSpecCount"
          :header="t('view.pc.dentalPcPerformance.clientLowSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'low-spec': data.clientLowSpecCount !== 0 }">
              {{ data.clientLowSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="clientMinimumSpecCount"
          :header="t('view.pc.dentalPcPerformance.clientMinimumSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'minimum-spec': data.clientMinimumSpecCount !== 0 }">
              {{ data.clientMinimumSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="clientRecommendedSpecCount"
          :header="t('view.pc.dentalPcPerformance.clientRecommendedSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'recommended-spec': data.clientRecommendedSpecCount !== 0 }">
              {{ data.clientRecommendedSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="clientHighSpecCount"
          :header="t('view.pc.dentalPcPerformance.clientHighSpecCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="{ 'high-spec': data.clientHighSpecCount !== 0 }">
              {{ data.clientHighSpecCount }}
            </span>
          </template>
        </Column>
        <Column
          field="totalPcCount"
          :header="t('view.pc.dentalPcPerformance.totalPcCount')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span class="total">
              {{ data.totalPcCount }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <!-- 데이터 테이블 섹션 -->
  <div class="pc-data-section">
    <DataTable
      v-model:filters="filters"
      :value="dataEntries"
      ref="dataTable"
      paginator
      :first="currentPage * currentRowsPerPage"
      style="font-size: 12px"
      dataKey="id"
      filterDisplay="menu"
      :totalRecords="totalRecords"
      :rows-per-page-options="rowsPerPage"
      :rows="currentRowsPerPage"
      @page="onPageChange"
      :loading="loading"
      :globalFilterFields="[
        'hospitalName',
        'hospitalId',
        'workTypeName',
        'cpu',
        'memory',
        'os',
        'lastDatetime'
      ]"
      @filter="onFilter"
      scrollable
      removableSort
      lazy
    >
      <template #header>
        <div class="flex justify-between" style="display: flex; justify-content: space-between">
          <!-- <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Clear"
            outlined
            @click="clearFilter()"
          /> -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="search-result">
              {{ t('view.searchArea.searchResult') }} :
              <strong class="search-result-count">{{ resultSize }}</strong>
            </div>
          </div>
          <IconField>
            <InputIcon>
              <i class="pi pi-search" />
            </InputIcon>
            <InputText
              v-model="(filters['global'] as DataTableFilterMetaData).value"
              placeholder="결과 내 재검색"
            />
          </IconField>
        </div>
      </template>
      <template #empty> Pc Information Data Not found. </template>
      <template #loading> Loading Pc Infomation data. Please wait. </template>
      <Column
        field="hospitalName"
        :header="t('view.pc.hospitalName')"
        style="min-width: 9rem; max-width: 11rem"
      >
        <template #body="{ data }">
          {{ data.hospitalName }}
        </template>
      </Column>
      <Column
        field="hospitalId"
        :header="t('view.pc.hospitalId')"
        style="min-width: 8rem; max-width: 10rem"
      >
        <template #body="{ data }">
          {{ data.hospitalId }}
        </template>
      </Column>
      <Column
        field="workTypeName"
        :header="t('view.pc.workType')"
        style="min-width: 7rem; max-width: 9rem"
      >
        <template #body="{ data }">
          <Tag :value="data.workTypeName" :severity="workTypeSeverity(data.workTypeName)" />
        </template>
      </Column>
      <Column field="cpu" :header="t('view.pc.cpu')" style="min-width: 10rem; max-width: 12rem">
        <template #body="{ data }">
          {{ data.cpu }}
        </template>
      </Column>
      <Column field="memory" :header="t('view.pc.memory')" style="min-width: 5rem; max-width: 7rem">
        <template #body="{ data }">
          {{ data.memory }}
        </template>
      </Column>
      <Column field="os" :header="t('view.pc.os')" style="min-width: 10rem; max-width: 12rem">
        <template #body="{ data }">
          {{ data.os }}
        </template>
      </Column>
      <Column
        field="monResol"
        :header="t('view.pc.monResol')"
        style="min-width: 10rem; max-width: 12rem"
      />
      <Column
        field="pgTypeName"
        :header="t('view.pc.pgType')"
        style="min-width: 8rem; max-width: 10rem"
      >
        <template #body="{ data }">
          <Tag :value="data.pgTypeName" :severity="pgTypeSeverity(data.pgTypeName)" />
        </template>
      </Column>
      <Column
        field="version"
        :header="t('view.pc.version')"
        style="min-width: 7rem; max-width: 9rem"
      />
      <Column
        field="perfSpecName"
        :header="t('view.pc.perfSpecName')"
        style="min-width: 7rem; max-width: 9rem">
          <template #body="{ data }">
            <span :class="getPerfSpecClass(data.perfSpecName)">
              {{ data.perfSpecName }}
            </span>
          </template>
      </Column>
      <Column
        field="perfSpecScore"
        :header="t('view.pc.perfSpecScore')"
        style="min-width: 7rem; max-width: 9rem"
      />
      <Column
        field="pcName"
        :header="t('view.pc.pcName')"
        style="
          min-width: 7rem;
          max-width: 12rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        "
      >
        <template #body="{ data }">
          {{ data.pcName }}
        </template>
      </Column>
      <Column
        field="ip"
        :header="t('view.pc.ip')"
        style="
          min-width: 7rem;
          max-width: 12rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        "
      >
        <template #body="{ data }">
          {{ data.ip }}
        </template>
      </Column>
      <Column
        field="macAddress"
        :header="t('view.pc.macAddress')"
        style="
          min-width: 7rem;
          max-width: 12rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        "
      >
        <template #body="{ data }">
          {{ data.macAddress }}
        </template>
      </Column>
      <Column
        field="lastDatetime"
        :header="t('view.pc.lastDatetime')"
        style="min-width: 7rem; max-width: 12rem"
      >
        <template #body="{ data }">
          {{ convertDate(data.lastDatetime) }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style lang="scss" scoped>
.search-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.search-section > *:not(:last-child) {
  margin-right: 10px;
}

.chart-section {
  margin-bottom: 40px;
}

.search-period {
  display: flex;
  align-items: center;
}

.search-text-area {
  display: flex;
  position: absolute;
  right: 40px;
}

.search-text-area > *:not(:last-child) {
  margin-right: 10px;
}

.search-result {
  display: flex;
  font-size: 1rem;
  font-weight: normal;
}

.search-result-count {
  color: blue;
}

.dental-pc-perf-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.dental-pc-perf-table {
  flex: 1;
  min-width: 0;

  .table-header {
    text-align: center;
    font-size: 1.5rem;
    font-weight: normal;
    padding: 1rem 0;
    width: 100%;
  }

  .link-button {
    background: none;
    border: none;
    color: #007bff;
    padding: 0;
    font: inherit;
    cursor: pointer;
    text-decoration: underline;
  }

  .link-button:hover {
    color: #0056b3;
    text-decoration: none;
  }
}

.pc-data-section {
  display: contents;
  align-items: center;
}

.unspecified-spec {
  color: #555555;
  background-color: #e0e0e0;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: bold;
}

.low-spec {
  color: #d32f2f;
  background-color: #ffcdd2;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: bold;
}

.minimum-spec {
  color: #f57c00;
  background-color: #ffe0b2;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: bold;
}

.recommended-spec {
  color: #388e3c;
  background-color: #c8e6c9;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: bold;
}

.high-spec {
  color: #1976d2;
  background-color: #bbdefb;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: bold;
}

.total {
  font-weight: bold;
}
</style>
