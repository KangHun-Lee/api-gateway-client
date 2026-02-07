<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Chart, registerables, type ChartData, type ChartOptions } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

const props = defineProps<{
  statsThisWeek: Record<string, number>
}>()

Chart.register(...registerables, ChartDataLabels)
const chartRef = ref<HTMLCanvasElement | null>(null)

const pgTypes = ['두번에', '하나로', 'OneClick']

const data = {
  labels: pgTypes,
  datasets: [
    {
      label: '전체',
      data: pgTypes.map((pgType) => props.statsThisWeek[pgType] ?? 0),
      backgroundColor: '#FFAA28',
      borderColor: '#FFAA28',
      borderWidth: 1,
      barPercentage: 0.7,
      borderRadius: {
        topRight: 10,
        bottomRight: 10
      }
    }
  ]
}

function getSmartInsideRight(ctx: any, threshold = 0.85) {
  const value = ctx.dataset.data[ctx.dataIndex]
  const scale = ctx.chart.scales['x']
  const max = scale.max as number
  const ratio = value / max

  const isLarge = ratio > threshold

  return {
    anchor: isLarge ? 'start' : 'end',
    align: isLarge ? 'right' : 'right',
    offset: isLarge ? -60 : 0,
    color: isLarge ? '#fff' : '#000'
  }
}

const options: ChartOptions<'bar'> = {
  indexAxis: 'y' as const,
  layout: {
    padding: {
      right: 60
    }
  },
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const
    },
    title: {
      display: true,
      text: '현재 PMS 사용현황',
      font: {
        size: 15
      }
    },
    datalabels: {
      anchor: 'end',
      align: 'right',
      offset: (ctx) => getSmartInsideRight(ctx).offset,
      color: (ctx) => getSmartInsideRight(ctx).color,
      clamp: true,
      clip: false,
      font: {
        weight: 'bold'
      },
      formatter: (value: number) => {
        return `${value}개`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      min: 0,
      max: 11000,
      ticks: {
        stepSize: 1000,
        callback: (value: number) => {
          if (value === 0) return '0'
          return `${value / 1000}K`
        }
      }
    }
  }
}

onMounted(async () => {
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
