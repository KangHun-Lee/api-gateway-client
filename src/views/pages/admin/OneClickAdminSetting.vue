<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AccessScreenService } from '@/service/AccessScreenService'
import type {
  RoleScreenAccessData,
  userResponse,
  userAuthResponse,
  userAuthRequest
} from '@/service/AccessScreenService'
import { useToastHelper, useConfirmHelper } from '@/composables'
import { AxiosError } from 'axios'
import InitialSettingByGroup from './InitialSettingByGroup.vue'

const { t } = useI18n()

const { successToast, errorToast } = useToastHelper()
const { showConfirmDialog } = useConfirmHelper()

interface group {
  label: string
  value: number
}

interface screen {
  id: number
  name: string
}

interface roleScreenAccess {
  id: number
  roleId: number
  screenId: number
}

interface roleData {
  id: number
  type: string
  name: string
}

interface userInfoData {
  user: userResponse
  userAuth: userAuthResponse
  screenList: roleScreenAccess[]
}

const groups = ref<group[]>([])
const filterGroups = ref<group[]>([])
const screens: screen[] = [
  { id: 1, name: '설치정보' },
  { id: 2, name: '오류로그' },
  { id: 3, name: '사용정보' },
  { id: 4, name: '경쟁제품 설치현황' },
  { id: 5, name: '치과 현황' },
  { id: 6, name: '공지사항' },
  { id: 11, name: '대시보드' }
]

const roleScreenAccessHistory = ref<number[]>([])
const selectedScreens = ref<number[]>([])
const selectedGroup = ref<number>()
const selectedFilterGroup = ref<number>()
const searchText = ref<string>('')
const dataEntries = ref<userInfoData[]>([])
const rowsPerPage = ref<number[]>([5, 10, 15, 20])
const currentRowsPerPage = ref<number>(rowsPerPage.value[0])
const currentPage = ref<number>(0)
const totalRecords = ref<number>(0)
const selectedUsers = ref<userInfoData[]>([])

const showModal = ref(false)
const handleInitSettingSave = async () => {
  await fetchUserScreenAccess()
  showModal.value = false
}

const handleFilterDropdownClick = () => {
  if (selectedFilterGroup.value !== null) {
    const selectedGroup = filterGroups.value.find(
      (groups) => groups.value === selectedFilterGroup.value
    )
    if (selectedGroup) {
      searchText.value = selectedGroup.label === '전체' ? '' : selectedGroup.label
    }
  }
}

/**
 * 그룹별 권한 설정 관련
 */
async function fetchRoles() {
  try {
    const data = await AccessScreenService.getRoleList()
    if (data != null) {
      groups.value = data.map((item: roleData) => ({ label: item.name, value: item.id }))

      const maxValue = Math.max(...groups.value.map((group) => group.value), 0)
      filterGroups.value = [{ label: '전체', value: maxValue + 1 }, ...groups.value]
      selectedFilterGroup.value = filterGroups.value[0].value
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.AccessScreen.authorization.get.error'))
      } else {
        errorToast(t('api.AccessScreen.get.error'))
      }
    }
  }
}

/**
 * 계정 정보 관련
 */
async function fetchUserScreenAccess() {
  try {
    const userScreenAccessList = await AccessScreenService.getAccountInfosWithConditionAndPaging(
      currentPage.value / currentRowsPerPage.value,
      currentRowsPerPage.value,
      searchText.value
    )

    if (userScreenAccessList) {
      dataEntries.value = userScreenAccessList.content

      totalRecords.value =
        userScreenAccessList.content && userScreenAccessList.content.length === 0
          ? 0
          : userScreenAccessList.totalElements
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.AccessScreen.get.authorization.error'))
      } else {
        errorToast(t('api.AccessScreen.get.error'))
      }
    }
  }
}

async function updateUserRoleaccess() {
  if (selectedUsers.value == undefined || selectedUsers.value.length == 0) {
    errorToast(t('api.AccessScreen.save.empty'))
    return
  }

  try {
    const users: userAuthRequest[] = selectedUsers.value.map((item) => ({
      id: item.userAuth.id,
      roleId: item.userAuth.roleId
    }))

    await AccessScreenService.updateUserRoleAccess(users)
    successToast(t('api.AccessScreen.save.success'))
    selectedUsers.value = []
    fetchUserScreenAccess()
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.AccessScreen.save.authorization.error'))
      } else {
        errorToast(t('api.AccessScreen.save.error'))
      }
    }
  }
}

function cancelChangeUserRole() {
  selectedUsers.value = []
  currentPage.value = 0
  searchText.value != '' ? (searchText.value = '') : fetchUserScreenAccess()
}

const onPageChange = () => {
  selectedUsers.value = []
  fetchUserScreenAccess()
}

async function changeUserAccessConfirm() {
  try {
    const result = await showConfirmDialog('계정 정보 설정 저장', '변경 내용을 저장하시겠습니까?')

    if (result) {
      updateUserRoleaccess()
    } else {
      cancelChangeUserRole()
    }
  } catch (error) {
    errorToast(t('api.AccessScreen.save.error'))
  }
}

const isChecked = (screenList: roleScreenAccess[]) => {
  return computed(() => screenList.map((screen) => screen.screenId))
}

let timeout: number

watch(
  searchText,
  () => {
    if (timeout) {
      clearTimeout(timeout)
    }
    selectedUsers.value = []
    currentPage.value = 0

    timeout = setTimeout(() => {
      fetchUserScreenAccess()
    }, 500)
  },
  { immediate: true }
)

function addUser(user: userInfoData) {
  selectedUsers.value.push(user)
}

const isDisableUser = computed(() => selectedUsers.value.length == 0)

onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <div>
    <div class="section search-section">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText type="text" v-model="searchText" />
      </IconField>
    </div>
    <!--계정정보 테이블 섹션 -->
    <div class="setting-section">
      <div class="setting-table">
        <DataTable
          v-model:selection="selectedUsers"
          :value="dataEntries"
          :rows="currentRowsPerPage"
          :rows-per-page-options="rowsPerPage"
          :totalRecords="totalRecords"
          style="font-size: 12px"
          scrollable
          lazy
        >
          <template #header>
            <div class="table-header">
              {{ t('view.admin.title.accountInfo') }}
            </div>
            <div>
              <FloatLabel variant="on">
                <Dropdown
                  v-model="selectedFilterGroup"
                  :options="filterGroups"
                  optionLabel="label"
                  optionValue="value"
                  filter
                  filterPlaceholder="Select Filter Group"
                  :show-select-all="true"
                  @change="handleFilterDropdownClick"
                />
                <label>{{ t('view.admin.table.group') }}</label>
              </FloatLabel>
            </div>
          </template>
          <template #empty> No accountInfo found. </template>
          <template #loading> Loading accountInfo data. Please wait. </template>
          <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
          <Column
            field="group"
            :header="t('view.admin.table.group')"
            headerClass="custom-header-class"
            bodyClass="custom-body-class"
            style="width: 15rem"
          >
            <template #body="{ data }">
              <Select
                v-model="data.userAuth.roleId"
                :options="groups"
                optionLabel="label"
                optionValue="value"
                input-class="p-inputtext-sm"
                style="width: 9vw; text-align: start"
                size="large"
                @update:model-value="addUser(data)"
              />
            </template>
          </Column>
          <Column
            field="employeeNumber"
            :header="t('view.admin.table.employeeNumber')"
            headerClass="custom-header-class"
            bodyClass="custom-body-class"
          >
            <template #body="{ data }">
              {{ data.user.employeeNo }}
            </template>
          </Column>
          <Column
            field="departmentName"
            :header="t('view.admin.table.departmentName')"
            headerClass="custom-header-class"
            bodyClass="custom-body-class"
          >
            <template #body="{ data }">
              {{ data.user.departmentName }}
            </template>
          </Column>
          <Column
            field="positionName"
            :header="t('view.admin.table.positionName')"
            headerClass="custom-header-class"
            bodyClass="custom-body-class"
          >
            <template #body="{ data }">
              {{ data.user.positionName }}
            </template>
          </Column>
          <Column
            field="name"
            :header="t('view.admin.table.name')"
            headerClass="custom-header-class"
            bodyClass="custom-body-class"
          >
            <template #body="{ data }">
              {{ data.user.name }}
            </template>
          </Column>
          <Column
            field="email"
            :header="t('view.admin.table.email')"
            headerClass="custom-header-class"
            bodyClass="custom-body-class"
          >
            <template #body="{ data }">
              {{ data.user.email }}
            </template>
          </Column>
          <Column
            v-for="screen in screens"
            :key="screen.id"
            :field="screen.name"
            :header="screen.name"
            headerClass="custom-header-class"
            bodyClass="custom-body-class"
            style="width: 9rem"
          >
            <template #body="{ data }">
              <Checkbox
                v-model="isChecked(data.screenList).value"
                :inputId="screen.name"
                :value="screen.id"
                disabled
              />
            </template>
          </Column>
        </DataTable>
        <Paginator
          v-model:first="currentPage"
          v-model:rows="currentRowsPerPage"
          :totalRecords="totalRecords"
          :rowsPerPageOptions="rowsPerPage"
          @update:rows="onPageChange"
        >
        </Paginator>
      </div>
    </div>
    <div class="operator-section">
      <!-- 그룹별 권한 초기 설정 -->
      <div>
        <Button
          :label="t('view.admin.title.initialSettingbyGroup')"
          @click="showModal = true"
          :disabled="groups.length === 0"
        />
        <Dialog
          :header="t('view.admin.title.initialSettingbyGroup')"
          :modal="true"
          v-model:visible="showModal"
        >
          <InitialSettingByGroup :groups="groups" @save="handleInitSettingSave" />
        </Dialog>
      </div>
      <Button
        :label="t('view.common.cancel')"
        variant="outlined"
        @click="cancelChangeUserRole()"
        :disabled="isDisableUser"
      />
      <Button
        :label="t('view.common.save')"
        @click="changeUserAccessConfirm()"
        :disabled="isDisableUser"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.section {
  margin-bottom: 20px;
}

.search-section {
  display: flex;
  align-items: center;
  justify-content: end;

  > *:not(:last-child) {
    margin-right: 10px;
  }
}

.setting-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.setting-table {
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

.operator-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  > *:not(:last-child) {
    margin-right: 10px;
  }
}

.custom-header-class {
  > div {
    justify-content: center;
  }
}
.custom-body-class {
  text-align: center;
}
</style>
