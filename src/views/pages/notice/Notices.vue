<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { useToastHelper, useConfirmHelper } from '@/composables'
import type { noticesUserInfo, noticesIndex } from '@/service/NoticesService'
import { NoticesService } from '@/service/NoticesService'

const { t } = useI18n()
const { successToast, errorToast } = useToastHelper()
const { showConfirmDialog } = useConfirmHelper()

const tabs = ref([
  { title: '전체', content: -1, value: '0' },
  { title: 'ONECLICK', content: 2, value: '1' },
  { title: '하나로', content: 1, value: '2' },
  { title: '두번에', content: 0, value: '3' }
])

const router = useRouter()

const rowsPerPage = ref<number[]>([5, 10, 15, 20])
const currentRowsPerPage = ref<number>(rowsPerPage.value[2])
const dataEntries = ref<noticesUserInfo[]>([])
const selectedDelete = ref<noticesUserInfo[]>([])
const haveIndexData = ref<noticesUserInfo[]>([])
const loading = ref<boolean>(true)

const currentPage = ref<number>(0)
const totalRecords = ref<number>(0)
const searchText = ref<string>('')

const activePgtype = ref()
const isDisabledDelete = computed(() => selectedDelete.value.length == 0)

const activeChangeOrder = ref<boolean>(false)

function isactiveChangeOrder() {
  activeChangeOrder.value = !activeChangeOrder.value
}

async function fetchData() {
  loading.value = true
  try {
    const noticeUserList = await NoticesService.geteNoticeUserInfoListWithConditionAndPaging(
      currentPage.value / 5,
      currentRowsPerPage.value,
      searchText.value,
      activePgtype.value
    )

    if (noticeUserList) {
      dataEntries.value = noticeUserList.content

      haveIndexData.value = noticeUserList.content.filter(
        (data: noticesUserInfo) => data.notices.index != null
      )
      totalRecords.value =
        noticeUserList.content && noticeUserList.content.length === 0
          ? 0
          : noticeUserList.totalElements
    }
    successToast(t('api.notices.info.success'))
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.notices.info.authorization.error'))
      } else {
        errorToast(t('api.notices.info.error'))
      }
      loading.value = false
    }
  }
  loading.value = false
}

async function deleteRequest() {
  try {
    const result = await showConfirmDialog(
      t('api.notices.delete.save.header'),
      t('api.notices.delete.save.message')
    )

    if (result) {
      deleteNotices()
    }
  } catch (error) {
    errorToast(t('api.notices.delete.save.error'))
  }
}

async function swapIndex(first: noticesIndex, second: noticesIndex) {
  try {
    await NoticesService.swapIndex(first, second)
    fetchData()
    successToast(t('api.notices.index.save.success'))
  } catch (error) {
    errorToast(t('api.notices.index.save.error'))
  }
}

async function deleteNotices() {
  try {
    const idList: number[] = selectedDelete.value.map((data) => {
      return data.notices.id
    })
    await NoticesService.deleteNoticesList(idList)
    fetchData()
    successToast(t('api.notices.delete.save.success'))
  } catch (error) {
    errorToast(t('api.notices.delete.save.error'))
  }
}

function convertDate(dateTime: string) {
  const date = dateTime.split('T')[0]
  // const time = dateTime.split('T')[1]
  // const formattedDate = date + ' ' + time.split(':')[0] + ':' + time.split(':')[1]
  return date
}

function activeTab(value: number) {
  activePgtype.value = value > 0 ? tabs.value[value].content : null

  fetchData()
}

function onPageChange() {
  fetchData()
}

function upOrder(id: number, index: number) {
  const fristIndex = haveIndexData.value[0].notices.index

  if (fristIndex && index > fristIndex && haveIndexData.value.length > 1) {
    const nowArrayIndex = haveIndexData.value.findIndex((i) => i.notices.index == index)
    const beforeData = haveIndexData.value[nowArrayIndex - 1]

    if (beforeData.notices.index) {
      swapIndex({ id, index }, { id: beforeData.notices.id, index: beforeData.notices.index })
    }
  }
}

function downOrder(id: number, index: number) {
  const lastIndex = haveIndexData.value[haveIndexData.value.length - 1].notices.index

  if (lastIndex && index < lastIndex) {
    const nowArrayIndex = haveIndexData.value.findIndex((i) => i.notices.index == index)
    const afterData = haveIndexData.value[nowArrayIndex + 1]

    if (afterData.notices.index) {
      swapIndex({ id, index }, { id: afterData.notices.id, index: afterData.notices.index })
    }
  }
}

let timeout: number

watch(
  searchText,
  () => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      currentPage.value = 0
      fetchData()
    }, 500)
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <div class="section">
      <strong>{{ t('view.notices.title.pmsNoticesList') }}</strong>
    </div>

    <Tabs value="0" @update:value="activeTab">
      <TabList>
        <Tab v-for="tab in tabs" :key="tab.title" :value="tab.value">{{ tab.title }}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel v-for="tab in tabs" :key="tab.title" :value="tab.value">
          <!--계정정보 테이블 섹션 -->
          <div class="section">
            <DataTable
              v-model:selection="selectedDelete"
              :value="dataEntries"
              :rows="currentRowsPerPage"
              :rows-per-page-options="rowsPerPage"
              :totalRecords="totalRecords"
              style="font-size: 12px"
              :loading="loading"
              scrollable
              lazy
            >
              <template #empty> No notice found. </template>
              <template #loading> Loading notice data. Please wait. </template>
              <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>

              <Column
                field="id"
                :header="t('view.notices.table.id')"
                headerClass="custom-header-class"
                bodyClass="custom-body-class"
                style="width: 7%"
              >
                <template #body="{ data }">
                  <div v-if="activeChangeOrder && data.notices.index">
                    <Button
                      icon="pi pi-sort-up"
                      variant="text"
                      class="order-btn"
                      @click="upOrder(data.notices.id, data.notices.index)"
                    />
                    <Button
                      icon="pi pi-sort-down"
                      variant="text"
                      class="order-btn"
                      @click="downOrder(data.notices.id, data.notices.index)"
                    />
                  </div>
                  <div v-else>
                    {{ data.notices.index ? '공지' : data.notices.id }}
                  </div>
                </template>
              </Column>
              <Column
                field="category"
                :header="t('view.notices.table.category')"
                headerClass="custom-header-class"
                bodyClass="custom-body-class"
              >
                <template #body="{ data }">
                  {{ data.notices.pgTypeName }}
                </template>
              </Column>
              <Column
                field="title"
                :header="t('view.notices.table.title')"
                headerClass="custom-header-class"
              >
                <template #body="{ data }">
                  <router-link :to="{ name: 'noticesDetail', query: { id: data.notices.id } }">{{
                    data.notices.title
                  }}</router-link>
                </template>
              </Column>
              <Column
                field="file"
                :header="t('view.notices.table.file')"
                headerClass="custom-header-class"
                bodyClass="custom-body-class"
              >
                <template> - </template>
              </Column>
              <Column
                field="writer"
                :header="t('view.notices.table.writer')"
                headerClass="custom-header-class"
                bodyClass="custom-body-class"
              >
                <template #body="{ data }">
                  {{ data.user.departmentName }} {{ data.user.name }}
                </template>
              </Column>
              <Column
                field="registrationDateTime"
                :header="t('view.notices.table.saveDateTime')"
                headerClass="custom-header-class"
                bodyClass="custom-body-class"
              >
                <template #body="{ data }">
                  {{ convertDate(data.notices.saveDateTime) }}
                </template>
              </Column>
              <Column
                field="viewCount"
                :header="t('view.notices.table.noticeStartDate')"
                headerClass="custom-header-class"
                bodyClass="custom-body-class"
              >
                <template #body="{ data }">
                  {{ data.notices.noticeStartDate }}
                </template>
              </Column>
              <Column
                field="viewCount"
                :header="t('view.notices.table.noticeEndDate')"
                headerClass="custom-header-class"
                bodyClass="custom-body-class"
              >
                <template #body="{ data }">
                  {{ data.notices.noticeEndDate }}
                </template>
              </Column>
            </DataTable>
            <div class="pagination-section">
              <div>
                <Button
                  :label="'공지글 쓰기'"
                  variant="outlined"
                  class="button-section"
                  @click="router.push('/addNotice')"
                />
                <Button
                  :label="'공지글 삭제'"
                  class="button-section"
                  :disabled="isDisabledDelete"
                  @click="deleteRequest()"
                />
                <Button
                  :label="activeChangeOrder ? '공지 순서변경 화면해제' : '공지 순서변경 화면'"
                  class="button-section"
                  @click="isactiveChangeOrder"
                />
              </div>
              <div class="search-input" style="display: flex">
                <IconField style="margin: 10px 10px">
                  <InputIcon class="pi pi-search" />
                  <InputText
                    type="text"
                    v-model="searchText"
                    style="width: 300px"
                    placeholder="검색할 제목을 입력하세요"
                  />
                </IconField>
                <Paginator
                  v-model:first="currentPage"
                  v-model:rows="currentRowsPerPage"
                  :totalRecords="totalRecords"
                  :rowsPerPageOptions="rowsPerPage"
                  @update:rows="onPageChange"
                >
                  <template #start> </template>
                </Paginator>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
<style lang="scss" scoped>
.section {
  margin-bottom: 20px;
}

.pagination-section {
  display: flex;
  width: 100%;
  justify-content: space-between;
  .button-section {
    margin: 10px 6px;
  }
}

.setting-section {
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: 10px;
  }
}

.search-section {
  display: flex;
  align-items: center;
  justify-content: end;

  > *:not(:last-child) {
    margin-right: 10px;
  }
}

.order-btn {
  padding: 0;
}
</style>
<style lang="scss">
.custom-header-class {
  > div {
    justify-content: center;
  }
}
.custom-body-class {
  text-align: center;
  height: 42px;
}
</style>
