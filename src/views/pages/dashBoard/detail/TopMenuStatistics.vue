<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { AccessLogService } from '@/service/AccessLogService'
import type { AccessLogData } from '@/service/AccessLogService'

import { useI18n } from 'vue-i18n'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'

import TopMenuChart from '@/components/dashboardDetail/TopMenuChart.vue'

interface accessLogStat {
  count: number
  ratio: number
}

type accessLogStatResult = Record<string, accessLogStat>

const props = defineProps<{
  pgType: number
}>()

const loading = ref(true)
const stat = ref<accessLogStatResult>()

const { errorToast } = useToastHelper()
const { t } = useI18n()

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10) // yyyy-MM-dd
}

function getWeekRangeString(offset: number = 0): { start: string; end: string } {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  }
}

async function fetchData(start: string, end: string) {
  loading.value = true
  try {
    const accessLogdata = await AccessLogService.getAccessLogsWithCondition(
      false, //테스트 제외
      start,
      end,
      0, //event = 기본
      props.pgType,
      undefined,
      undefined
    )

    if (accessLogdata) {
      const filterdata = groupAndCountStat(accessLogdata)
      stat.value = calculateRatio(filterdata)
      console.log(stat.value)
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.accessLog.authorization.error'))
      } else {
        errorToast()
      }
    }
    loading.value = false
  }
  loading.value = false
}

//통계데이터 초기화
function groupAndCountStat(data: AccessLogData[]): accessLogStatResult {
  const result: accessLogStatResult = {}

  for (const { rootMenu, loadingSpeed } of data) {
    if (!result[rootMenu]) {
      result[rootMenu] = { count: 0, ratio: 0 }
    }
    result[rootMenu].count += 1
    result[rootMenu].ratio +=
      loadingSpeed != null && !isNaN(Number(loadingSpeed)) ? Number(loadingSpeed) : 0
  }

  return result
}

function calculateRatio(accessLogStat: accessLogStatResult) {
  for (const rootMenu in accessLogStat) {
    const count = accessLogStat[rootMenu].count
    const ratio = parseFloat(((accessLogStat[rootMenu].ratio / count) * 100).toFixed(1))
    accessLogStat[rootMenu] = { count, ratio }
  }

  return accessLogStat
}

onMounted(() => {
  const { start, end } = getWeekRangeString(0)
  fetchData(start, end)
})
</script>
<template>
  <div v-if="loading" class="area">
    <div class="skeleton_area">
      <Skeleton width="15rem" height="2rem"></Skeleton>
      <Skeleton width="35rem" height="21rem" style="margin-top: 10px"></Skeleton>
    </div>
  </div>
  <!-- <div v-else-if="Object.keys(stat ?? {}).length === 0">데이터가 존재하지 않습니다</div> -->
  <div v-else class="area"><TopMenuChart :stat="stat ?? {}" :pg-type="props.pgType" /></div>
</template>
<style lang="scss" scoped>
.area {
  width: 100%;
  height: 100%;
}

.skeleton_area {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
