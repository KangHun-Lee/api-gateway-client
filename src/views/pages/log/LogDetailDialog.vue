<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({
  visible: Boolean,
  type: String,
  log: Object,
  pc: Object
})

const emit = defineEmits(['update:visible'])

const internalVisible = ref(props.visible)

watch(
  () => props.visible,
  (newVal) => {
    internalVisible.value = newVal
  }
)

function closeDialog() {
  internalVisible.value = false
  emit('update:visible', false)
}

watch(internalVisible, (newVal) => {
  emit('update:visible', newVal)
})

const formattedDate = computed(() => {
  if (!props.log?.workDatetime) return ''
  const date = new Date(props.log.workDatetime)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }
  return date.toLocaleString('ko-KR', options)
})
</script>

<template>
  <Dialog
    v-if="visible"
    v-model:visible="internalVisible"
    :header="t('view.common.detailInfomation')"
    :style="{ width: '50rem', maxHeight: '80vh' }"
    :breakpoints="{ '1199px': '70vw', '575px': '90vw' }"
  >
    <div class="inline-element">
      <Fieldset style="display: inline-block" :legend="t('view.log.hospitalName')">
        <p class="m-0 content-limited">
          {{ log?.hospitalName }}
        </p>
      </Fieldset>
      <Fieldset style="display: inline-block" :legend="t('view.log.ip')">
        <p class="m-0 content-limited">
          {{ log?.ip }}
        </p>
      </Fieldset>
      <Fieldset style="display: inline-block" :legend="t('view.log.macAddress')">
        <p class="m-0 content-limited">
          {{ log?.macAddress }}
        </p>
      </Fieldset>
      <Fieldset style="display: inline-block" :legend="t('view.log.pcName')">
        <p class="m-0 content-limited">{{ log?.pcName }}</p>
      </Fieldset>
    </div>
    <Fieldset :legend="t('view.log.workDatetime')">
      <p class="m-0 content-limited">{{ formattedDate }}</p>
    </Fieldset>
    <div class="inline-element">
      <Fieldset :legend="t('view.log.programType')">
        <p class="m-0 content-limited">
          {{ log?.programType }}
        </p>
      </Fieldset>
      <Fieldset :legend="t('view.log.version')">
        <p class="m-0 content-limited">
          {{ log?.version }}
        </p>
      </Fieldset>
      <Fieldset :legend="t('view.log.rootMenu')">
        <p class="m-0 content-limited">
          {{ log?.rootMenu }}
        </p>
      </Fieldset>
    </div>
    <div class="inline-element">
      <Fieldset :legend="t('view.log.viewId')">
        <p class="m-0 content-limited">
          {{ log?.viewId }}
        </p>
      </Fieldset>
      <Fieldset :legend="t('view.log.viewName')">
        <p class="m-0 content-limited">
          {{ log?.viewName }}
        </p>
      </Fieldset>
    </div>

    <div v-if="type === '오류 로그'">
      <Fieldset :legend="t('view.log.errorCode')">
        <p class="m-0 content-limited-300">
          {{ log?.errorCode }}
        </p>
      </Fieldset>
      <Fieldset :legend="t('view.log.log')">
        <p class="m-0 content-limited-300">
          {{ log?.log }}
        </p>
      </Fieldset>
      <Fieldset :legend="t('view.log.logDetail')" v-if="log?.logDetail" style="">
        <p class="m-0 content-limited-500">
          {{ log?.logDetail }}
        </p>
      </Fieldset>
      <Fieldset :legend="t('view.log.etc')" v-if="log?.etc">
        <p class="m-0 content-limited">
          {{ log?.etc }}
        </p>
      </Fieldset>
    </div>

    <div v-else-if="type === '사용 정보'">
      <div class="inline-element">
        <Fieldset :legend="t('view.accessLog.functionName')">
          <p class="m-0 content-limited">
            {{ log?.functionName }}
          </p>
        </Fieldset>
        <Fieldset :legend="t('view.accessLog.elementName')">
          <p class="m-0 content-limited">
            {{ log?.elementName }}
          </p>
        </Fieldset>
        <Fieldset :legend="t('view.accessLog.action')">
          <p class="m-0 content-limited">
            {{ log?.action }}
          </p>
        </Fieldset>
        <Fieldset :legend="t('view.accessLog.loadingSpeed')">
          <p class="m-0 content-limited">
            {{ log?.loadingSpeed ? (log.loadingSpeed / 1000).toFixed(2) : '-'  }}
          </p>
        </Fieldset>
      </div>
      <div>
        <Fieldset :legend="t('view.accessLog.description')">
          <p class="m-0 content-limited">
            {{ log?.description }}
          </p>
        </Fieldset>
      </div>
    </div>

    <div v-if="pc">
      <div style="display: flex; justify-content: flex-start">
        <Fieldset style="display: inline-block; margin-right: 1rem" :legend="t('view.log.cpu')">
          <p class="m-0 content-limited">
            {{ pc?.cpu }}
          </p>
        </Fieldset>
        <Fieldset style="display: inline-block; margin-right: 1rem" :legend="t('view.log.memory')">
          <p class="m-0 content-limited">
            {{ pc?.memory }}
          </p>
        </Fieldset>
      </div>
      <div style="display: flex; justify-content: flex-start">
        <Fieldset style="display: inline-block; margin-right: 1rem" :legend="t('view.log.gpu')">
          <p class="m-0 content-limited">{{ pc?.gpu }}</p>
        </Fieldset>
        <Fieldset style="display: inline-block; margin-right: 1rem" :legend="t('view.log.os')">
          <p class="m-0 content-limited">{{ pc?.os }}</p>
        </Fieldset>
        <Fieldset
          style="display: inline-block; margin-right: 1rem"
          :legend="t('view.log.perfSpecName')"
        >
          <p class="m-0 content-limited">{{ pc?.perfSpecName }}</p>
        </Fieldset>
      </div>
    </div>

    <div class="flex items-center" style="margin-top: 10px; display: flex; justify-content: center">
      <Button
        type="button"
        class="items-center"
        label="Close"
        severity="secondary"
        @click="closeDialog"
      ></Button>
    </div>
  </Dialog>
</template>

<style lang="scss" scoped>
.inline-element {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
}

.inline-element > * {
  flex: 1;
}

/* 필요에 따라 스타일 추가 */
@mixin content-limited($height: 200px) {
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow-y: auto;
  max-height: $height;
  word-break: break-all;
}

// 클래스 정의
.content-limited {
  @include content-limited();
}

.content-limited-300 {
  @include content-limited(300px);
}

// 필요에 따라 추가
.content-limited-500 {
  @include content-limited(500px);
}
</style>
