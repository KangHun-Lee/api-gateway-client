<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

Chart.register(...registerables, ChartDataLabels)

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart<'bar'> | null = null

// ✅ 원본 데이터
const rawData = [
  { label: '두번에', contract: 100, nonContrat: 50 },
  { label: '하나로', contract: 200, nonContrat: 100 },
  { label: 'OneClick', contract: 300, nonContrat: 100 }
]

// ✅ 퍼센트로 변환
const labels = rawData.map((row) => {
  const total = row.contract + row.nonContrat
  const percent = (row.contract / total) * 100
  return `${row.label} (${percent.toFixed(1)}%)`
})

const contractData = rawData.map((row) => {
  const total = row.contract + row.nonContrat
  return (row.contract / total) * 100
})

const nonContractData = rawData.map((row) => {
  const total = row.contract + row.nonContrat
  return (row.nonContrat / total) * 100
})

const data: ChartData<'bar'> = {
  labels,
  datasets: [
    {
      label: `총 비계약 건`,
      data: nonContractData,
      backgroundColor: 'rgba(255, 159, 64, 0.5)'
    },
    {
      label: `총 계약 건`,
      data: contractData,
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      datalabels: {
        align: 'center',
        anchor: 'center'
      }
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
      text: '총 계약 현황',
      font: {
        size: 15
      }
    },
    legend: {
      position: 'bottom',
      labels: {
        generateLabels: (chart) => {
          const original = Chart.defaults.plugins.legend.labels.generateLabels(chart)
          return original.reverse() // 그냥 역순 정렬도 가능
        }
      }
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
        const datasetIndex = context.datasetIndex
        const raw = rawData[index]
        if (datasetIndex === 0) return `${raw.contract}건`
        if (datasetIndex === 1) return `${raw.nonContrat}건`
        return ''
      }
    }
  },
  scales: {
    x: {
      stacked: true
    },
    y: {
      stacked: true,
      min: 0,
      max: 100,
      ticks: {
        stepSize: 25,
        callback: (value) => `${value}%`
      }
    }
  }
}

onMounted(() => {
  if (chartRef.value) {
    chartInstance = new Chart<'bar'>(chartRef.value, {
      type: 'bar',
      data,
      options
    })
  }
})

onBeforeUnmount(() => {
  chartInstance?.destroy()
})
</script>

<template>
  <canvas ref="chartRef"></canvas>
</template>
<style lang="scss" scoped></style>
