<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

import { computed } from 'vue'

const authStore = useAuthStore()

const user = computed(() => authStore.user)
</script>

<template>
  <div class="flex justify-content-center align-items-center h-screen px-4 surface-ground">
    <Card class="welcome-card text-center">
      <template #content>
        <h1 class="welcome-title">{{ user?.name }} 님 , 안녕하세요 👋</h1>
        <p class="welcome-subtitle">오스템임플란트 Gateway 서비스에 오신 것을 환영해요</p>
      </template>
    </Card>
  </div>
</template>
<style scoped>
.welcome-card {
  width: 100%;
  padding: 60px 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, #c2fbd7, #a0eac7);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  color: #1b4332;
  font-family: 'Pretendard', sans-serif;
  animation: fadeIn 0.8s ease-in-out;
}

.welcome-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.welcome-subtitle {
  font-size: 1.125rem;
  color: #2d6a4f;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
