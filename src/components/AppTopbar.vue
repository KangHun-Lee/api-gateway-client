<script setup>
import { useLayout } from '@/composables/layout'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { useToastHelper } from '@/composables'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t } = useI18n()
const { onMenuToggle } = useLayout()
const authStore = useAuthStore()
const router = useRouter()
const { successToast, errorToast } = useToastHelper()

async function logout() {
  try {
    const response = await axios.post('/api/auth/v1/logout')

    if (response.status === 200) {
      authStore.logout()
      successToast(t('api.auth.logout.success'))
      router.push('/login')
    }
  } catch (error) {
    errorToast(t('api.auth.logout.error'))
  }
}

function goToAdmin() {
  router.push('/setting')
}

const user = computed(() => authStore.user)
const auth = computed(() => authStore.roles)
const checkAdmin = computed(() => authStore.roles.some((item) => item.type === 'ADMIN'))
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <button
        class="layout-menu-button layout-topbar-action"
        style="border: 0px solid"
        @click="onMenuToggle"
      >
        <i class="pi pi-bars"></i>
      </button>
      <router-link to="/" class="layout-topbar-logo">
        <img src="/logo.png" />
        <span>Gateway</span>
      </router-link>
    </div>
    <div style="position: absolute; right: 10rem">
      <div style="display: flex; align-items: center; gap: 1rem">
        <ThemeSwitcher />
        <span style="font-weight: bold; font-size: 14px"
          >{{ auth[0]?.type }} | {{ user?.employeeNo }} | {{ user?.departmentName }} |
          {{ user?.positionName }} |
          {{ user?.name }}
        </span>
        <Button
          icon="pi pi-cog"
          variant="text"
          rounded
          aria-label="Filter"
          v-if="checkAdmin"
          @click="goToAdmin()"
        />
      </div>
    </div>
    <div style="position: absolute; right: 2rem">
      <Button type="button" icon="pi pi-sign-out" label="로그아웃" outlined @click="logout()" />
    </div>
  </div>
</template>
