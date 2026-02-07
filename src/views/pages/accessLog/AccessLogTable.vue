<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { AccessLogService } from '@/service/AccessLogService'
import { useToastHelper } from '@/composables'
import LogDetailDialog from '@/views/pages/log/LogDetailDialog.vue'
import type { DataTablePageEvent } from 'primevue/datatable'
import type { PcData } from '@/service/PcService'
import { AxiosError } from 'axios'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
interface AccessLogData {
  id: string
  workDatetime: string
  programType: string
  version: string
  rootMenu: string
  viewId: string
  viewName: string
  functionName: string
  elementName: string
  action: string
  hospitalId: string
  hospitalName: string
  userId: string
  patientUid: string
  ip: string
  macAddress: string
  pcName: string
  eventType: string
  description: string
  loadingSpeed: string
  remark: string
}

const logs = ref<AccessLogData[]>()
const log = ref<AccessLogData>()
const pc = ref<PcData>()
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

const events = [
  { label: '기본', value: 0 },
  { label: '동기화', value: 12 }
]

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
  { label: '요양기관번호', value: 'hospitalId' },
  { label: '병원명', value: 'hospitalName' },
  { label: 'PC명', value: 'pcName' }
]
const selectedEvent = ref<number>(0)
const selectedProgram = ref<number>(2)
const searchText = ref<string>('')
const resultSize = ref(0)
const loading = ref<boolean>(false)
const showDialog = ref<boolean>(false)
const totalRecords = ref<number>(0)
const rowsPerPage = ref<number[]>([10, 20, 30, 50])
const currentRowsPerPage = ref<number>(rowsPerPage.value[0])
const currentPage = ref<number>(0)
const dataTable = ref()
const selectedSearchType = ref<string>('none')
const checkedExcludeTest = ref<boolean>(true)
const { successToast, errorToast } = useToastHelper()
const emit = defineEmits<{
  toggleView: [value: boolean]
}>()

const disabledExport = ref(false)
async function fetchData() {
  loading.value = true
  try {
    const tableData = await AccessLogService.getAccessLogsWithConditionAndPaging(
      currentPage.value / currentRowsPerPage.value,
      currentRowsPerPage.value,
      checkedExcludeTest.value,
      startDateString.value,
      endDateString.value,
      selectedEvent.value,
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
    }
    successToast(t('api.accessLog.success'))
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.accessLog.authorization.error'))
      } else {
        errorToast()
      }
    }
    console.error('Error fetching Access-logs with paging:', e)
  }

  loading.value = false
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.first
  currentRowsPerPage.value = event.rows
  fetchData()
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

async function getDetail(id: number) {
  const result = await AccessLogService.getAccessLogWithPc(id)
  log.value = result.value.data.accessLog
  pc.value = result.value.data.pcResponse
  showDialog.value = true
}

const exportCSV = async () => {
  disabledExport.value = true
  const exportLogs = await AccessLogService.getAccessLogsWithCondition(
    checkedExcludeTest.value,
    startDateString.value,
    endDateString.value,
    selectedEvent.value,
    selectedProgram.value,
    selectedSearchType.value,
    searchText.value
  )
  const csv = arrayToCsv(exportLogs)
  downloadBlob(csv, '사용정보 로그.csv', 'text/csv;charset=utf-8')
  disabledExport.value = false
}

function arrayToCsv(data: AccessLogData[]) {
  const headers = [
    t('view.accessLog.id'),
    t('view.accessLog.workDatetime'),
    t('view.accessLog.programType'),
    t('view.accessLog.version'),
    t('view.accessLog.rootMenu'),
    t('view.accessLog.viewId'),
    t('view.accessLog.viewName'),
    t('view.accessLog.functionName'),
    t('view.accessLog.elementName'),
    t('view.accessLog.loadingSpeed'),
    t('view.accessLog.description'),
    t('view.accessLog.action'),
    t('view.accessLog.hospitalName'),
    t('view.accessLog.hospitalId'),
    t('view.accessLog.pcName'),
    t('view.accessLog.ip'),
    t('view.accessLog.macAddress'),
    t('view.accessLog.userId')
  ]

  const cumstomData = data.map((item) => ({
    ...item,
    eventType: null,
    loadingSpeed:
      typeof item.loadingSpeed === 'string'
        ? (Number(item.loadingSpeed) / 1000).toFixed(2)
        : '-'
  }))

  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return ''

    const stringValue = String(value)

    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const array = [headers].concat(
    cumstomData.map((item) => {
      return Object.values(item).map(escapeCsvValue)
    })
  )

  return array.map((row) => row.join(',')).join('\n')
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
      <FloatLabel variant="on">
        <Select
          v-model="selectedEvent"
          :options="events"
          optionLabel="label"
          optionValue="value"
          input-class="p-inputtext-sm"
        />
        <label>{{ t('view.searchArea.eventType') }}</label>
      </FloatLabel>
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
            style="width: 10vw"
            selectionMode="range"
          />
          <label>{{ t('view.searchArea.period.accessLog') }}</label>
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
            <InputText type="text" v-model="searchText" size="small" @keydown.enter = "search" />
          </IconField>
          <label>{{ t('view.searchArea.searchText') }}</label>
        </FloatLabel>
        <Button :label="t('view.common.search')" @click="search()" size="small" />
        <Button
          :label="t('view.common.export')"
          @click="exportCSV()"
          size="small"
          :disabled="disabledExport"
        />
        <Button
          :label="t('view.searchArea.analyze')"
          class="pi pi-chart-scatter"
          @click="emit('toggleView', true)"
          size="small"
        />
      </div>
    </div>

    <div>
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
        <template #empty> No Access-Logs found. </template>
        <template #loading> Loading Access-Logs data. Please wait. </template>
        <Column
          field="id"
          :header="t('view.accessLog.id')"
          style="min-width: 4rem; max-width: 7rem"
        >
          <template #body="{ data }">
            {{ data.id }}
          </template>
        </Column>
        <Column
          field="workDatetime"
          :header="t('view.accessLog.workDatetime')"
          style="min-width: 11rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ convertDate(data.workDatetime) }}
          </template>
        </Column>
        <Column
          field="programType"
          :header="t('view.accessLog.programType')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            <Tag :value="data.programType" :severity="pgTypeSeverity(data.programType)" />
          </template>
        </Column>
        <Column
          :header="t('view.accessLog.version')"
          field="version"
          style="min-width: 6rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.version }}
          </template>
        </Column>
        <Column
          field="rootMenu"
          :header="t('view.accessLog.rootMenu')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.rootMenu }}
          </template>
        </Column>
        <Column
          field="viewId"
          :header="t('view.accessLog.viewId')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.viewId }}
          </template>
        </Column>
        <Column
          field="viewName"
          :header="t('view.accessLog.viewName')"
          style="min-width: 9rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.viewName }}
          </template>
        </Column>
        <Column
          field="functionName"
          :header="t('view.accessLog.functionName')"
          style="min-width: 9rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.functionName }}
          </template>
        </Column>
        <Column
          field="elementName"
          :header="t('view.accessLog.elementName')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.elementName }}
          </template>
        </Column>
        <Column
          field="action"
          :header="t('view.accessLog.loadingSpeed')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.loadingSpeed ? (data.loadingSpeed / 1000).toFixed(2) : '-' }}
          </template>
        </Column>
        <Column
          field="action"
          :header="t('view.accessLog.description')"
          style="min-width: 20rem; max-width: 25rem"
        >
          <template #body="{ data }">
            {{ data.description }}
          </template>
        </Column>
        <Column
          field="action"
          :header="t('view.accessLog.action')"
          style="
            min-width: 7rem;
            max-width: 12rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          <template #body="{ data }">
            {{ data.action }}
          </template>
        </Column>
        <Column
          field="hospitalName"
          :header="t('view.accessLog.hospitalName')"
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
          field="hospitalId"
          :header="t('view.accessLog.hospitalId')"
          style="min-width: 8rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.hospitalId }}
          </template>
        </Column>
        <Column
          field="pcName"
          :header="t('view.accessLog.pcName')"
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
          :header="t('view.accessLog.ip')"
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
          :header="t('view.accessLog.macAddress')"
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
          field="userId"
          :header="t('view.accessLog.userId')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.userId }}
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
    :type="'사용 정보'"
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
</style>
