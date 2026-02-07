<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { DentistryService } from '@/service/DentistryService'
import { useI18n } from 'vue-i18n'
import { useToastHelper } from '@/composables'
import { AxiosError } from 'axios'
import PMSUsageChart from '@/components/dashboardDetail/PMSUsageChart.vue'

interface pmsUsageDataEntry {
  programType: number
  usageCount?: number
}

const { errorToast } = useToastHelper()
const { t } = useI18n()
const loading = ref(true)
const programTypeToString: Record<number, string> = {
  0: '두번에',
  1: '하나로',
  2: 'OneClick',
}
const targetPgTypes = Object.values(programTypeToString)
const createCountMap = (pgTypes: string[]) =>
  Object.fromEntries(pgTypes.map(pg => [pg, 0])) as Record<string, number>

const statsThisWeek = ref(createCountMap(targetPgTypes))
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

async function pmsFetchData() {
  try {
    const dentistryDatas: pmsUsageDataEntry[] =
      await DentistryService.getPmsUsageStatusWithCondition(
        true,
        startDateString.value,
        endDateString.value,
        'none',
        'none'
      )

    for (const entry of dentistryDatas) {
      const pgType = programTypeToString[entry.programType]
      if (pgType) {
        statsThisWeek.value[pgType] = entry.usageCount ?? 0
      }
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.pc.authorization.error'))
      } else {
        errorToast()
      }
    }
    return createCountMap(targetPgTypes)
  }
}


onMounted(async () => {
  loading.value = true

  try {
    await pmsFetchData()
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
      <Skeleton width="65rem" height="21rem" style="margin-top: 10px"></Skeleton>
    </div>
  </div>
  <div v-else class="area">
     <PMSUsageChart :stats-this-week="statsThisWeek" />
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
