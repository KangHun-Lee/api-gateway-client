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

interface DataEntry {
  id: number
  hospitalName: string
  hospitalId: number
  cpu: string
  ram: string
  os: string
  pgTypeName: string
  lastDatetime: string
  workTypeName: string
}

const { t } = useI18n()
const dataEntries = ref<DataEntry[]>([])
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
const rowsPerPage = ref<number[]>([10, 20, 30, 50])
const currentRowsPerPage = ref<number>(rowsPerPage.value[0])
const currentPage = ref<number>(0)

const { successToast, errorToast } = useToastHelper()
const emit = defineEmits<{
  toggleView: [value: boolean]
}>()

async function fetchData() {
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
    resultSize.value = pcs.content && pcs.content.length === 0 ? 0 : pcs.totalElements
    totalRecords.value = pcs.content && pcs.content.length === 0 ? 0 : pcs.totalElements
    dataEntries.value = pcs.content
    successToast(t('api.pc.success'))
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
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.page
  currentRowsPerPage.value = event.rows
  fetchData()
}

onMounted(() => {
  fetchData()
})

function convertDate(date: string) {
  const formattedDate = date.split('T')[0]
  return formattedDate
}

const exportCSV = async () => {
  const exportPc = await PcService.getPcsWithCondition(
    checkedExcludeTest.value,
    selectedProgram.value,
    lastDay.value,
    selectedSearchType.value,
    searchText.value
  )
  const csv = arrayToCsv(exportPc)
  downloadBlob(csv, '설치정보.csv', 'text/csv;charset=utf-8')
}

function arrayToCsv(data: any[]) {
  const headers = [
    t('view.pc.id'),
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

  const array = [headers].concat(data.map((item) => Object.values(item).map(escapeCsvValue)))

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
          :label="t('view.searchArea.analyze')"
          class="pi pi-chart-scatter"
          @click="emit('toggleView', true)"
          size="small"
        />
      </div>
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
        scrollable
        removableSort
        lazy
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
        <Column
          field="memory"
          :header="t('view.pc.memory')"
          style="min-width: 5rem; max-width: 7rem"
        >
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
        />
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
