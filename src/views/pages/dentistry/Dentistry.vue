<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { DentistryService } from '@/service/DentistryService'
import type { DataTableFilterMeta, DataTablePageEvent } from 'primevue/datatable'
import { useI18n } from 'vue-i18n'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'

interface pmsUsageDataEntry {
  programType: number
  usageCount?: number
}

interface DataEntry {
  id: number
  hospitalId: number
  hospitalName: string
  pgTypeName: string
  usedProgram: string
  pmsContractState: string
  serverCount: number
  clientCount: number
  region: string
  address: string
  telephone: string
  doctorCount: number
  employeeCount: number
  electronicSignatureYn: string
  dbUsableCapacity: string
  businessRegistrationNumber: string
  claimYn: string
}

const { t } = useI18n()
const dataEntries = ref<DataEntry[]>([])
const pmsUsageData = ref<pmsUsageDataEntry[]>([
  { programType: 0 },
  { programType: 1 },
  { programType: 2 }
])
const programs = [
  { label: '두번에', value: 0 },
  { label: '하나로', value: 1 },
  { label: 'OneClick', value: 2 },
  { label: 'OneCodi', value: 3 },
  { label: 'OneMessenger', value: 4 }
]
const pmsDataTable = ref()
const dataTable = ref()
const selectedProgram = ref<number>(2)
const searchText = ref<string>('')
const resultSize = ref(0)
const loading = ref<boolean>(true)
const pmsLoading = ref<boolean>(true)
const filters = ref<DataTableFilterMeta>({})
const checkedExcludeTest = ref<boolean>(true)
const lastDay = ref<number>(90)
const selectedSearchType = ref<string>('none')
const searchTypes = [
  { label: '선택', value: 'none' },
  { label: '치과명', value: 'hospitalName' },
  { label: '요양기관번호', value: 'hospitalId' },
  { label: 'PMS', value: 'programType' },
  { label: '주소', value: 'address' },
  { label: '전화번호', value: 'telephone' },
  { label: '계약상태', value: 'pmsContractState' },
  { label: '사업자등록번호', value: 'businessRegistrationNumber' }
]
const totalRecords = ref<number>(0)
const rowsPerPage = ref<number[]>([5, 10, 20, 30, 50])
const currentRowsPerPage = ref<number>(rowsPerPage.value[0])
const currentPage = ref<number>(0)
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

const { successToast, errorToast } = useToastHelper()
const emit = defineEmits<{
  toggleView: [value: boolean]
}>()

async function fetchData() {
  loading.value = true
  try {
    const dentistryDatas = await DentistryService.getDentistryWithConditionWithPaging(
      currentPage.value / currentRowsPerPage.value,
      currentRowsPerPage.value,
      checkedExcludeTest.value,
      startDateString.value,
      endDateString.value,
      selectedSearchType.value,
      searchText.value
    )
    resultSize.value =
      dentistryDatas.content && dentistryDatas.content.length === 0
        ? 0
        : dentistryDatas.totalElements
    totalRecords.value =
      dentistryDatas.content && dentistryDatas.content.length === 0
        ? 0
        : dentistryDatas.totalElements

    const transformedDentistryData = dentistryDatas.content.map((item: any): DataEntry => {
      return {
        ...item,
        usedProgram: convertProgramType(item.usedProgram),
        pmsContractState: convertContractStatus(item.pmsContractState),
        electronicSignatureYn: convertelectronicSignatureStatus(item.electronicSignatureYn),
        claimYn: converClaimStatus(item.claimYn)
      }
    })
    dataEntries.value = transformedDentistryData
    console.log('dataEntries.value >> ', dataEntries.value)
    successToast(t('api.dentistry.detailsOfContractByDentalClinic.success'))
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

async function pmsFetchData() {
  pmsLoading.value = true
  try {
    const dentistryDatas: pmsUsageDataEntry[] =
      await DentistryService.getPmsUsageStatusWithCondition(
        checkedExcludeTest.value,
        startDateString.value,
        endDateString.value,
        selectedSearchType.value,
        searchText.value
      )
    // resultSize.value =
    //   dentistryDatas.content && dentistryDatas.content.length === 0
    //     ? 0
    //     : dentistryDatas.totalElements
    // totalRecords.value =
    //   dentistryDatas.content && dentistryDatas.content.length === 0
    //     ? 0
    //     : dentistryDatas.totalElements

    pmsUsageData.value = pmsUsageData.value.map((pms) => {
      const matchedPgType = dentistryDatas.find(
        (data: pmsUsageDataEntry) => data.programType === pms.programType
      )

      return matchedPgType
        ? { programType: pms.programType, usageCount: matchedPgType.usageCount }
        : pms
    })
    successToast(t('api.dentistry.pmsContractAndUsageStatus.success'))
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.pc.authorization.error'))
      } else {
        errorToast()
      }
    }
    pmsLoading.value = false
  }
  pmsLoading.value = false
}

const onPageChange = (event: DataTablePageEvent) => {
  currentPage.value = event.first
  currentRowsPerPage.value = event.rows
  fetchData()
}

onMounted(() => {
  pmsFetchData()
  fetchData()
})

function convertDate(date: string) {
  const formattedDate = date.split('T')[0]
  return formattedDate
}

const exportCSV = async () => {
  // TODO : 치과 현황 데이터 표시 전체개발 완료 후 진행
  const exportPc = await DentistryService.getDentistryWithCondition(
    checkedExcludeTest.value,
    startDateString.value,
    endDateString.value,
    selectedSearchType.value,
    searchText.value
  )
  const csv = arrayToCsv(exportPc)
  downloadBlob(csv, '치과 현황 정보.csv', 'text/csv;charset=utf-8')
}

function arrayToCsv(data: DataEntry[]) {
  const headers = [
    t('view.dentistry.hospitalId'),
    t('view.dentistry.hospitalName'),
    t('view.dentistry.programType'),
    t('view.dentistry.contractStatus'),
    t('view.dentistry.server'),
    t('view.dentistry.client'),
    t('view.dentistry.region'),
    t('view.dentistry.address'),
    t('view.dentistry.telephone'),
    t('view.dentistry.electronicSignatureYn'),
    t('view.dentistry.dbUsableCapacity'),
    t('view.dentistry.dentistCount'),
    t('view.dentistry.employeeCount'),
    t('view.dentistry.joinDate'),
    t('view.dentistry.withdrawalDate'),
    t('view.dentistry.businessRegistrationNumber'),
    t('view.dentistry.claimYn')
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

  const transformedDentistryData = data.map((item: any): DataEntry => {
    return {
      ...item,
      usedProgram: convertProgramType(item.usedProgram),
      pmsContractState: convertContractStatus(item.pmsContractState),
      electronicSignatureYn: convertelectronicSignatureStatus(item.electronicSignatureYn),
      claimYn: converClaimStatus(item.claimYn) // 서버에서는 claimYn 으로 전달 중
    }
  })
  const array = [headers].concat(
    transformedDentistryData.map((item) => Object.values(item).map(escapeCsvValue))
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

function convertProgramType(programType: number) {
  switch (programType) {
    case 0:
      return '두번에'
    case 1:
      return '하나로'
    case 2:
      return 'OneClick'
    case 3:
      return 'OneCodi'
    case 4:
      return 'OneMessenger'
    default:
      return '-'
  }
}

function convertContractStatus(pmsContractState: number) {
  switch (pmsContractState) {
    case 0:
      return '미계약'
    case null:
      return '-'
    default:
      return '계약'
  }
}

function convertelectronicSignatureStatus(electronicSignature: string) {
  switch (electronicSignature) {
    case 'Y':
      return '서명'
    case 'N':
      return '미서명'
    default:
      return '-'
  }
}

function converClaimStatus(claimYn: string) {
  switch (claimYn) {
    case 'Y':
      return '청구'
    case 'N':
      return '미청구'
    default:
      return '-'
  }
}

function search() {
  currentPage.value = 0
  fetchData()
  pmsFetchData()
}
</script>

<template>
  <div>
    <!-- 검색 및 내보내기 섹션 -->
    <div class="search-section">
      <div style="display: flex">
        <ToggleSwitch v-model="checkedExcludeTest" />
        <label>{{ t('view.searchArea.excludeTest') }}</label>
      </div>
      <!-- <FloatLabel variant="on">
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
      </FloatLabel> -->
      <!-- <div class="search-period">
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
          <label>{{ t('view.searchArea.period.dentistry') }}</label>
        </FloatLabel>
      </div> -->
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
            <InputText type="text" v-model="searchText" size="small" @keydown.enter="search" />
          </IconField>
          <label>{{ t('view.searchArea.searchText') }}</label>
        </FloatLabel>
        <Button :label="t('view.common.search')" @click="search()" size="small" />
        <Button :label="t('view.common.export')" @click="exportCSV()" size="small" />
        <Button
          :label="t('view.searchArea.analyze')"
          class="pi pi-chart-scatter"
          @click="emit('toggleView', true)"
          size="small"
        />
      </div>
    </div>
  </div>

  <div class="pms-contract-section">
    <div class="pms-status-overview-table">
      <DataTable
        :value="pmsUsageData"
        ref="pmsDataTable"
        style="font-size: 12px"
        dataKey="programType"
        filterDisplay="menu"
        :loading="pmsLoading"
        scrollable
        lazy
      >
        <template #header>
          <div class="table-header">
            {{ t('view.dentistry.title.pmsContractAndUsageStatus') }}
          </div>
        </template>
        <template #empty> No pms contract status data found. </template>
        <template #loading> Loading pms contract status data. Please wait. </template>
        <Column
          field="programType"
          :header="t('view.dentistry.classification')"
          style="min-width: 8rem; max-width: 10rem"
        >
          <template #body="{ data }">
            {{ convertProgramType(data.programType) }}
          </template>
        </Column>
        <Column
          field="contract"
          :header="t('view.dentistry.contract')"
          style="min-width: 8rem; max-width: 10rem"
        >
          <template #body="{ data }"> {{ data.contract ? data.contract : 0 }} 개 </template>
        </Column>
        <Column
          field="uncontracted"
          :header="t('view.dentistry.uncontracted')"
          style="min-width: 8rem; max-width: 10rem"
        >
          <template #body="{ data }">
            {{ data.uncontracted ? data.uncontracted : data.usageCount }} 개
          </template>
        </Column>
        <Column
          field="usageCount"
          :header="t('view.dentistry.usageCount')"
          style="min-width: 8rem; max-width: 10rem"
        >
          <template #body="{ data }"> {{ data.usageCount ? data.usageCount : 0 }} 개 </template>
        </Column>
        <Column
          field="contractPercent"
          :header="t('view.dentistry.contractPercent')"
          style="min-width: 8rem; max-width: 10rem"
        >
          <template #body="{ data }">
            {{ data.contractPercent ? data.contractPercent : 0 }} %
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <div class="pms-contract-section">
    <!-- 데이터 테이블 섹션 -->
    <div class="pms-status-details-table">
      <DataTable
        v-model:filters="filters"
        :value="dataEntries"
        ref="dataTable"
        paginator
        style="font-size: 12px"
        dataKey="hospitalId"
        filterDisplay="menu"
        :first="currentPage"
        :totalRecords="totalRecords"
        :rows-per-page-options="rowsPerPage"
        :rows="currentRowsPerPage"
        @page="onPageChange"
        :loading="loading"
        scrollable
        lazy
      >
        <template #header>
          <div class="table-header">
            {{ t('view.dentistry.title.detailsOfContractByDentalClinic') }}
          </div>
          <div class="search-result">
            {{ t('view.searchArea.searchResult') }} :
            <strong class="search-result-count">{{ resultSize }}</strong>
          </div>                
        </template>
        <template #empty> No dental status data found. </template>
        <template #loading> Loading dental status data data. Please wait. </template>
        <Column
          field="hospitalId"
          :header="t('view.dentistry.hospitalId')"
          style="min-width: 6rem; max-width: 10rem"
        >
          <template #body="{ data }">
            {{ data.hospitalId }}
          </template>
        </Column>
        <Column
          field="hospitalName"
          :header="t('view.dentistry.hospitalName')"
          style="min-width: 9rem; max-width: 11rem"
        >
          <template #body="{ data }">
            {{ data.hospitalName }}
          </template>
        </Column>
        <Column
          field="usedProgram"
          :header="t('view.dentistry.programType')"
          style="min-width: 8rem; max-width: 10rem"
        >
          <template #body="{ data }">
            <Tag :value="data.usedProgram" :severity="pgTypeSeverity(data.usedProgram)" />
          </template>
        </Column>
        <Column
          field="contractStatus"
          :header="t('view.dentistry.contractStatus')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            {{ data.pmsContractState }}
          </template>
        </Column>
        <Column
          field="serverCount"
          :header="t('view.dentistry.server')"
          style="min-width: 4rem; max-width: 12rem"
        />
        <Column
          field="clientCount"
          :header="t('view.dentistry.client')"
          style="min-width: 6rem; max-width: 7rem"
        />
        <Column
          field="region"
          :header="t('view.dentistry.region')"
          style="min-width: 5rem; max-width: 12rem"
        />
        <Column
          field="address"
          :header="t('view.dentistry.address')"
          style="min-width: 10rem; max-width: 12rem"
        />
        <Column
          field="telephone"
          :header="t('view.dentistry.telephone')"
          style="min-width: 10rem; max-width: 12rem"
        />
        <Column
          field="electronicSignatureYn"
          :header="t('view.dentistry.electronicSignatureYn')"
          style="min-width: 7rem; max-width: 9rem"
        >
          <template #body="{ data }">
            {{ data.electronicSignatureYn }}
          </template>
        </Column>
        <Column
          field="dbUsableCapacity"
          :header="t('view.dentistry.dbUsableCapacity')"
          style="min-width: 6rem; max-width: 12rem"
        />
        <Column
          field="doctorCount"
          :header="t('view.dentistry.dentistCount')"
          style="min-width: 7rem; max-width: 9rem"
        />
        <Column
          field="employeeCount"
          :header="t('view.dentistry.employeeCount')"
          style="min-width: 7rem; max-width: 9rem"
        />
        <Column
          field="joinDate"
          :header="t('view.dentistry.joinDate')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.joinDate }}
            <!-- {{ convertDate(data.joinDate) }} -->
          </template>
        </Column>
        <Column
          field="withdrawalDate"
          :header="t('view.dentistry.withdrawalDate')"
          style="min-width: 7rem; max-width: 12rem"
        >
          <template #body="{ data }">
            {{ data.withdrawalDate }}
            <!-- {{ convertDate(data.withdrawalDate) }} -->
          </template>
        </Column>
        <Column
          field="businessRegistrationNumber"
          :header="t('view.dentistry.businessRegistrationNumber')"
          style="min-width: 10rem; max-width: 10rem"
        >
          <template #body="{ data }">
            {{ data.businessRegistrationNumber }}
          </template>
        </Column>
        <Column
          field="claimYn"
          :header="t('view.dentistry.claimYn')"
          style="min-width: 6rem; max-width: 10rem"
        >
          <template #body="{ data }">
            {{ data.claimYn }}
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

.pms-contract-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.pms-status-overview-table {
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

.pms-status-details-table {
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
