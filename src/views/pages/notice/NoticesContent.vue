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

onMounted(() => {
  fetchData()
})
</script>
<template>
  <div style="width: 100%; min-height: 600px; background-color: white; padding: 10px">
    <div class="content-section" v-html="data?.notices.content" />
  </div>
</template>
