<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useToastHelper, useConfirmHelper } from '@/composables'
import { NoticesService } from '@/service/NoticesService'
import { AxiosError } from 'axios'
import SunEditor from '@/components/SunEditor.vue'

import type { noticesUserInfo } from '@/service/NoticesService'

import Card from 'primevue/card'
import PreviewNotice from './PreviewNotice.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const { successToast, errorToast } = useToastHelper()
const { showConfirmDialog } = useConfirmHelper()

interface notice {
  id: number
  title: string
  selectedCategory: { name: string; code: number }
  content: string
  index: number | undefined
}

interface errorData {
  title?: boolean
  content?: boolean
  dateRange?: boolean
}

const noticesId = Number(route.query.id)

const categories = ref([
  { name: '두번에', code: 0 },
  { name: '하나로', code: 1 },
  { name: 'OneClick', code: 2 }
])
const contentSize = ref([
  { code: 0, width: 500, height: 400 },
  { code: 1, width: 800, height: 600 },
  { code: 2, width: 700, height: 730 }
])

const formData = ref<notice>({
  id: 0,
  title: '',
  selectedCategory: categories.value[2],
  content: '',
  index: undefined
})

const error = ref<errorData>({})

const startDate = ref()
const endDate = ref()

const checkedEmpty = ref(false)
const showDialog = ref<boolean>(false)

watch(
  () => checkedEmpty.value,
  () => {
    startDate.value = null
    endDate.value = null
  }
)

function showPreview() {
  showDialog.value = true
}

function emptyDate() {
  if (
    (!startDate.value || startDate.value.trim().length < 1) &&
    (!endDate.value || endDate.value.trim().length < 1)
  ) {
    return true
  }
  return false
}

async function fetchData() {
  try {
    const result: noticesUserInfo = await NoticesService.getNoticesWithId(noticesId)

    formData.value.id = result.notices.id
    formData.value.index = result.notices.index

    formData.value.title = result.notices.title
    formData.value.content = result.notices.content
    formData.value.selectedCategory = categories.value[result.notices.pgType]

    startDate.value = result.notices.noticeStartDate
      ? new Date(result.notices.noticeStartDate)
      : null
    endDate.value = result.notices.noticeEndDate ? new Date(result.notices.noticeEndDate) : null

    checkedEmpty.value = emptyDate()

    successToast(t('api.notices.info.success'))
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.notices.info.authorization.error'))
      } else {
        errorToast(t('api.notices.info.error'))
      }
    }
  }
}

async function saveRequest() {
  try {
    const result = await showConfirmDialog(
      t('api.notices.modify.save.header'),
      t('api.notices.modify.save.message')
    )

    if (result) {
      const validation = validateNotices()

      if (validation) {
        updateNotices()
      }
    }
  } catch (error) {
    errorToast(t('api.notices.modify.save.error'))
  }
}

async function updateNotices() {
  try {
    await NoticesService.updateNotices(
      formData.value.id,
      formData.value.selectedCategory.code,
      formData.value.title,
      formData.value.content,
      startDateString.value,
      endDateString.value,
      formData.value.index
    )

    successToast(t('api.notices.modify.save.success'))
    router.push('/notice')
  } catch (error) {
    errorToast(t('api.notices.modify.save.error'))
  }
}

function validateNotices() {
  error.value = {}

  if (!formData.value.title || formData.value.title.trim().length < 1) {
    error.value.title = true
  }

  if (!formData.value.content || formData.value.content.trim().length < 1) {
    error.value.content = true
  }

  if (!checkedEmpty.value && (!startDate.value || !endDate.value)) {
    error.value.dateRange = true
  }

  return Object.keys(error.value).length === 0
}

const editorWidth = computed(
  () => contentSize.value[formData.value.selectedCategory.code].width + 'px'
)
const editorHeight = computed(
  () => contentSize.value[formData.value.selectedCategory.code].height + 'px'
)

const startDateString = computed(() =>
  startDate.value
    ? `${startDate.value.getFullYear()}-${String(startDate.value.getMonth() + 1).padStart(2, '0')}-${String(startDate.value.getDate()).padStart(2, '0')}`
    : undefined
)
const endDateString = computed(() =>
  endDate.value
    ? `${endDate.value.getFullYear()}-${String(endDate.value.getMonth() + 1).padStart(2, '0')}-${String(endDate.value.getDate()).padStart(2, '0')}`
    : undefined
)

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <div>
      <Card>
        <template #title>
          <div class="section">
            <strong>{{ t('view.notices.title.modify') }}</strong>
          </div>
        </template>
        <template #content>
          <div class="section input-section">
            <div class="input-field width-2">
              <label for="category" class="label">{{
                t('view.notices.label.detail.category')
              }}</label>
              <Select
                v-model="formData.selectedCategory"
                :options="categories"
                optionLabel="name"
                placeholder="Catetory"
                size="large"
              />
            </div>

            <div class="input-field">
              <label for="width" class="label">Content Width</label>
              <InputText
                id="width"
                v-model="editorWidth"
                aria-describedby="width"
                disabled
                size="large"
              />
            </div>
            <div class="input-field">
              <label for="height" class="label">Content height</label>
              <InputText
                id="height"
                v-model="editorHeight"
                aria-describedby="height"
                disabled
                size="large"
              />
            </div>
            <div class="input-field width-2">
              <label for="height" class="label">
                {{ t('view.notices.label.detail.noticeStartDate') }}
              </label>
              <DatePicker
                v-model="startDate"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                input-class="p-inputtext-sm"
                :disabled="checkedEmpty"
                size="large"
                :invalid="!!error.dateRange && !startDate"
              />
            </div>
            <div class="input-field width-2">
              <label for="height" class="label">
                {{ t('view.notices.label.detail.noticeEndDate') }}
              </label>
              <DatePicker
                v-model="endDate"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                input-class="p-inputtext-sm"
                :disabled="checkedEmpty"
                size="large"
                :invalid="!!error.dateRange && !endDate"
              />
            </div>
            <div class="checkbox-field">
              <Checkbox v-model="checkedEmpty" binary />
              <label for="height" class="label">
                {{ t('view.notices.label.detail.dateEmpty') }}</label
              >
            </div>
          </div>
          <div class="section">
            <div class="input-field full">
              <label for="width" class="label">
                {{ t('view.common.title') }}
              </label>
              <InputText
                name="Title"
                type="text"
                :placeholder="t('view.notices.label.detail.titlePlaceholder')"
                size="large"
                v-model="formData.title"
                :invalid="!!error.title"
              />
            </div>
          </div>
          <div class="section">
            <div class="input-field" style="width: 98%">
              <label for="width" class="label">
                {{ t('view.notices.label.detail.content') }}
              </label>
              <Message
                v-if="!!error.content"
                size="small"
                severity="error"
                variant="simple"
                style="margin-bottom: 10px"
              >
                공지사항 내용을 입력해주세요.</Message
              >
              <!-- <Editor
                v-model="formData.content"
                editorStyle="height: 500px"
                :invalid="!!error.content"
              />
               -->

              <SunEditor v-model="formData.content" />
            </div>
          </div>
          <!-- <div class="section full">
            <div class="input-field full">
              <label for="width" class="label"> {{ t('view.common.fileUpload') }}</label>
              <FileUpload
                name="demo[]"
                url="/api/upload"
                accept="image/*"
                :maxFileSize="1000000"
                :multiple="true"
                @upload="onAdvancedUpload"
              >
                <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
                  <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
                    <div class="flex gap-2">
                      <Button @click="chooseCallback()">{{
                        t('view.notices.label.detail.chooseFile')
                      }}</Button>
                    </div>
                  </div>
                </template>
              </FileUpload>
            </div>
          </div> -->
          <div class="button-section">
            <Button
              :label="t('view.notices.label.detail.list')"
              variant="outlined"
              @click="router.push('/notice')"
            />
            <Button
              :label="t('view.notices.label.detail.preview')"
              variant="outlined"
              @click="showPreview()"
            />
            <Button :label="t('view.notices.label.detail.modifySave')" @click="saveRequest()" />
          </div>
        </template>
      </Card>
    </div>
  </div>

  <PreviewNotice
    v-if="showDialog"
    v-model:visible="showDialog"
    :content="formData.content"
    :width="contentSize[formData.selectedCategory.code].width"
    :height="contentSize[formData.selectedCategory.code].height"
  />
</template>
<style lang="scss" scoped>
.section {
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: start;
  .label {
    display: block;
    margin-bottom: 10px;
    font-weight: bold;
  }
  > *:not(:last-child) {
    margin-right: 10px;
  }
  .input-field {
    display: flex;
    flex-direction: column;
  }
}

.full {
  width: 100%;
}

.width-2 {
  width: 20%;
}

.button-section {
  display: flex;
  align-items: center;
  justify-content: center;
  > *:not(:last-child) {
    margin-right: 10px;
  }
}

.checkbox-field {
  display: flex;
  align-items: center;
  margin-top: 27px;
  .label {
    display: block;
    margin-left: 10px;
    margin-top: 9px;
    font-weight: normal;
  }
}
</style>
