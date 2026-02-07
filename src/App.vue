<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const visible = ref(false)
const appVersion = import.meta.env.VITE_APP_VERSION // 현재 앱의 버전 (package.json에서 정의)

const checkVersion = async () => {
  try {
    // version.txt에서 버전 가져오기
    const response = await fetch('/version.txt')
    if (response.ok) {
      const serverVersion = await response.text()

      // 버전 비교
      if (serverVersion.trim() !== appVersion) {
        toast.add({
          severity: 'info',
          summary: 'Update Available',
          detail: '새 버전이 있습니다. 새로고침 해주세요.',
          life: 8000,
          group: 'version'
        })
      }
    } else {
      console.error('Failed to fetch version.txt')
    }
  } catch (error) {
    console.error('Error fetching version.txt:', error)
  }
}

// 앱 로드 시 버전 확인
onMounted(() => {
  checkVersion()
})

const onReload = () => {
  toast.removeGroup('version')
  location.reload()
  visible.value = false
}

const onClose = () => {
  visible.value = false
}
</script>

<template>
  <Toast position="bottom-right" />
  <Toast position="bottom-right" group="version" @close="onClose">
    <template #message="slotProps">
      <div class="toast-layout">
        <div class="toast-title">
          <i class="pi pi-info-circle"></i>
          <span class="font-bold"> 업데이트 알림</span>
        </div>
        <div class="font-medium text-lg my-4">{{ slotProps.message.summary }}</div>
        <Button size="small" label="Reload" severity="info" @click="onReload()"></Button>
      </div>
    </template>
  </Toast>
  <ConfirmDialog></ConfirmDialog>
  <RouterView />
</template>

<style lang="scss" scoped>
.toast-layout {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 1 auto;
}
.toast-layout > * {
  margin-bottom: 5px;
}
.toast-title {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
