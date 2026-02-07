<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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

interface PcRatioPerfDataEntry {
  id: number
  workTypeName: string
  perfSpecName: string
  count: number
  ratio: number
  scoreRange: string
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

interface MultiSelectState {
  isMultiSelected: boolean
  selectedWorkTypeName: string
  selectedPerfSpecName: string
}

const { t } = useI18n()

let pcRatioPerfDataEntries = ref<PcRatioPerfDataEntry[]>([])
const perfSpecNameOrder = ['미지정', '저사양', '최소사양', '권장사양', '고사양']

const calculateTotal = (entries: PcRatioPerfDataEntry[]) => {
  const totalCount = entries.reduce((acc, item) => acc + item.count, 0)
  const totalRatio = entries.reduce((acc, item) => acc + item.ratio, 0)
  return { totalCount, totalRatio }
}

const sortAndCalculateTotal = (
  workTypeName: string,
  pcRatioPerfDataEntries: PcRatioPerfDataEntry[]
) => {
  const sortedEntries = pcRatioPerfDataEntries
    .filter((item) => item.workTypeName === workTypeName)
    .slice()
    .sort((a, b) => {
      return perfSpecNameOrder.indexOf(a.perfSpecName) - perfSpecNameOrder.indexOf(b.perfSpecName)
    })

  const { totalCount, totalRatio } = calculateTotal(sortedEntries)

  sortedEntries.push({
    id: sortedEntries.length,
    workTypeName,
    perfSpecName: '전체',
    count: totalCount,
    // ratio: totalRatio, // 계산값 미사용. 100% 고정
    ratio: 100,
    scoreRange: ''
  })

  return sortedEntries
}

const serverEntries = computed(() => sortAndCalculateTotal('SERVER', pcRatioPerfDataEntries.value))
const clientEntries = computed(() => sortAndCalculateTotal('CLIENT', pcRatioPerfDataEntries.value))

let dataEntries = ref<DataEntry[]>([])
const dataTable = ref()
const programs = [
  { label: '두번에', value: 0 },
  { label: '하나로', value: 1 },
  { label: 'OneClick', value: 2 },
  { label: 'OneCodi', value: 3 },
  { label: 'OneMessenger', value: 4 }
]
const prevSelectedProgram = ref<number>(-1)
const selectedProgram = ref<number>(2)
const searchText = ref<string>('')
const resultSize = ref(0)
const ratioLoading = ref<boolean>(true)
const loading = ref<boolean>(true)
const filters = ref<DataTableFilterMeta>({})

const multiSelectState = ref<MultiSelectState>({
  isMultiSelected: false,
  selectedWorkTypeName: '',
  selectedPerfSpecName: ''
})
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
  let pcs
  try {
    if (multiSelectState.value?.isMultiSelected) {
      pcs = await fetchMultiSearchData()
    } else {
      pcs = await PcService.getPcsWithConditionWithPaging(
        currentPage.value,
        currentRowsPerPage.value,
        checkedExcludeTest.value,
        selectedProgram.value,
        selectedSearchType.value,
        searchText.value
      )
    }

    resultSize.value = pcs.content && pcs.content.length === 0 ? 0 : pcs.totalElements
    totalRecords.value = pcs.content && pcs.content.length === 0 ? 0 : pcs.totalElements
    dataEntries.value = pcs.content

    if (prevSelectedProgram.value !== selectedProgram.value) {
      prevSelectedProgram.value = selectedProgram.value
      await getDentalPcRatioData()
    }
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

async function fetchMultiSearchData() {
  const workType = multiSelectState.value?.selectedWorkTypeName === 'SERVER' ? 0 : 1
  const perfSpecName =
    multiSelectState.value?.selectedPerfSpecName === '전체'
      ? ''
      : multiSelectState.value?.selectedPerfSpecName

  const pcs = await PcService.getPcsMultiSearchWithPaging(
    currentPage.value,
    currentRowsPerPage.value,
    checkedExcludeTest.value,
    selectedProgram.value,
    workType,
    perfSpecName,
    selectedSearchType.value,
    searchText.value
  )

  return pcs
}

async function getDentalPcRatioData() {
  ratioLoading.value = true
  try {
    const pcs = await PcService.getPcsWithCondition(
      checkedExcludeTest.value,
      selectedProgram.value,
      selectedSearchType.value,
      searchText.value
    )

    if (pcs) {
      const pcGroupedMap = new Map<string, number>()
      let serverPcCount = 0
      let clientPcCount = 0

      // 0개인 것도 항목 표현되도록 수정
      pcGroupedMap.set('SERVER_미지정', 0);
      pcGroupedMap.set('SERVER_저사양', 0);
      pcGroupedMap.set('SERVER_최소사양', 0);
      pcGroupedMap.set('SERVER_권장사양', 0);
      pcGroupedMap.set('SERVER_고사양', 0);
      pcGroupedMap.set('CLIENT_미지정', 0);
      pcGroupedMap.set('CLIENT_저사양', 0);
      pcGroupedMap.set('CLIENT_최소사양', 0);
      pcGroupedMap.set('CLIENT_권장사양', 0);
      pcGroupedMap.set('CLIENT_고사양', 0);

      pcs.forEach((item: DataEntry) => {
        const key = `${item.workTypeName}_${item.perfSpecName}`
        const currentCount = pcGroupedMap.get(key) ?? 0
        pcGroupedMap.set(key, currentCount + 1)

        if (item.workTypeName === 'SERVER') {
          serverPcCount++
        } else {
          clientPcCount++
        }
      })

      let index = 0
      pcRatioPerfDataEntries.value = Array.from(pcGroupedMap.entries()).map(([key, count]) => {
        const [workTypeName, perfSpecName] = key.split('_')

        const total = workTypeName === 'SERVER' ? serverPcCount : clientPcCount
        const ratio = total > 0 ? +((count / total) * 100).toFixed(1) : 0

        return {
          id: index++,
          workTypeName,
          perfSpecName,
          count,
          ratio
          //TODO : 점수범위 서버로 부터 추가로 받아와야함
        } as PcRatioPerfDataEntry
      })
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.pc.authorization.error'))
      } else {
        errorToast()
      }
    }
    ratioLoading.value = false
  }
  ratioLoading.value = false
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.page
  currentRowsPerPage.value = event.rows
  fetchData()
}

const onSearchClick = () => {
  fetchData()
  currentPage.value = 0
  multiSelectState.value = {
    isMultiSelected: false,
    selectedWorkTypeName: '',
    selectedPerfSpecName: ''
  }
}

const onPerfSpecNameClick = async (selectedWorkTypeName: string, selectedPerfSpecName: string) => {
  currentPage.value = 0
  multiSelectState.value = {
    isMultiSelected: true,
    selectedWorkTypeName,
    selectedPerfSpecName
  }
  await fetchData()
}

onMounted(() => {
  fetchData()
})

function convertDate(date: string) {
  const formattedDate = date.split('T')[0]
  return formattedDate
}

// const exportCSV = async () => {
//   const exportPc = await PcService.getPcsWithCondition(
//     checkedExcludeTest.value,
//     selectedProgram.value,
//     selectedSearchType.value,
//     searchText.value
//   )
//   const csv = arrayToCsv(exportPc)
//   downloadBlob(csv, '설치정보.csv', 'text/csv;charset=utf-8')
// }

// function arrayToCsv(data: any[]) {
//   const headers = [
//     t('view.pc.id'),
//     t('view.pc.hospitalName'),
//     t('view.pc.hospitalId'),
//     t('view.pc.workType'),
//     t('view.pc.cpu'),
//     t('view.pc.memory'),
//     t('view.pc.os'),
//     t('view.pc.monResol'),
//     t('view.pc.pgType'),
//     t('view.pc.version'),
//     t('view.pc.perfSpecScore'),
//     t('view.pc.perfSpecName'),
//     t('view.pc.pcName'),
//     t('view.pc.ip'),
//     t('view.pc.macAddress'),
//     t('view.pc.lastDatetime')
//   ]

//   const escapeCsvValue = (value: any): string => {
//     if (value === null || value === undefined) return ''

//     const stringValue = String(value)
//     if (
//       stringValue.includes(',') ||
//       stringValue.includes('"') ||
//       stringValue.includes('\n') ||
//       stringValue.includes('\r')
//     ) {
//       return `"${stringValue.replace(/"/g, '""')}"`
//     }
//     return stringValue
//   }

//   const array = [headers].concat(data.map((item) => Object.values(item).map(escapeCsvValue)))

//   return array.map((row) => row.join(',')).join('\n')
// }

// function downloadBlob(content: any, filename: string, contentType: string) {
//   const bom = '\uFEFF'
//   const blob = new Blob([bom + content], { type: contentType })
//   const url = URL.createObjectURL(blob)

//   const pom = document.createElement('a')
//   pom.href = url
//   pom.setAttribute('download', filename)
//   pom.click()
// }

const exportExcel = async () => {
  const pcs = await PcService.getPcsWithCondition(
    checkedExcludeTest.value,
    selectedProgram.value,
    selectedSearchType.value,
    searchText.value
  )

  if (!serverEntries?.value.length || !clientEntries?.value.length || !pcs.length) return

  const sheet1Headers = [
    t('view.pc.dentalPcRatio.perfSpecName'),
    t('view.pc.dentalPcRatio.count'),
    t('view.pc.dentalPcRatio.ratio'),
    t('view.pc.dentalPcRatio.scoreRange')
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
    [t('view.pc.dentalPcRatio.serverTitle')],
    sheet1Headers,
    ...serverEntries.value.map((item) => [
      item.perfSpecName,
      item.count,
      item.ratio,
      item.scoreRange
    ]),
    [], // 빈 row
    [t('view.pc.dentalPcRatio.clientTitle')],
    sheet1Headers,
    ...clientEntries.value.map((item) => [
      item.perfSpecName,
      item.count,
      item.ratio,
      item.scoreRange
    ])
  ]
  const sheet2Data = [
    sheet2Headers,
    ...pcs.map((item: DataEntry) => [
      item.hospitalName,
      item.hospitalId,
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
  worksheet1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Server Title 셀 병합
    {
      s: { r: serverEntries.value.length + 3, c: 0 },
      e: { r: serverEntries.value.length + 3, c: 3 }
    } // Client Title 셀 병합
  ]
  const worksheet2 = XLSX.utils.aoa_to_sheet(sheet2Data)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet1, 'PC 성능 비율')
  XLSX.utils.book_append_sheet(workbook, worksheet2, '전체 데이터')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  downloadExcelBlob(excelBuffer, 'PC_성능_비율.xlsx')
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
          <InputText type="text" v-model="searchText" size="small" @keydown.enter="onSearchClick" />
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

  <!-- PC 성능 비율 섹션 -->
  <div class="pc-perf-ratio-section">
    <!-- Server PC 성능 비율 표 -->
    <div class="pc-perf-ratio-table">
      <DataTable
        :value="serverEntries"
        ref="dataTable"
        style="font-size: 12px"
        dataKey="id"
        :loading="ratioLoading"
        lazy
      >
        <template #header>
          <div class="table-header">
            {{ t('view.pc.dentalPcRatio.serverTitle') }}
          </div>
        </template>
        <template #empty> Pc Information Data Not found. </template>
        <template #loading> Loading Pc Infomation data. Please wait. </template>
        <Column
          field="perfSpecName"
          :header="t('view.pc.dentalPcRatio.perfSpecName')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <Button
              class="link-button"
              @click="onPerfSpecNameClick(data.workTypeName, data.perfSpecName)"
            >
              {{ data.perfSpecName }}
            </Button>
          </template>
        </Column>
        <Column
          field="count"
          :header="t('view.pc.dentalPcRatio.count')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="getPerfSpecClass(data.perfSpecName)">
              {{ data.count }}
            </span>
          </template>
        </Column>
        <Column
          field="ratio"
          :header="t('view.pc.dentalPcRatio.ratio')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="getPerfSpecClass(data.perfSpecName)">
              {{ `${data.ratio} %` }}
            </span>
          </template>
        </Column>
        <Column
          field="scoreRange"
          :header="t('view.pc.dentalPcRatio.scoreRange')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            {{ data.scoreRange }}
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Client PC 성능 비율 표 -->
    <div class="pc-perf-ratio-table">
      <DataTable
        :value="clientEntries"
        ref="dataTable"
        style="font-size: 12px"
        dataKey="id"
        :loading="ratioLoading"
        lazy
      >
        <template #header>
          <div class="table-header">
            {{ t('view.pc.dentalPcRatio.clientTitle') }}
          </div>
        </template>
        <template #empty> Pc Information Data Not found. </template>
        <template #loading> Loading Pc Infomation data. Please wait. </template>
        <Column
          field="perfSpecName"
          :header="t('view.pc.dentalPcRatio.perfSpecName')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <Button
              class="link-button"
              @click="onPerfSpecNameClick(data.workTypeName, data.perfSpecName)"
            >
              {{ data.perfSpecName }}
            </Button>
          </template>
        </Column>
        <Column
          field="count"
          :header="t('view.pc.dentalPcRatio.count')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="getPerfSpecClass(data.perfSpecName)">
              {{ data.count }}
            </span>
          </template>
        </Column>
        <Column
          field="ratio"
          :header="t('view.pc.dentalPcRatio.ratio')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            <span :class="getPerfSpecClass(data.perfSpecName)">
              {{ `${data.ratio} %` }}
            </span>
          </template>
        </Column>
        <Column
          field="scoreRange"
          :header="t('view.pc.dentalPcRatio.scoreRange')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            {{ data.scoreRange }}
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
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="search-result">
              {{ t('view.searchArea.searchResult') }} :
              <strong class="search-result-count">{{ resultSize }}</strong>
            </div>          
            <!-- <Button
              type="button"
              icon="pi pi-filter-slash"
              label="Clear"
              outlined
              @click="clearFilter()"
            /> -->
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
        style="min-width: 7rem; max-width: 9rem"
      >
        <template #body="{ data }">
          <span :class="getPerfSpecClass(data.perfSpecName)">
            {{ `${data.perfSpecName}` }}
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

.search-result {
  display: flex;
  font-size: 1rem;
  font-weight: normal;
}

.search-result-count {
  color: blue;
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

.pc-perf-ratio-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.pc-perf-ratio-table {
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
