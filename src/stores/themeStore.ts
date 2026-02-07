import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import Aura from '@primevue/themes/aura'
import Lara from '@primevue/themes/lara'
import Material from '@primevue/themes/material'
import Nora from '@primevue/themes/nora'

export type ThemeMapType = {
  aura: typeof Aura
  lara: typeof Lara
  material: typeof Material
  nora: typeof Nora
}

export const ThemeMap: ThemeMapType = {
  aura: Aura,
  lara: Lara,
  material: Material,
  nora: Nora
}

interface Theme {
  name: string
  value: string
}

export const useThemeStore = defineStore('themeStore', () => {
  const currentTheme = ref(localStorage.getItem('currentTheme') || 'aura')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')

  const themes: Theme[] = [
    { name: 'Aura', value: 'aura' },
    { name: 'Lara', value: 'lara' },
    { name: 'Material', value: 'material' },
    { name: 'Nora', value: 'nora' }
  ]

  function setTheme(themeName: string) {
    currentTheme.value = themeName
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  watch(
    () => currentTheme.value,
    (newTheme) => {
      localStorage.setItem('currentTheme', newTheme)
    }
  )

  watch(
    () => darkMode.value,
    (isDarkMode) => {
      localStorage.setItem('darkMode', isDarkMode.toString())
    }
  )

  return {
    themes,
    currentTheme,
    darkMode,
    setTheme,
    toggleDarkMode
  }
})
