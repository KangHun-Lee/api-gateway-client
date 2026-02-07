<script setup lang="ts">
import { computed, ref, onMounted, watch, defineEmits } from 'vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { AccessScreenService } from '@/service/AccessScreenService'
import type { RoleScreenAccessData } from '@/service/AccessScreenService'
import { useToastHelper, useConfirmHelper } from '@/composables'
import { AxiosError } from 'axios'

const { t } = useI18n()
const { successToast, errorToast } = useToastHelper()
const { showConfirmDialog } = useConfirmHelper()

const emit = defineEmits<{
  (event: 'save'): void
}>()

interface group {
  label: string
  value: number
}

interface screen {
  id: number
  name: string
}

const selectedGroup = ref<number>()
const selectedScreens = ref<number[]>([])
const screens = ref<screen[]>([
  { id: 1, name: '설치정보' },
  { id: 2, name: '오류로그' },
  { id: 3, name: '사용정보' },
  { id: 4, name: '경쟁제품 설치현황' },
  { id: 5, name: '치과 현황' },
  { id: 6, name: '공지사항' },
  { id: 11, name: '대시보드' }
])

const roleScreenAccessHistory = ref<number[]>([])

async function fetchScreens() {
  try {
    if (selectedGroup.value) {
      const data = await AccessScreenService.getScreensWithRole(selectedGroup.value)
      selectedScreens.value = data.map((item: RoleScreenAccessData) => item.screenId)
      roleScreenAccessHistory.value = data.map((item: RoleScreenAccessData) => item.screenId)
      successToast(t('api.AccessScreen.get.success'))
    }
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      if (e.status === 401) {
        errorToast(t('api.AccessScreen.get.authorization.error'))
      } else {
        errorToast(t('api.AccessScreen.get.error'))
      }
    }
  }
}

function cancelChangeRoleScreenAccess() {
  selectedScreens.value = roleScreenAccessHistory.value
}

async function changeRoleAccessConfirm() {
  try {
    const result = await showConfirmDialog(
      '그룹별 권한 초기 설정 저장',
      '변경 내용을 저장하시겠습니까?'
    )
    if (result && selectedGroup.value) {
      await AccessScreenService.saveRoleScreenAccess(selectedGroup.value, selectedScreens.value)
      emit('save')

      successToast(t('api.AccessScreen.save.success'))
    } else {
      cancelChangeRoleScreenAccess()
    }
  } catch (error) {
    errorToast(t('api.AccessScreen.save.error'))
  }
}

const isDisableRole = computed(() => !selectedGroup.value)

onMounted(() => {})

watch(
  () => selectedGroup.value,
  () => {
    fetchScreens()
  }
)

defineProps({
  groups: {
    type: Array as PropType<group[]>, // group 타입의 배열로 정의
    required: true
  }
})
</script>

<template>
  <div>
    <!-- 그룹별 권한 초기 설정 -->
    <div class="section setting-section">
      <FloatLabel variant="on">
        <Select
          v-model="selectedGroup"
          :options="groups"
          optionLabel="label"
          optionValue="value"
          input-class="p-inputtext-sm"
          style="width: 9vw"
          size="large"
        />
        <label>{{ t('view.searchArea.selectGroup') }}</label>
      </FloatLabel>
      <div
        v-for="screen in screens"
        :key="screen.id"
        class="flex flex-wrap justify-center checkbox"
      >
        <div class="flex items-center gap-4">
          <Checkbox
            v-model="selectedScreens"
            :inputId="screen.name"
            :value="screen.id"
            :disabled="isDisableRole"
          />
          <label :for="screen.name" style="margin-left: 2px"> {{ screen.name }} </label>
        </div>
      </div>
    </div>
    <div class="footer-section">
      <Button
        :label="t('view.common.cancel')"
        variant="outlined"
        @click="cancelChangeRoleScreenAccess"
        :disabled="isDisableRole"
      />
      <Button
        :label="t('view.common.save')"
        @click="changeRoleAccessConfirm"
        :disabled="isDisableRole"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section {
  margin-top: 10px;
  margin-bottom: 20px;
}

.setting-section {
  display: flex;
  align-items: center;

  > *:not(:last-child) {
    margin-right: 10px;
  }
}

.footer-section {
  display: flex;
  align-items: center;
  justify-content: end;

  > *:not(:last-child) {
    margin-right: 10px;
  }
}
</style>
