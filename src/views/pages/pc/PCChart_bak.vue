<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PcService } from '@/service/PcService'
import { AnalyzeInstallInfo } from '@/composables/perf-calc'
import type { CpumemoryScore } from '@/composables/perf-calc'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import type {
  DataTableFilterMeta,
  DataTableFilterMetaData,
  DataTablePageEvent
} from 'primevue/datatable'
import { useI18n } from 'vue-i18n'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'

interface DataEntry {
  id: number
  hospitalName: string
  hospitalId: number
  cpu: string
  memory: string
  os: string
  pgType: string
  lastDatetime: string
  workType: number
  usageLevel: string
  usageLevelRank: number
  totalScore: number
}

interface ResultEntry {
  id: number
  cpuName: string
  cpuModel: string
  memory: string
  cpuScore: number
  memoryScore: number
  totalScore: number
  unitCount: number
  combinedKey: string
  usageLevel?: string
}

const { t } = useI18n()
let dataEntries = ref<DataEntry[]>([])
let groupedData: Record<string, ResultEntry> = {}
let result = ref<CpumemoryScore[]>()
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
const loading = ref<boolean>(true)
const filters = ref<DataTableFilterMeta>({})
const workTypes = ref([
  {
    name: 'Server',
    value: 0
  },
  {
    name: 'Client',
    value: 1
  }
])
const pgTypes = ref([
  {
    name: '두번에',
    value: 0
  },
  {
    name: '하나로',
    value: 1
  },
  {
    name: 'OneClick',
    value: 2
  },
  {
    name: 'OneCodi',
    value: 3
  },
  {
    name: 'OneMessenger',
    value: 4
  }
])
let groupedArray: ResultEntry[] = []
let reverseGroupedArray: ResultEntry[] = []
const chartData = ref()
const chartOptions = ref()
const checkedExcludeTest = ref<boolean>(true)
const lastDay = ref<number>(90)
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
const emit = defineEmits<{
  toggleView: [value: boolean]
}>()

async function fetchData() {
  chartData.value = []
  chartOptions.value = setChartOptions()

  loading.value = true
  try {
    const pcs = await PcService.getPcsWithConditionWithPaging(
      currentPage.value,
      currentRowsPerPage.value,
      checkedExcludeTest.value,
      selectedProgram.value,
      lastDay.value,
      selectedSearchType.value,
      searchText.value
    )
    resultSize.value = pcs.value.data.length
    dataEntries.value = pcs.value.data
    result.value = AnalyzeInstallInfo(pcs.value.data)
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

  // Clear groupedData
  for (const key in groupedData) {
    delete groupedData[key]
  }
  if (groupedArray.length > 0) {
    groupedArray.splice(0, groupedArray.length)
  }
  if (reverseGroupedArray.length > 0) {
    reverseGroupedArray.splice(0, reverseGroupedArray.length)
  }
  result.value?.forEach((entry) => {
    let key
    if (isNaN(entry.totalScore) || entry.totalScore === undefined) {
      entry.totalScore = 0
    }

    dataEntries.value.forEach((item) => {
      if (item.id === entry.id) {
        item.totalScore = entry.totalScore || 0
      }
    })

    if (entry.cpuModel === '미지정' || entry.totalScore === 0) {
      key = '미지정'
    } else {
      key = `${entry.cpuModel} ${entry.memory}`
    }

    if (!groupedData[key]) {
      groupedData[key] = { ...entry, combinedKey: key }
    } else {
      groupedData[key].unitCount += entry.unitCount
    }
  })
  groupedArray = [...Object.values(groupedData).sort((a, b) => a.totalScore - b.totalScore)]
  reverseGroupedArray = [...Object.values(groupedData).sort((a, b) => b.totalScore - a.totalScore)]
  categorizeSpecs(groupedArray)

  let count = 1
  const recommendSpecIndex = groupedArray.findIndex(
    (groupedEntry) => groupedEntry.usageLevel === '권장사양'
  )
  const highSpecIndex = groupedArray.findIndex(
    (groupedEntry) => groupedEntry.usageLevel === '고사양'
  )

  // console.log('저사양 최저 점수', groupedArray[1].totalScore)
  // console.log('권장사양 최저 점수', groupedArray[recommendSpecIndex].totalScore)
  // console.log('고사양 최저 점수', groupedArray[highSpecIndex].totalScore)
  dataEntries.value.forEach((entry) => {
    const indexInReverseGrouped = reverseGroupedArray.findIndex(
      (groupedEntry) => groupedEntry.id === entry.id
    )

    if (indexInReverseGrouped !== -1) {
      entry.usageLevelRank = indexInReverseGrouped + 1
    } else {
      entry.usageLevelRank = reverseGroupedArray.length + count++
    }

    if (entry.totalScore < 1) {
      entry.usageLevel = '미지정'
    } else if (
      groupedArray[1].totalScore <= entry.totalScore &&
      groupedArray[recommendSpecIndex - 1].totalScore >= entry.totalScore
    ) {
      entry.usageLevel = '저사양'
    } else if (
      groupedArray[recommendSpecIndex].totalScore <= entry.totalScore &&
      groupedArray[highSpecIndex - 1].totalScore >= entry.totalScore
    ) {
      entry.usageLevel = '권장사양'
    } else if (groupedArray[highSpecIndex].totalScore <= entry.totalScore) {
      entry.usageLevel = '고사양'
    } else {
      entry.usageLevel = '미지정'
    }
  })

  if (groupedArray.length === 0) {
    chartData.value = { labels: [], datasets: [] }
  } else {
    chartData.value = setChartData()
  }
  chartOptions.value = setChartOptions()
}

function categorizeSpecs(groupedArray: ResultEntry[]) {
  const top3Entries = [...groupedArray].sort((a, b) => b.unitCount - a.unitCount).slice(0, 3)
  const top3Indexes = top3Entries.map((entry) => groupedArray.indexOf(entry))
  const minIndex = Math.min(...top3Indexes)
  const maxIndex = Math.max(...top3Indexes)
  groupedArray.forEach((entry, index) => {
    if (entry.combinedKey === '미지정') {
      entry.usageLevel = '미지정'
    } else if (entry.combinedKey !== '미지정' && index < minIndex) {
      entry.usageLevel = '저사양'
    } else if (index > maxIndex) {
      entry.usageLevel = '고사양'
    } else if (index >= minIndex && index <= maxIndex) {
      entry.usageLevel = '권장사양'
    } else {
      entry.usageLevel = '미지정'
    }
  })
}

const setChartData = () => {
  return {
    labels: groupedArray.map((entry) => entry.combinedKey),
    datasets: [
      {
        label: '사용대수',
        backgroundColor: groupedArray.map((entry) => {
          if (entry.usageLevel === '저사양') {
            return 'orange'
          } else if (entry.usageLevel === '권장사양') {
            return 'skyblue'
          } else if (entry.usageLevel === '고사양') {
            return 'blue'
          } else {
            return 'gray'
          }
        }),
        data: groupedArray.map((entry) => entry.unitCount),
        spanGaps: true,
        tension: 0.4
      }
    ]
  }
}

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement)
  const textColor = documentStyle.getPropertyValue('--p-text-color')
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color')
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color')

  return {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        display: false,
        align: 'start',
        labels: {
          color: textColor
        }
      },
      tooltip: {
        mode: 'index',
        padding: 10,
        intersect: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
          font: {
            weight: 100
          }
        },
        grid: {
          display: false,
          drawBorder: false
        },
        offset: true
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder,
          drawBorder: false
        }
      }
    },
    layout: {
      padding: 10
    },
    interaction: {
      mode: 'index'
    }
  }
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.page
  currentRowsPerPage.value = event.rows
  fetchData()
}

onMounted(() => {
  fetchData()
  chartData.value = setChartData()
  chartOptions.value = setChartOptions()
  createCustomLegend()
})

function convertDate(date: string) {
  const formattedDate = date.split('T')[0]
  return formattedDate
}

const exportCSV = () => {
  dataTable.value.exportCSV()
}

function createCustomLegend() {
  const legendContainer = document.getElementById('custom-legend')
  if (legendContainer) {
    legendContainer.innerHTML = ''
    const levels = ['미지정', '저사양', '권장사양', '고사양']
    const colors = ['gray', 'orange', 'skyblue', 'blue']
    levels.forEach((level, index) => {
      const legendItem = document.createElement('div')
      legendItem.style.display = 'flex'
      legendItem.style.alignItems = 'center'
      legendItem.style.marginBottom = '20px'
      legendItem.style.marginRight = '10px'

      const colorBox = document.createElement('div')
      colorBox.style.width = '15px'
      colorBox.style.height = '15px'
      colorBox.style.backgroundColor = colors[index]
      colorBox.style.marginRight = '5px'

      const label = document.createElement('span')
      label.textContent = level

      legendItem.appendChild(colorBox)
      legendItem.appendChild(label)
      legendContainer.appendChild(legendItem)
    })
  }
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
const chartWidth = computed(() => {
  return `${400 + groupedArray.length * 10}vw`
})
</script>

<template>
  <div>
    <!-- 검색 및 내보내기 섹션 -->
    <div class="search-section">
      <div class="search-result">
        {{ t('view.searchArea.searchResult') }} :
        <strong class="search-result-count">{{ resultSize }}</strong>
      </div>
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
      <div class="search-period">
        <FloatLabel variant="on">
          <InputNumber
            v-model="lastDay"
            inputId="minmax-buttons"
            input-class="p-inputtext-sm"
            showButtons
            :min="0"
            :max="90"
          />
          <label for="minmax-buttons">{{ t('view.searchArea.notUsedDays') }}</label>
        </FloatLabel>
      </div>
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
            <InputText type="text" v-model="searchText" size="small" />
          </IconField>
          <label>{{ t('view.searchArea.searchText') }}</label>
        </FloatLabel>
        <Button :label="t('view.common.search')" @click="fetchData" size="small" />
        <Button :label="t('view.common.export')" @click="exportCSV()" size="small" />
        <Button
          :label="t('view.searchArea.db')"
          class="pi pi-database"
          @click="emit('toggleView', false)"
          size="small"
        />
      </div>
    </div>

    <!-- 차트 섹션 -->
    <div class="chart-section" style="position: relative; width: 100%; overflow-x: scroll">
      <div id="custom-legend" style="display: flex; margin-top: 10px"></div>
      <Chart
        type="bar"
        :data="chartData"
        id="chart"
        :options="chartOptions"
        :style="{
          height: '30rem',
          width: chartWidth,
          overflowX: 'scroll',
          minHeight: '300px',
          maxHeight: '800px'
        }"
      />
    </div>

    <!-- 데이터 테이블 섹션 -->
    <div>
      <DataTable
        v-model:filters="filters"
        :value="dataEntries"
        ref="dataTable"
        paginator
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
        removableSort
      >
        <template #header>
          <div class="flex justify-between" style="display: flex; justify-content: space-between">
            <Button
              type="button"
              icon="pi pi-filter-slash"
              label="Clear"
              outlined
              @click="clearFilter()"
            />
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
          filterField="hospitalName"
          sortable
        >
          <template #body="{ data }">
            {{ data.hospitalName }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              v-model="filterModel.value"
              type="text"
              :placeholder="t('view.pc.hospitalName')"
            />
          </template>
        </Column>
        <Column
          field="hospitalId"
          :header="t('view.pc.hospitalId')"
          filterField="hospitalId"
          sortable
        >
          <template #body="{ data }">
            {{ data.hospitalId }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              v-model="filterModel.value"
              type="number"
              :placeholder="t('view.pc.hospitalId')"
            />
          </template>
        </Column>
        <Column field="workTypeName" :header="t('view.pc.workType')" filterField="workTypeName">
          <template #body="{ data }">
            <Tag :value="data.workTypeName" :severity="workTypeSeverity(data.workTypeName)" />
          </template>
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="workTypes"
              optionLabel="name"
              optionValue="name"
              placeholder="Select One"
              showClear
            >
              <template #option="slotProps">
                <Tag
                  :value="slotProps.option.name"
                  :severity="workTypeSeverity(slotProps.option.name)"
                />
              </template>
            </Select>
          </template>
        </Column>
        <Column field="cpu" :header="t('view.pc.cpu')" filterField="cpu" sortable>
          <template #body="{ data }">
            {{ data.cpu }}
          </template>
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" :placeholder="t('view.pc.cpu')" />
          </template>
        </Column>
        <Column field="memory" :header="t('view.pc.memory')" filterField="memory" sortable>
          <template #body="{ data }">
            {{ data.memory }}
          </template>
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" :placeholder="t('view.pc.memory')" />
          </template>
        </Column>
        <Column field="os" :header="t('view.pc.os')" filterField="os" sortable>
          <template #body="{ data }">
            {{ data.os }}
          </template>
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" :placeholder="t('view.pc.os')" />
          </template>
        </Column>
        <Column field="pgTypeName" :header="t('view.pc.pgType')">
          <template #body="{ data }">
            <Tag :value="data.pgTypeName" :severity="pgTypeSeverity(data.pgTypeName)" />
          </template>
        </Column>
        <Column field="usageLevel" :header="t('view.pc.usageLevel')" sortable />
        <Column field="usageLevelRank" :header="t('view.pc.usageLevelRank')" sortable />
        <Column field="lastDatetime" :header="t('view.pc.lastDatetime')" filterField="lastDatetime">
          <template #body="{ data }">
            {{ convertDate(data.lastDatetime) }}
          </template>
          <template #filter="{ filterModel }">
            <InputText
              v-model="filterModel.value"
              type="text"
              :placeholder="t('view.pc.lastDatetime')"
            />
          </template>
        </Column>
      </DataTable>
    </div>
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
</style>
