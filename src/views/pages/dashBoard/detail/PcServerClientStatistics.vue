<script setup lang="ts">
import PieChart from '@/components/dashboardDetail/PieChart.vue'
import { ref, onMounted } from 'vue'
import { PcService } from '@/service/PcService'
import type { DataEntry } from '@/service/PcService'

import { useI18n } from 'vue-i18n'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'

const props = defineProps<{
  pgType: number
}>()

interface PerfSpecStat {
  count: number
  ratio: number
}

interface WorkTypeStats {
  total: number
  perfSpecs: Record<string, PerfSpecStat>
}

type PcStatsResult = Record<string, WorkTypeStats>

const colorMap: Record<string, string> = {
  미지정: '#555555',
  저사양: '#d32f2f',
  최소사양: '#f57c00',
  권장사양: '#388e3c',
  고사양: '#1976d2'
}
const perfSpecNameOrder = ['미지정', '저사양', '최소사양', '권장사양', '고사양']

const { errorToast } = useToastHelper()
const { t } = useI18n()

const programs = [
  { label: '두번에', value: 0 },
  { label: '하나로', value: 1 },
  { label: 'OneClick', value: 2 },
  { label: 'OneCodi', value: 3 },
  { label: 'OneMessenger', value: 4 }
]
const checkedExcludeTest = ref<boolean>(true)
const lastDay = ref<number>(90)
const stats = ref<PcStatsResult>()

async function fetchDentalPcData() {
  try {
    const pcs = await PcService.getPcsWithCondition(
      checkedExcludeTest.value,
      props.pgType,
      'none',
      ''
    )
    if (pcs) {
      stats.value = calculateDynamicStats(pcs)
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.pc.authorization.error'))
      } else {
        errorToast()
      }
    }
  }
}

//pgType별 통계데이터 초기화
function groupAndCountStats(data: DataEntry[]): PcStatsResult {
  const stats: PcStatsResult = {}

  for (const { workTypeName, perfSpecName } of data) {
    if (!stats[workTypeName]) {
      stats[workTypeName] = { total: 0, perfSpecs: {} }
    }

    if (!stats[workTypeName].perfSpecs[perfSpecName]) {
      stats[workTypeName].perfSpecs[perfSpecName] = { count: 0, ratio: 0 }
    }

    stats[workTypeName].perfSpecs[perfSpecName].count += 1
    stats[workTypeName].total += 1
  }

  return stats
}

function calculateRatios(pcStats: PcStatsResult): PcStatsResult {
  const result: PcStatsResult = {}

  for (const workType in pcStats) {
    const { total, perfSpecs } = pcStats[workType]
    const perfSpecStats: Record<string, PerfSpecStat> = {}

    for (const spec of perfSpecNameOrder) {
      perfSpecStats[`${spec}`] = { count: 0, ratio: 0 };
    }

    for (const perfSpec in perfSpecs) {
      const count = perfSpecs[perfSpec].count
      const ratio = total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0
      perfSpecStats[perfSpec] = { count, ratio }
    }

    result[workType] = { total, perfSpecs: perfSpecStats }
  }
  return result
}

function calculateDynamicStats(data: DataEntry[]): PcStatsResult {
  const counts = groupAndCountStats(data)
  return calculateRatios(counts)
}

onMounted(() => {
  fetchDentalPcData()
})
</script>
<template>
  <div v-if="!stats">
    <div v-for="item in 2" :key="item" class="skeleton_area">
      <div class="chart_skeleton">
        <Skeleton width="8rem" height="1.5rem"></Skeleton>
        <Skeleton width="8rem" height="1.5rem"></Skeleton>
        <Skeleton width="20rem" height="14.4rem" style="margin-top: 20px"></Skeleton>
      </div>
      <div class="legend_skeleton">
        <Skeleton width="8rem" height="9rem"></Skeleton>
      </div>
    </div>
  </div>
  <div v-else>
    <div v-for="(workTypeStats, workType) in stats" :key="workType">
      <PieChart
        :pg-type="programs[props.pgType].label"
        :work-type="workType"
        :total="workTypeStats.total"
        :color-map="colorMap"
        :stat="workTypeStats.perfSpecs"
        :order="perfSpecNameOrder"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.skeleton_area {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  .chart_skeleton {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 70%;

    & > div {
      display: block;
      margin-bottom: 10px;
      align-items: end;
    }
  }

  .legend_skeleton {
    width: 30%;
    & > div {
      margin-top: 3rem;
    }
  }
}
</style>
