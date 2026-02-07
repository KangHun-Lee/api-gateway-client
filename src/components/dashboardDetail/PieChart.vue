<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Chart, registerables, type ChartData, type ChartOptions } from 'chart.js'
import ChartDataLabels, { type Context } from 'chartjs-plugin-datalabels'

interface PerfSpecStat {
  count: number
  ratio: number
}

interface WorkTypeStats {
  total: number
  perfSpecs: Record<string, PerfSpecStat>
}

Chart.register(...registerables, ChartDataLabels)

const props = defineProps<{
  pgType: string
  workType: string
  stat: Record<string, PerfSpecStat>
  total: number
  colorMap: Record<string, string>
  order: string[]
}>()

const statData = computed(() => {
  return Object.entries(props.stat)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({ key, ...value }))
})

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart<'pie'> | null = null

const orderedLabels = (props.order ?? statData.value.map(item => item.key)).filter(order =>
  statData.value.some(item => item.key === order)
)
const orderedData = orderedLabels.map(label =>
  statData.value.find(item => item.key === label)?.count ?? 0
)

const orderedBackgroundColors = orderedLabels.map(label => props.colorMap[label] || '#cccccc')

// ✅ Pie 차트 데이터 구성
const data: ChartData<'pie'> = {
  labels: orderedLabels,
  datasets: [
    {
      data: orderedData,
      backgroundColor: orderedBackgroundColors
    }
  ]
}

// ✅ 옵션 설정
const options: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      bottom: 20,
      top: 0,
      left: 0,
      right: 0
    }
  },
  radius: '75%',
  plugins: {
    title: {
      display: true,
      text: [`${props.pgType}-${props.workType}`, `(PC : ${props.total})`],
      font: {
        size: 15
      },
      padding: {
        top: 10,
        bottom: 40
      }
    },
    tooltip: {
      enabled: true
    },
    legend: {
      position: 'right',
      display: true
    },
    datalabels: {
      backgroundColor: (context) => {
        const bg = context.dataset.backgroundColor
        const index = context.dataIndex

        if (Array.isArray(bg)) {
          return bg[index]
        }

        return bg
      },
      borderRadius: 4,
      padding: 6,
      display: (ctx) => {
        const value = ctx.dataset.data[ctx.dataIndex] as number
        const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0)
        return value / total > 0.05
      },
      formatter: (value: number, ctx) => {
        const label = orderedLabels[ctx.dataIndex]
        const ratio = statData.value[ctx.dataIndex].ratio
        return `${label}\n ${value}건(${ratio}%)`
      },
      color: '#fff',
      anchor: 'end',
      align: 'end',
      offset: 8,
      clip: false,
      font: {
        size: 12
      }
    }
  }
}

// ✅ 차트 생성
onMounted(() => {
  if (chartRef.value) {
    chartInstance = new Chart<'pie'>(chartRef.value, {
      type: 'pie',
      data,
      options
    })
  }
})

// ✅ 언마운트 시 제거
onBeforeUnmount(() => {
  chartInstance?.destroy()
})
</script>
<template>
  <canvas ref="chartRef" />
</template>
<style lang="scss" scoped></style>
