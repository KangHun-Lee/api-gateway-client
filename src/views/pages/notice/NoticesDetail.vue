<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { useI18n } from 'vue-i18n'
import { AxiosError } from 'axios'
import { useToastHelper } from '@/composables'
import type { noticesUserInfo } from '@/service/NoticesService'
import { NoticesService } from '@/service/NoticesService'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { successToast, errorToast } = useToastHelper()

const noticesId = Number(route.query.id)

const data = ref<noticesUserInfo>()

async function fetchData() {
  try {
    const result = await NoticesService.getNoticesWithId(noticesId)

    data.value = result

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

function convertDate(dateTime: string) {
  const date = dateTime.split('T')[0]

  return date
}

const contentSize = ref([
  { code: 0, width: 500, height: 400 },
  { code: 1, width: 800, height: 600 },
  { code: 2, width: 700, height: 730 }
])

const openPopup = () => {
  const pgType = data.value ? data.value.notices.pgType : 0
  const width = contentSize.value[pgType].width
  const height = contentSize.value[pgType].height
  const left = window.screenX + (window.innerWidth - width) / 2
  const top = window.screenY + (window.innerHeight - height) / 2

  const origin = window.location.origin

  const popup = window.open(
    `${origin}/api/internal-api/v1/notices/view/${noticesId}`,
    'popupWindow',
    `width=${width},height=${height},top=${top},left=${left}`
  )

  if (!popup) {
    alert('팝업 차단이 활성화되어 있습니다.')
  }
}

onMounted(() => {
  fetchData()
})
</script>
<template>
  <div>
    <div>
      <Card>
        <template #content>
          <div class="button-section">
            <Button
              :label="t('view.notices.label.detail.list')"
              variant="outlined"
              @click="router.push('/notice')"
            />
            <Button
              :label="t('view.notices.label.detail.preview')"
              variant="outlined"
              @click="openPopup"
            />
            <Button
              :label="t('view.notices.label.detail.modify')"
              @click="router.push({ name: 'modifyNotice', query: { id: noticesId } })"
            />
          </div>
          <div class="title-section">
            <p class="title">{{ data?.notices.title }}</p>
            <p class="date">
              <span>{{ t('view.notices.label.detail.user') }} : {{ data?.user.name }}</span>
              <span
                >{{ t('view.notices.label.detail.saveDateTime') }} :
                {{ data ? convertDate(data?.notices.saveDateTime) : '' }}</span
              >
              <span
                >{{ t('view.notices.label.detail.noticeStartDate') }} :
                {{ data?.notices.noticeStartDate ? data?.notices.noticeStartDate : '미지정' }}</span
              >
              <span
                >{{ t('view.notices.label.detail.noticeEndDate') }} :
                {{ data?.notices.noticeEndDate ? data?.notices.noticeEndDate : '미지정' }}</span
              >
            </p>
          </div>
          <div class="content-section" v-html="data?.notices.content" />
        </template>
      </Card>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.button-section {
  display: flex;
  align-items: center;
  justify-content: start;
  > *:not(:last-child) {
    margin-right: 10px;
  }
}
.title-section {
  margin: 20px 0;
  padding: 17px 0;
  border-top: 1px solid #d2d7dd;
  border-bottom: 1px solid #d2d7dd;
  .title {
    font-size: 25px;
    font-weight: bold;
  }
  .date {
    font-size: 15px;
    font-weight: 500;
    color: gray;

    > span:not(:last-child)::after {
      content: ' | ';
    }
  }
}
.content-section {
  min-height: 600px;
  max-width: 100%;
  overflow: auto;
}
</style>
