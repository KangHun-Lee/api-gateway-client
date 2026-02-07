<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import AppMenuItem from './AppMenuItem.vue'

const authStore = useAuthStore()

const model = ref([
  {
    label: '홈',
    items: [{ label: 'Welcome', icon: 'pi pi-fw pi-home', to: '/' }]
  },
  {
    label: '분석',
    items: []
  },
  {
    label: '권한',
    items: []
  }
])

const menu = computed(() => {
  return model.value.filter((menu) => menu.items && menu.items.length > 0)
})

function addAlayze() {
  model.value[1].items = authStore.screens.reduce((acc, screen) => {
    if (!['/notice', '/dashboard'].includes(screen.url)) {
      const menu =
        screen.url === '/pc-page'
          ? { label: screen.name, to: screen.url, icon: 'pi pi-fw pi-desktop', items: screen.items }
          : { label: screen.name, to: screen.url, icon: 'pi pi-fw pi-desktop' }
      acc.push(menu)
    }

    return acc
  }, [])
}

function addAuth() {
  const found = authStore.roles.some((item) => item.type === 'ADMIN')

  model.value[2].items = found
    ? [{ label: '관리자 설정', icon: 'pi pi-fw pi-user-edit', to: '/setting' }]
    : []
}

function addHome() {
  if (authStore.screens.some((screen) => screen.url === '/dashboard')) {
    model.value[0].items.push({ label: '대시보드', icon: 'pi pi-fw pi-home', to: '/dashboard' })
  }

  if (authStore.screens.some((screen) => screen.url === '/notice')) {
    model.value[0].items.push({ label: 'PMS 공지사항', icon: 'pi pi-fw pi-home', to: '/notice' })
  }
}

watch(
  () => authStore.roles,
  () => {
    addAuth()
  }
)

watch(
  () => authStore.screens,
  () => {
    addAlayze()
    addHome()
  }
)

onMounted(() => addAlayze(), addAuth(), addHome())
</script>

<template>
  <ul class="layout-menu">
    <template v-for="(item, i) in menu" :key="item">
      <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
      <li v-if="item.separator" class="menu-separator"></li>
    </template>
  </ul>
</template>

<style lang="scss" scoped></style>
