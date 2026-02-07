<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'

import { CompetitorPcService } from '@/service/CompetitorService'

import DentwebInstallChart from '@/components/dashboardDetail/DentwebInstallChart.vue'

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

const { errorToast } = useToastHelper()
const { t } = useI18n()

const selectedDateType = 'competitorInstallDatetime'
const selectedProgram = [0, 1, 2]
const targetPgTypes = ['두번에', '하나로', 'OneClick']

const loading = ref(true)

const createCountMap = (pgTypes: string[]) =>
  pgTypes.reduce(
    (acc, pgType) => {
      acc[pgType] = 0
      return acc
    },
    {} as Record<string, number>
  )

const stats = ref(createCountMap(targetPgTypes))
const dateRange = ref<string>('')
const dataEntries = ref<CompetitorData[]>([])

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

  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  saturday.setHours(23, 59, 59, 999)

  return {
    start: formatDate(monday),
    end: formatDate(saturday)
  }
}

async function fetchData(start: string, end: string) {
  loading.value = true
  try {
    return await CompetitorPcService.getCompetitorPcListWithConditon(
      selectedDateType,
      start,
      end,
      selectedProgram,
      undefined,
      undefined
    )
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

function countByPgType(competitorPcs: CompetitorData[], pgTypes: Record<string, number>) {
  competitorPcs.forEach((pc) => {
    if (pc.pgTypeName in pgTypes) {
      pgTypes[pc.pgTypeName]++
    }
  })
}

onMounted(async () => {
  loading.value = true
  const { start: thisStart, end: thisEnd } = getWeekRangeString(0)
  dateRange.value = `${thisStart} ~ ${thisEnd}`

  try {
    dataEntries.value = await fetchData(thisStart, thisEnd)

    countByPgType(dataEntries.value, stats.value)
  } catch (e) {
    errorToast()
  } finally {
    loading.value = false
  }
})
</script>
<template>
  <div v-if="loading" class="area">
    <div class="skeleton_area">
      <Skeleton width="15rem" height="2rem"></Skeleton>
      <Skeleton width="35rem" height="21rem" style="margin-top: 10px"></Skeleton>
    </div>
  </div>
  <div v-else class="area">
    <DentwebInstallChart :stats="stats" :dateRange="dateRange" />
  </div>
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
