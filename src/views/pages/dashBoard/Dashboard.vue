<script setup lang="ts">
import Contract from '@/components/dashboardDetail/Contract.vue'
import PcServerClientStatistics from './detail/PcServerClientStatistics.vue'
import PMSUsageStatistics from './detail/PMSUsageStatistics.vue'
import DentwebInstallStatistics from './detail/DentwebInstallStatistics.vue'
import TopMenuStatistics from './detail/TopMenuStatistics.vue'
</script>

<template>
  <div>
    <!-- <h1 class="text-2xl font-bold mb-4">Dashboard 준비중입니다.</h1> -->
    <!-- Dashboard Content Here -->
    <div class="dashboard-area">
      <!-- <Panel>
        <div class="panel1">
          <div><Contract /></div>
          <div><Contract /></div>
        </div>
      </Panel> -->
      <Panel>
        <div class="pc_chart_panel">
          <div><PcServerClientStatistics :pg-type="0" /></div>
          <div><PcServerClientStatistics :pg-type="1" /></div>
          <div><PcServerClientStatistics :pg-type="2" /></div>
        </div>
      </Panel>
      <!-- PMS TopMenuStatistics 속도 이슈로 주석, 추후 기능 재검토 -->
      <!-- <Panel>
        <div class="pc_chart_panel">
          <div><TopMenuStatistics :pg-type="0" /></div>
          <div><TopMenuStatistics :pg-type="1" /></div>
          <div><TopMenuStatistics :pg-type="2" /></div>
        </div>
      </Panel> -->
      <Panel>
        <div class="pms_chart_panel">
          <div style="width: 65%"><PMSUsageStatistics /></div>
          <div style="width: 35%"><DentwebInstallStatistics /></div>
        </div>
      </Panel>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.dashboard-area {
  // display: flex;
  // flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 20px;
  & > * {
    margin-bottom: 20px;
  }
}

.panel1 {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
  & > div {
    width: 48%;
    min-height: 300px;
  }
}

.pc_chart_panel {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  & > div {
    flex: 1 1 0;
    min-height: 25rem;
  }
}

.pms_chart_panel {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  & > div {
    min-height: 25rem;
  }
}
</style>
