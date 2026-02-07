<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
const themeStore = useThemeStore()
const selectedTheme = ref(localStorage.getItem('currentTheme') || 'aura')

function switchTheme(event: any) {
  themeStore.setTheme(event.value)
}

function toggleDarkMode() {
  themeStore.toggleDarkMode()
}
</script>

<template>
  <div>
    <div class="theme-switcher flex gap-2 items-center">
      <Button
        @click="toggleDarkMode"
        :icon="themeStore.darkMode ? 'pi pi-sun' : 'pi pi-moon'"
        class="p-button-rounded p-button-text"
      />

      <Dropdown
        v-model="selectedTheme"
        :options="themeStore.themes"
        optionLabel="name"
        optionValue="value"
        @change="switchTheme"
        class="w-[200px]"
      />
    </div>
  </div>
</template>
