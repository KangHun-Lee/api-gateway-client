import { useConfirm } from 'primevue/useconfirm'
import { ref } from 'vue'

export function useConfirmHelper() {
  const confirm = useConfirm()
  const resolveRef = ref<((value: boolean) => void) | null>(null)

  const showConfirmDialog = (
    header: string = '저장',
    message: string = '저장하시겠습니까?'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.value = resolve

      confirm.require({
        message,
        header,
        icon: 'pi pi-info-circle',
        rejectProps: {
          label: '아니요',
          severity: 'secondary',
          outlined: true
        },
        acceptProps: {
          label: '네'
        },
        accept: () => resolveRef.value?.(true), // 확인 시 true 반환
        reject: () => resolveRef.value?.(false) // 취소 시 false 반환
      })
    })
  }

  return {
    showConfirmDialog
  }
}
