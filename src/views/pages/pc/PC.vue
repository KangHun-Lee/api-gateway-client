<script setup lang="ts">
import { ref } from 'vue'
import PcChart from '@/views/pages/pc/PCChart.vue'
import PcTable from '@/views/pages/pc/PCTable.vue'

// Toggle logic for chart and table view
const isChartView = ref(true)
function toggleView(value: boolean) {
  isChartView.value = value
}
</script>

<template>
  <!-- 차트 및 데이터 테이블 섹션 -->
  <PcChart v-if="isChartView" @toggle-view="toggleView" />
  <PcTable v-else @toggle-view="toggleView" />
</template>

<style lang="scss" scoped>
.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-section {
  margin-bottom: 40px;
}

.data-table-section {
  margin-top: 20px;
}
.toggle-section {
  margin-top: 20px;
}
.search-result-count {
  color: blue;
  margin-right: 20px;
}
.search-program {
  margin-right: 20px;
}
.search-period {
  margin-right: 20px;
}
.search-text-area {
  display: flex;
}
.search-text-area > *:not(:last-child) {
  margin-right: 20px;
}
</style>
