<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { number } from 'zod'
const props = defineProps({
  visible: Boolean,
  content: String,
  width: {
    type: Number,
    default: 700
  },
  height: {
    type: Number,
    default: 730
  }
})

const internalVisible = ref(props.visible)

const emit = defineEmits(['update:visible'])

function closeDialog() {
  internalVisible.value = false
  emit('update:visible', false)
}

watch(internalVisible, (newVal) => {
  emit('update:visible', newVal)
})
</script>
<template>
  <Dialog
    v-if="visible"
    v-model:visible="internalVisible"
    :style="{ width: props.width + 100 + 'px', maxHeight: props.height + 200 + 'px' }"
    :breakpoints="{ '1199px': '70vw', '575px': '90vw' }"
  >
    <div
      v-html="props.content"
      class="preview-content"
      :style="{ width: props.width + 'px', height: props.height + 'px' }"
    ></div>
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
.preview-content {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  overflow: auto; /* 내용이 넘칠 경우 스크롤 */
}
</style>
