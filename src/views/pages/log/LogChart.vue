<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { LogService } from '@/service/LogService'
import { useToastHelper } from '@/composables'
import LogDetailDialog from '@/views/pages/log/LogDetailDialog.vue'
import type { LogData } from '@/service/LogService'
import type { DataTablePageEvent } from 'primevue/datatable'
import type { DataEntry } from '@/service/PcService'
import { AxiosError } from 'axios'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { successToast, errorToast } = useToastHelper()
const logs = ref<LogData[]>()
const log = ref<LogData>()
const pc = ref<DataEntry>()
const today = new Date()
const rangeDate = ref([
  new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
  new Date()
])
const startDateString = computed(() =>
  rangeDate.value && rangeDate.value[0]
    ? `${rangeDate.value[0].getFullYear()}-${String(rangeDate.value[0].getMonth() + 1).padStart(2, '0')}-${String(rangeDate.value[0].getDate()).padStart(2, '0')}`
    : undefined
)

const endDateString = computed(() =>
  rangeDate.value && rangeDate.value[1]
    ? `${rangeDate.value[1].getFullYear()}-${String(rangeDate.value[1].getMonth() + 1).padStart(2, '0')}-${String(rangeDate.value[1].getDate()).padStart(2, '0')}`
    : undefined
)
const programs = [
  { label: '두번에', value: 0 },
  { label: '하나로', value: 1 },
  { label: 'OneClick', value: 2 },
  { label: 'OneCodi', value: 3 },
  { label: 'OneMessenger', value: 4 }
]
const searchTypes = [
  { label: '선택', value: 'none' },
  { label: 'ID', value: 'id' },
  { label: '시간', value: 'workDateTime' },
  { label: '프로그램', value: 'programTypeName' },
  { label: '프로그램 종류', value: 'workTypeName' },
  { label: '버전', value: 'version' },
  { label: '메뉴', value: 'rootMenu' },
  { label: '화면ID', value: 'viewId' },
  { label: '화면명', value: 'viewName' },
  { label: '로그', value: 'log' },
  { label: '로그 상세', value: 'logDetail' },
  { label: '로그 기타', value: 'etc' },
  { label: '요양기관번호', value: 'hospitalId' },
  { label: '병원명', value: 'hospitalName' },
  { label: 'PC명', value: 'pcName' }
]
const eventTypes = ref([
  { name: 'Debug', key: 0 },
  { name: 'Info', key: 1 },
  { name: 'Warning', key: 2 },
  { name: 'Error', key: 3 },
  { name: 'Fatal', key: 4 }
])

const selectedProgram = ref<number>(2)
const searchText = ref<string>('')
const resultSize = ref(0)
const loading = ref<boolean>(true)
const showDialog = ref<boolean>(false)
const chartData = ref([])
const chartOptions = ref()
const totalRecords = ref<number>(0)
const rowsPerPage = ref<number[]>([5, 10, 20, 30, 50])
const currentRowsPerPage = ref<number>(rowsPerPage.value[0])
const currentPage = ref<number>(0)
const dataTable = ref()
const checkedEventType = ref<number[]>([0, 1, 2, 3, 4])
const selectedSearchType = ref<string>('none')
const checkedExcludeTest = ref<boolean>(true)

const emit = defineEmits<{
  toggleView: [value: boolean]
}>()

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

const getSeverity = (status: string) => {
  status = status.toLowerCase()
  switch (status) {
    case 'debug':
      return 'secondary'

    case 'info':
      return 'info'

    case 'warn':
      return 'warn'

    case 'error':
      return 'danger'

    case 'fatal':
      return 'contrast'
  }
}

function convertDate(date: string) {
  const formattedDate = date.split('T')[0] + ' ' + date.split('T')[1]
  return formattedDate
}

async function fetchData() {
  loading.value = true

  // 페이징 데이터 요청
  try {
    const tableData = await LogService.getLogsWithConditionAndPaging(
      currentPage.value / currentRowsPerPage.value,
      currentRowsPerPage.value,
      checkedExcludeTest.value,
      checkedEventType.value,
      startDateString.value,
      endDateString.value,
      selectedProgram.value,
      selectedSearchType.value,
      searchText.value
    )
    if (tableData) {
      logs.value = tableData.content
      totalRecords.value =
        tableData.content && tableData.content.length === 0 ? 0 : tableData.totalElements
      resultSize.value =
        tableData.content && tableData.content.length === 0 ? 0 : tableData.totalElements

      successToast(t('api.log.success'))
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.log.authorization.error'))
      } else {
        errorToast()
      }
    }
    console.error('Error fetching logs with paging:', e)
  }

  loading.value = false
}

async function fetchChart() {
  try {
    const chartDataResult = await LogService.getLogsWithConditionForChart(
      checkedExcludeTest.value,
      checkedEventType.value,
      startDateString.value,
      endDateString.value,
      selectedProgram.value,
      selectedSearchType.value,
      searchText.value
    )
    if (chartDataResult) {
      chartData.value = {
        labels: chartDataResult.map((entry) => entry.date),
        datasets: [
          {
            label: t('view.log.errorCount'),
            backgroundColor: 'orange',
            data: chartDataResult.map((entry) => entry.count),
            spanGaps: true,
            tension: 0.4
          }
        ]
      }
      successToast(t('api.log.chart.success'))
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.log.chart.authorization.error'))
      } else if (e.status === 500) {
        errorToast()
      }
    }
    console.error('Error fetching logs:', e)
  }
  chartOptions.value = setChartOptions()
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.first
  currentRowsPerPage.value = event.rows
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchChart()
  chartOptions.value = setChartOptions()
})

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
        display: true,
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

async function getDetail(id: number) {
  const result = await LogService.getLogWithPc(id)
  log.value = result.value.data.log
  pc.value = result.value.data.pcResponse
  showDialog.value = true
}

const exportCSV = async () => {
  const exportLogs = await LogService.getLogsWithCondition(
    checkedExcludeTest.value,
    checkedEventType.value,
    startDateString.value,
    endDateString.value,
    selectedProgram.value,
    selectedSearchType.value,
    searchText.value
  )
  const csv = arrayToCsv(exportLogs)
  downloadBlob(csv, 'logs.csv', 'text/csv;charset=utf-8')
}

function arrayToCsv(data: any[]) {
  const headers = [
    t('view.log.id'),
    t('view.log.workDatetime'),
    t('view.log.programType'),
    t('view.log.workType'),
    t('view.log.version'),
    t('view.log.logType'),
    t('view.log.rootMenu'),
    t('view.log.viewId'),
    t('view.log.viewName'),
    t('view.log.errorCode'),
    t('view.log.log'),
    t('view.log.logDetail'),
    t('view.log.etc'),
    t('view.log.hospitalId'),
    t('view.log.hospitalName'),
    t('view.log.pcName')
  ]

  const array = [headers].concat(
    data.map((item) =>
      (Object.values(item) as string[]).map((value) =>
        typeof value === 'string' && value.includes('\r\n') ? `"${value}"` : value
      )
    )
  )

  return array.map((row) => row.toString()).join('\n')
}

function downloadBlob(content: any, filename: string, contentType: string) {
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: contentType })
  const url = URL.createObjectURL(blob)

  const pom = document.createElement('a')
  pom.href = url
  pom.setAttribute('download', filename)
  pom.click()
}

function search() {
  currentPage.value = 0
  fetchData()
  fetchChart()
}
</script>

<template>
  <div>
    <!-- 검색 및 내보내기 섹션 -->
    <div class="search-section">
      <div>
        <strong>{{ t('view.searchArea.searchResult') }} :&nbsp;</strong>
        <strong class="search-result-count">{{ resultSize }}</strong>
      </div>
      <div style="display: flex">
        <ToggleSwitch v-model="checkedExcludeTest" />
        <label>{{ t('view.searchArea.excludeTest') }}</label>
      </div>
      <div>
        <FloatLabel variant="on">
          <MultiSelect
            v-model="checkedEventType"
            display="chip"
            :options="eventTypes"
            optionLabel="name"
            optionValue="key"
            placeholder="Select Log Level"
            filter
            filterPlaceholder="전체"
            :maxSelectedLabels="1"
            :size="'small'"
            overlay-style="font-size: var(--p-inputtext-sm-font-size); padding: var(--p-inputtext-sm-padding-y) var(--p-inputtext-sm-padding-x);"
          />
          <label>{{ t('view.searchArea.logType') }}</label>
        </FloatLabel>
      </div>
      <FloatLabel variant="on">
        <Select
          v-model="selectedProgram"
          :options="programs"
          optionLabel="label"
          optionValue="value"
          input-class="p-inputtext-sm"
        />
        <label>{{ t('view.searchArea.programType') }}</label>
      </FloatLabel>
      <div class="search-period">
        <FloatLabel variant="on">
          <DatePicker
            v-model="rangeDate"
            dateFormat="yy-mm-dd"
            showIcon
            iconDisplay="input"
            input-class="p-inputtext-sm"
            style="width: 11vw"
            selectionMode="range"
          />
          <label>{{ t('view.searchArea.period.log') }}</label>
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
            lazy
          />
          <label>{{ t('view.searchArea.searchType') }}</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText type="text" v-model="searchText" size="small" @keydown.enter="search" />
          </IconField>
          <label>{{ t('view.searchArea.searchText') }}</label>
        </FloatLabel>
        <Button :label="t('view.common.search')" @click="search" size="small" />
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
        class="h-[30rem]"
        style="height: 30rem; min-height: 300px; max-height: 800px"
      />
    </div>

    <div class="datatable-section">
      <DataTable
        :value="logs"
        paginator
        dataKey="id"
        ref="dataTable"
        style="font-size: 12px"
        filterDisplay="menu"
        :first="currentPage"
        :totalRecords="totalRecords"
        :rows-per-page-options="rowsPerPage"
        :rows="currentRowsPerPage"
        @page="onPageChange"
        selectionMode="single"
        @row-select="getDetail($event.data.id)"
        scrollable
        lazy
        :loading="loading"
      >
        <template #empty> No Logs found. </template>
        <template #loading> Loading Logs data. Please wait. </template>
        <Column field="id" :header="t('view.log.id')" style="min-width: 4rem; max-width: 7rem">
          <template #body="{ data }">
            {{ data.id }}
          </template>
        </Column>
        <Column
          field="workDatetime"
          :header="t('view.log.workDatetime')"
          style="min-width: 11rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ convertDate(data.workDatetime) }}
          </template>
        </Column>
        <Column
          field="hospitalId"
          :header="t('view.log.hospitalId')"
          style="min-width: 8rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.hospitalId }}
          </template>
        </Column>
        <Column
          field="hospitalName"
          :header="t('view.log.hospitalName')"
          style="
            min-width: 8rem;
            max-width: 12rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          <template #body="{ data }">
            {{ data.hospitalName }}
          </template>
        </Column>
        <Column
          field="pcName"
          :header="t('view.log.pcName')"
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
          :header="t('view.log.ip')"
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
          :header="t('view.log.macAddress')"
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
          :header="t('view.log.logType')"
          field="eventType"
          style="min-width: 6rem; max-width: 12rem"
        >
          <template #body="{ data }">
            <Tag :value="data.eventType" :severity="getSeverity(data.eventType)" />
          </template>
        </Column>
        <Column :header="t('view.log.errorCode')" field="errorCode" style="min-width: 12rem">
          <template #body="{ data }">
            {{ data.errorCode }}
          </template>
        </Column>
        <Column
          field="log"
          :header="t('view.log.log')"
          style="
            min-width: 20rem;
            max-width: 20rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          <template #body="{ data }">
            {{ data.log }}
          </template>
        </Column>
        <Column
          field="logDetail"
          :header="t('view.log.logDetail')"
          style="
            min-width: 20rem;
            max-width: 20rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          <template #body="{ data }">
            {{ data.logDetail }}
          </template>
        </Column>
        <Column
          field="rootMenu"
          :header="t('view.log.rootMenu')"
          style="min-width: 5rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.rootMenu }}
          </template>
        </Column>
        <Column
          field="viewId"
          :header="t('view.log.viewId')"
          style="
            min-width: 5rem;
            max-width: 12rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          <template #body="{ data }">
            {{ data.viewId }}
          </template>
        </Column>
        <Column
          field="viewName"
          :header="t('view.log.viewName')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.viewName }}
          </template>
        </Column>
        <Column
          field="userId"
          :header="t('view.log.userId')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.userId }}
          </template>
        </Column>
        <Column
          field="patientUid"
          :header="t('view.log.patientId')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.patientUid }}
          </template>
        </Column>
        <Column
          field="programType"
          :header="t('view.log.programType')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            <Tag :value="data.programType" :severity="pgTypeSeverity(data.programType)" />
          </template>
        </Column>
        <Column
          field="workType"
          :header="t('view.log.workType')"
          style="min-width: 8rem; max-width: 12rem"
        >
          <template #body="{ data }">
            <Tag :value="data.workType" :severity="workTypeSeverity(data.workType)" />
          </template>
        </Column>
        <Column
          :header="t('view.log.version')"
          field="version"
          style="min-width: 6rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.version }}
          </template>
        </Column>
        <!-- <Column
          field="id"
          header="상세보기"
          style="min-width: 6rem; max-width: 6rem"
          alignFrozen="right"
          :frozen="true"
        >
          <template #body="{ data }">
            <Button type="button" icon="pi pi-search" outlined @click="getDetail(data.id)" />
          </template>
        </Column> -->
      </DataTable>
    </div>
  </div>

  <LogDetailDialog
    v-if="showDialog"
    v-model:visible="showDialog"
    :type="'오류 로그'"
    :log="log"
    :pc="pc"
  />
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

.over_hidden {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
</style>
