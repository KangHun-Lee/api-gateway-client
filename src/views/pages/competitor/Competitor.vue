<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CompetitorPcService } from '@/service/CompetitorService'
import type { DataTablePageEvent } from 'primevue/datatable'
import { useApi } from '@/composables'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'
interface CompetitorData {
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

interface CompetitorGroupData {
  id: number
  hospitalId: string
  hospitalName: string
  competitorPgName: string
  competitorPgTotalCount: number
  firstInstallDatetime: string
  lastInstallDatetime: string
}

const { t } = useI18n()
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
  { label: '두번에/하나로', value: [0, 1] },
  { label: '두번에', value: [0] },
  { label: '하나로', value: [1] },
  { label: 'OneClick', value: [2] },
  { label: 'OneCodi', value: [3] },
  { label: 'OneMessenger', value: [4] }
]

const rangeTypes = [
  { label: `${t('view.competitorPc.workDateTime')}`, value: 'workDateTime' },
  {
    label: `${t('view.competitorPc.competitorInstallDatetime')}`,
    value: 'competitorInstallDatetime'
  }
]

const searchTypes = [
  { label: '선택', value: 'none' },
  { label: '시간', value: 'workDateTime' },
  { label: '요양기관번호', value: 'hospitalId' },
  { label: '치과명', value: 'hospitalName' },
  { label: 'MAC_주소', value: 'macAddress' },
  { label: 'PC명', value: 'pcName' },
  { label: '프로그램', value: 'programType' },
  { label: '경쟁사프로그램', value: 'competitorId' }
]

const selectedProgram = ref<number[]>([2])
const selectedRangeType = ref<string>('workDateTime')
const searchText = ref<string>('')

const resultSize = ref(0)
const dataEntries = ref<CompetitorData[]>([])
const rowsPerPage = ref<number[]>([5, 10, 15, 20])
const currentRowsPerPage = ref<number>(rowsPerPage.value[1])
const currentPage = ref<number>(0)
const totalRecords = ref<number>(0)
const selectedSearchType = ref<string>('competitorId')
const loading = ref<boolean>(true)

const isSearchModified = ref<boolean>(false)
const groupedDataEntries = ref<CompetitorGroupData[]>([])
const groupedPaginatedData = ref<CompetitorGroupData[]>([])
const groupedRowsPerPage = ref<number[]>([5, 10, 15, 20])
const groupedCurrentRowsPerPage = ref<number>(groupedRowsPerPage.value[1])
const groupedCurrentPage = ref<number>(0)
const groupedLoading = ref<boolean>(false)

async function exportCSV() {
  const exportCompetitorPcs = await CompetitorPcService.getCompetitorPcListWithConditon(
    selectedRangeType.value,
    startDateString.value,
    endDateString.value,
    selectedProgram.value,
    selectedSearchType.value,
    searchText.value
  )

  const csv = arrayToCsv(exportCompetitorPcs)

  downloadBlob(csv, '경쟁사설치정보.csv', 'text/csv;charset=utf-8')
}

function arrayToCsv(data: any[]) {
  const headers = [
    t('view.competitorPc.id'),
    t('view.competitorPc.hospitalId'),
    t('view.competitorPc.hospitalName'),
    t('view.competitorPc.ip'),
    t('view.competitorPc.macAddress'),
    t('view.competitorPc.pcName'),
    t('view.competitorPc.pgTypeName'),
    t('view.competitorPc.competitorPgName'),
    t('view.competitorPc.competitorInstallDatetime'),
    t('view.competitorPc.workDateTime')
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
const { successToast, errorToast } = useToastHelper()

async function fetchData() {
  loading.value = true
  try {
    const competitorPcList = await CompetitorPcService.getCompetitorPcListWithConditonWithPaging(
      currentPage.value / currentRowsPerPage.value,
      currentRowsPerPage.value,
      selectedRangeType.value,
      startDateString.value,
      endDateString.value,
      selectedProgram.value,
      selectedSearchType.value,
      searchText.value
    )
    if (competitorPcList) {
      dataEntries.value = competitorPcList.content

      resultSize.value =
        competitorPcList.content && competitorPcList.content.length === 0
          ? 0
          : competitorPcList.totalElements
      totalRecords.value =
        competitorPcList.content && competitorPcList.content.length === 0
          ? 0
          : competitorPcList.totalElements
    }
    successToast(t('api.competitorPc.success'))
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.competitorPc.authorization.error'))
      } else {
        errorToast()
      }
    }
    loading.value = false
  }
  loading.value = false
}

const getEarlierDate = (dateStr1: string, dateStr2: string): string => {
  return convertDate(dateStr1) < convertDate(dateStr2) ? dateStr1 : dateStr2
}

const getLaterDate = (dateStr1: string, dateStr2: string): string => {
  return convertDate(dateStr1) > convertDate(dateStr2) ? dateStr1 : dateStr2
}

async function getGroupedData() {
  groupedLoading.value = true
  try {
    if (isSearchModified.value) {
      isSearchModified.value = false

      const competitorPcs = await CompetitorPcService.getCompetitorPcListWithConditon(
        selectedRangeType.value,
        startDateString.value,
        endDateString.value,
        selectedProgram.value,
        selectedSearchType.value,
        searchText.value
      )

      if (competitorPcs) {
        const groupedCompetitorMap = new Map<string, CompetitorGroupData>()
        competitorPcs.forEach((item: CompetitorData) => {
          const key = `${item.hospitalId}`
          let index = 0

          if (!groupedCompetitorMap.has(key)) {
            groupedCompetitorMap.set(key, {
              id: index,
              hospitalId: item.hospitalId,
              hospitalName: item.hospitalName,
              competitorPgName: item.competitorPgName,
              competitorPgTotalCount: 1,
              firstInstallDatetime: item.competitorInstallDatetime,
              lastInstallDatetime: item.competitorInstallDatetime
            })
            index = index + 1
          } else {
            const target = groupedCompetitorMap.get(key)!

            groupedCompetitorMap.set(key, {
              id: index,
              hospitalId: key,
              hospitalName: target.hospitalName,
              competitorPgName: target.competitorPgName,
              competitorPgTotalCount: target.competitorPgTotalCount + 1,
              firstInstallDatetime: getEarlierDate(
                target.firstInstallDatetime,
                item.competitorInstallDatetime
              ),
              lastInstallDatetime: getLaterDate(
                target.lastInstallDatetime,
                item.competitorInstallDatetime
              )
            })
          }
        })

        groupedDataEntries.value = Array.from(groupedCompetitorMap.values()).flat()
      }
    }

    const start = groupedCurrentPage.value
    const end = groupedCurrentPage.value + groupedCurrentRowsPerPage.value
    groupedPaginatedData.value = groupedDataEntries.value.slice(start, end)
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.pc.authorization.error'))
      } else {
        errorToast()
      }
    }
    groupedLoading.value = false
  }
  groupedLoading.value = false
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.first
  currentRowsPerPage.value = event.rows
  fetchData()
}

const onGroupedPageChange = (event: DataTablePageEvent) => {
  groupedCurrentPage.value = event.first
  groupedCurrentRowsPerPage.value = event.rows
  getGroupedData()
}

function convertDate(dateTime: string) {
  const date = dateTime.split('T')[0]
  const time = dateTime.split('T')[1]
  const formattedDate = date + ' ' + time.split(':')[0] + ':' + time.split(':')[1]
  return formattedDate
}

function search() {
  currentPage.value = 0
  groupedCurrentPage.value = 0
  fetchData()
  getGroupedData()
}
onMounted(() => {
  fetchData()
})

watch([rangeDate, selectedProgram, selectedRangeType, searchTypes, searchText], () => {
  isSearchModified.value = true
})
</script>
<template>
  <div>
    <!-- 검색 및 내보내기 섹션 -->
    <div class="search-section">
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
          <Select
            v-model="selectedRangeType"
            :options="rangeTypes"
            optionLabel="label"
            optionValue="value"
            :placeholder="t('view.common.select')"
            input-class="p-inputtext-sm"
            lazy
            style="width: 200px; margin-left: 10px; margin-right: 5px"
          />
          <label>{{ t('view.searchArea.period.competitorPc.selectedPeriod') }}</label>
        </FloatLabel>
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
          <label>
            {{
              selectedRangeType === 'workDateTime'
                ? t('view.searchArea.period.competitorPc.collectionPeriod')
                : t('view.searchArea.period.competitorPc.Installationperiod')
            }}
          </label>
        </FloatLabel>
      </div>
      <div class="search-text-area">
        <Select
          v-model="selectedSearchType"
          :options="searchTypes"
          optionLabel="label"
          optionValue="value"
          :placeholder="t('view.common.select')"
          input-class="p-inputtext-sm"
          lazy
        ></Select>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText type="text" v-model="searchText" @keydown.enter = "search" />
        </IconField>
        <Button label="검색" @click="search()" />
        <Button label="내보내기" @click="exportCSV()" />
      </div>
      <div></div>
    </div>

    <!-- 경쟁사 데이터 그룹 집계 테이블 -->
    <div class="competitor-group-section">
      <div class="group-table">
        <DataTable
          :value="groupedPaginatedData"
          :first="groupedCurrentPage"
          :rows="groupedCurrentRowsPerPage"
          :rows-per-page-options="groupedRowsPerPage"
          :totalRecords="groupedDataEntries.length"
          ref="dataTable"
          style="font-size: 12px"
          dataKey="id"
          :loading="groupedLoading"
          paginator
          lazy
          @page="onGroupedPageChange"
        >
          <template #header>
            <div class="table-header">
              {{ t('view.competitorPc.group.title') }}
            </div>
            <div class="search-result">
              {{ t('view.searchArea.searchResult') }} :
              <strong class="search-result-count">{{ groupedDataEntries.length }}</strong>
            </div>            
          </template>
          <template #empty> No CompetitorPcs found. </template>
          <template #loading> Loading CompetitorPcs data. Please wait. </template>
          <Column
            field="hospitalId"
            :header="t('view.competitorPc.group.hospitalId')"
            style="min-width: 7rem; max-width: 9rem"
          >
            <template #body="{ data }">
              {{ data.hospitalId }}
            </template>
          </Column>
          <Column
            field="hospitalName"
            :header="t('view.competitorPc.group.hospitalName')"
            style="min-width: 7rem; max-width: 9rem"
          >
            <template #body="{ data }">
              {{ data.hospitalName }}
            </template>
          </Column>
          <Column
            field="competitorPgName"
            :header="t('view.competitorPc.group.competitorPgName')"
            style="min-width: 7rem; max-width: 9rem"
          >
            <template #body="{ data }">
              {{ data.competitorPgName }}
            </template>
          </Column>
          <Column
            field="competitorPgTotalCount"
            :header="t('view.competitorPc.group.competitorPgTotalCount')"
            style="min-width: 7rem; max-width: 9rem"
          >
            <template #body="{ data }">
              {{ data.competitorPgTotalCount }}
            </template>
          </Column>
          <Column
            field="firstInstallDatetime"
            :header="t('view.competitorPc.group.firstInstallDatetime')"
            style="min-width: 7rem; max-width: 9rem"
          >
            <template #body="{ data }">
              {{ convertDate(data.firstInstallDatetime) }}
            </template>
          </Column>
          <Column
            field="lastInstallDatetime"
            :header="t('view.competitorPc.group.lastInstallDatetime')"
            style="min-width: 7rem; max-width: 9rem"
          >
            <template #body="{ data }">
              {{ convertDate(data.lastInstallDatetime) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- 데이터 테이블 섹션 -->
    <div>
      <DataTable
        :value="dataEntries"
        :first="currentPage"
        :rows="currentRowsPerPage"
        :rows-per-page-options="rowsPerPage"
        :totalRecords="totalRecords"
        style="font-size: 12px"
        scrollable
        :loading="loading"
        paginator
        lazy
        @page="onPageChange"
      >
      <template #header>
        <div class="flex justify-between" style="display: flex; justify-content: space-between">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="search-result">
              {{ t('view.searchArea.searchResult') }} :
              <strong class="search-result-count">{{ resultSize }}</strong>
            </div>
          </div>
        </div>
      </template>      
        <template #empty> No CompetitorPcs found. </template>
        <template #loading> Loading CompetitorPcs data. Please wait. </template>
        <Column field="workDateTime" :header="t('view.competitorPc.workDateTime')">
          <template #body="{ data }">
            {{ convertDate(data.workDatetime) }}
          </template>
        </Column>
        <Column field="hospitalId" :header="t('view.competitorPc.hospitalId')">
          <template #body="{ data }">
            {{ data.hospitalId }}
          </template>
        </Column>
        <Column field="hospitalName" :header="t('view.competitorPc.hospitalName')">
          <template #body="{ data }">
            {{ data.hospitalName }}
          </template>
        </Column>
        <Column field="macAddress" :header="t('view.competitorPc.macAddress')">
          <template #body="{ data }">
            {{ data.macAddress }}
          </template>
        </Column>
        <Column field="ip" :header="t('view.competitorPc.ip')">
          <template #body="{ data }">
            {{ data.ip }}
          </template>
        </Column>
        <Column field="pcName" :header="t('view.competitorPc.pcName')">
          <template #body="{ data }">
            {{ data.pcName }}
          </template>
        </Column>
        <Column field="pgTypeName" :header="t('view.competitorPc.pgTypeName')">
          <template #body="{ data }">
            {{ data.pgTypeName }}
          </template>
        </Column>
        <Column field="competitorPgName" :header="t('view.competitorPc.competitorPgName')">
          <template #body="{ data }">
            {{ data.competitorPgName }}
          </template>
        </Column>
        <Column
          field="competitorInstallDatetime"
          :header="t('view.competitorPc.competitorInstallDatetime')"
        >
          <template #body="{ data }">
            {{ convertDate(data.competitorInstallDatetime) }}
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
.search-result {
  display: flex;
  font-size: 1rem;
  font-weight: normal;
}
.search-result-count {
  color: blue;
}
.search-section > *:not(:last-child) {
  margin-right: 10px;
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

.competitor-group-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.group-table {
  flex: 1;
  min-width: 0;

  .table-header {
    text-align: center;
    font-size: 1.5rem;
    font-weight: normal;
    padding: 1rem 0;
    width: 100%;
  }
}
</style>
