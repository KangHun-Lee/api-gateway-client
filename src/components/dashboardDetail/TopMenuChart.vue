<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { Chart, registerables, type ChartData, type ChartOptions } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

interface accessLogStat {
  count: number
  ratio: number
}
type accessLogStatResult = Record<string, accessLogStat>

const props = defineProps<{
  pgType: number
  stat: Record<string, accessLogStat>
}>()

const top3 = computed(() => {
  return Object.entries(props.stat)
    .sort(([, now], [, next]) => next.count - now.count)
    .slice(0, 3)
    .map(([key, value]) => ({ key, ...value }))
})
Chart.register(...registerables, ChartDataLabels)
const chartRef = ref<HTMLCanvasElement | null>(null)

const programs = [
  { label: '두번에', value: 0 },
  { label: '하나로', value: 1 },
  { label: 'OneClick', value: 2 },
  { label: 'OneCodi', value: 3 },
  { label: 'OneMessenger', value: 4 }
]
const selectedPgType = computed(() => programs.find((item) => item.value === props.pgType)?.label)

const data: ChartData<'bar'> = {
  labels: top3.value.length != 0 ? top3.value.map((data) => data.key) : ['없음'],
  datasets: [
    {
      label: `사용수 및 평균 로딩 속도`,
      data: top3.value.map((data) => data.count),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      barThickness: 40,
      borderRadius: {
        topRight: 10,
        bottomRight: 10
      }
    }
  ]
}

// 누적 옵션 설정
const options: ChartOptions<'bar'> = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: `${selectedPgType.value} 주간 Top 메뉴`,
      font: {
        size: 15
      }
    },
    legend: {
      position: 'bottom'
    },
    tooltip: {
      enabled: false // 👈 툴팁 꺼짐!
    },
    datalabels: {
      color: 'black',
      anchor: 'center',
      align: 'center',
      font: {
        size: 12,
        weight: 'bold'
      },
      formatter: (value, context) => {
        const index = context.dataIndex
        const ratio = top3.value[context.dataIndex].ratio
        return `${value}회, ${ratio}m/s`
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      min: 0,
      ticks: {
        stepSize: 1000,
        callback: (value: number): string => {
          if (value === 0) return '0'
          return `${value / 1000}K`
        }
      }
    }
  }
}

onMounted(() => {
  if (chartRef.value) {
    new Chart(chartRef.value, {
      type: 'bar',
      data,
      options
    })
  }
})
</script>
<template>
  <canvas ref="chartRef" style="width: 100%; height: 100%" />
</template>
