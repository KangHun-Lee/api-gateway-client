import { useToast } from 'primevue/usetoast'
// toast helper를 반환
export function useToastHelper() {
  const toast = useToast()

  function successToast(detail: string = '요청이 성공적으로 처리되었습니다.') {
    toast.add({
      severity: 'success',
      summary: '요청 성공',
      detail,
      life: 3000
    })
  }

  function errorToast(detail: string = '요청이 실패했습니다. 다시 시도해주세요.') {
    toast.add({
      severity: 'error',
      summary: '요청 실패',
      detail,
      life: 3000
    })
  }

  return {
    successToast,
    errorToast
  }
}
