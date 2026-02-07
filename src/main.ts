import '@/assets/styles.scss'
import '@/assets/tailwind.css'

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { default as VueGtag, trackRouter } from 'vue-gtag-next'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import { i18n } from '@/locales'
import { primevue_ko } from '@/locales/primevue_ko'

import { useThemeStore, ThemeMap } from '@/stores/themeStore'
import type { ThemeMapType } from '@/stores/themeStore'
import type { App as VueApp } from 'vue'

const app: VueApp = createApp(App)
const VueGtagTrackRouterPlugin = {
  install(app: VueApp) {
    const router = app.config.globalProperties.$router
    const options = {}

    trackRouter(router, options)
  }
}

const { MODE, VITE_APP_GA_ID } = import.meta.env
const pinia = createPinia()

app.use(pinia)

const themeStore = useThemeStore(pinia)

app.use(PrimeVue, {
  theme: {
    preset: ThemeMap[themeStore.currentTheme as keyof ThemeMapType],
    options: {
      darkModeSelector: themeStore.darkMode ? '.my-app-dark' : '.my-app',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities'
      }
    }
  },
  locale: primevue_ko
})

watch(
  () => [themeStore.currentTheme, themeStore.darkMode],
  ([newTheme, isDarkMode]) => {
    app.config.globalProperties.$primevue.config.theme = {
      preset: ThemeMap[newTheme as keyof ThemeMapType],
      options: {
        darkModeSelector: isDarkMode ? '.my-app-dark' : '.my-app',
        cssLayer: {
          name: 'primevue',
          order: 'tailwind-base, primevue, tailwind-utilities'
        }
      }
    }
    document.documentElement.classList.toggle('my-app-dark', !!isDarkMode)
  },
  { immediate: true }
)

app.use(router)
app.use(ToastService)
app.use(ConfirmationService)
app.use(VueGtag, {
  property: {
    id: VITE_APP_GA_ID,
    params: {
      send_page_view: false
    }
  }
})
app.use(VueGtagTrackRouterPlugin)
app.use(i18n)
app.mount('#app')
