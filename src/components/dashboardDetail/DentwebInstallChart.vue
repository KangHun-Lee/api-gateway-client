<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Chart, registerables, type ChartData, type ChartOptions } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

const props = defineProps<{
  stats: Record<string, number>
  dateRange: string
}>()

Chart.register(...registerables, ChartDataLabels)
const chartRef = ref<HTMLCanvasElement | null>(null)

const pgTypes = ['두번에', '하나로', 'OneClick']

const data: ChartData<'bar'> = {
  labels: pgTypes,
  datasets: [
    {
      label: `주간 덴트웝 설치 수`,
      data: pgTypes.map((pgType) => props.stats[pgType] ?? 0),
      backgroundColor: 'rgba(255, 159, 64, 0.5)'
    }
  ]
}

// 누적 옵션 설정
const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: ['주간 덴트웹 설치수', `(${props.dateRange})`],
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
      formatter: (value) => `${value}대`
    }
  },
  scales: {
    x: {
      stacked: true
    },
    y: {
      stacked: true,
      min: 0,
      max: 20,
      ticks: {
        stepSize: 5
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
  <canvas ref="chartRef" />
</template>
