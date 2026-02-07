<script setup lang="ts">
import 'suneditor/dist/css/suneditor.min.css'
import suneditor from 'suneditor'
import plugins from 'suneditor/src/plugins'
import lang from 'suneditor/src/lang'

import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue']) // 값 변경 이벤트 전달

const editorRef = ref(null) // SunEditor가 적용될 DOM 요소
const content = ref('') // 에디터 내용 저장
let editorInstance: any = null // SunEditor 인스턴스

onMounted(() => {
  if (editorRef.value) {
    editorInstance = suneditor.create('sun-editor', {
      placeholder: 'Write here',
      value: '',
      plugins: plugins,
      lang: lang.ko,
      buttonList: [
        ['undo', 'redo'],
        ['font', 'fontSize', 'formatBlock'],
        ['paragraphStyle', 'blockquote'],
        ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
        ['fontColor', 'hiliteColor', 'textStyle'],
        ['removeFormat'],
        ['outdent', 'indent'],
        ['align', 'horizontalRule', 'list', 'lineHeight'],
        ['table', 'link', 'image', 'video'],
        ['fullScreen', 'showBlocks', 'codeView'],
        '/' // line break
        // ['save', 'template']
      ]
    })

    editorInstance.onImageUpload = (targetElement: HTMLImageElement): void => {
      const figure = targetElement.closest('figure') as HTMLImageElement

      if (figure) {
        figure.style.cssText = 'margin:0; padding:0;'
      }
    }

    editorInstance.onChange = (newContent: any) => {
      emit('update:modelValue', newContent)
      //   content.value = newContent
      //   console.log('Editor Content:', newContent)
    }

    editorInstance.setContents(props.modelValue || '')
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editorInstance && editorInstance.getContents() !== newValue) {
      editorInstance.setContents(newValue || '')
    }
  }
)

onUnmounted(() => {
  if (editorInstance) {
    editorInstance.destroy() // 메모리 정리
  }
})
</script>
<template>
  <textarea id="sun-editor" ref="editorRef" rows="40"></textarea>
</template>
