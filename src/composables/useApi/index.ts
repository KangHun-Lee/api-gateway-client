import {
  useAxios,
  type StrictUseAxiosReturn,
  type UseAxiosOptions
} from '@vueuse/integrations/useAxios'
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse
} from 'axios'
import { defu } from 'defu'
import router from '@/router'

export interface UseApiOptions<T = any> extends UseAxiosOptions<T> {
  retryCount?: number
  retryDelay?: number
}

export type UseApiReturn<T, R = AxiosResponse<T>, D = any> = StrictUseAxiosReturn<T, R, D> &
  Promise<StrictUseAxiosReturn<T, R, D>>

// 최초 한 번만 생성하여 불필요한 생성을 최소화합니다.
let instance: AxiosInstance | null = null

export function useApi<T, D>(
  url: string,
  config: AxiosRequestConfig<D> = {},
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  // 인스턴스가 null인 경우 새로운 인스턴스를 생성합니다.
  if (instance == null) {
    instance = axios.create({
      // 동일한 설정이 필요한 경우 여기에 설정

      // e.g. 아래와 같은 공통 URL을 설정해야 하는 경우
      baseURL: `/`
    })

    // // axsio의 인터셉터도 설정할 수 있습니다.
    // instance.interceptors.response.use(
    //   // 성공
    //   (data) => {
    //     console.log(`interceptor response use fulfilled: `, data)
    //     return data
    //   },
    //   // 실패
    //   (e) => {
    //     console.log(`interceptor response use rejected:`, e)
    //   }
    // )
  }

  // 재시도 관련 기본 옵션 설정
  const { retryCount = 3, retryDelay = 3000 } = options

  // 요청 실패 시 재시도 로직
  async function retryRequest(error: AxiosError, attempt: number): Promise<any> {
    if (attempt < retryCount) {
      console.log(`Retrying request... Attempt ${attempt + 1} of ${retryCount}`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))

      // error.config가 정의되어 있는지 확인
      if (error.config) {
        return instance!.request(error.config).catch((err) => retryRequest(err, attempt + 1))
      } else {
        throw new Error('Axios request config is undefined, unable to retry.')
      }
    }
    throw error // 재시도 한도를 초과했을 시 최종 실패 처리
  }

  // HTTP status가가 2xx이 아닌 경우
  async function onError(e: unknown): Promise<void> {
    // 여기서 오류가 발생하는 경우에 대한 처리 추가
    if (e instanceof AxiosError) {
      console.log(`onError AxiosError`, e)
      const { status = 200 } = e
      if (status === 401) {
        router.push('/login')
      } else if (status === 500) {
        //await retryRequest(e, 0)
        console.log(`onError AxiosError`, e)
      }
    }
  }

  // 항상 실행되는 함수
  function onFinish(): void {}

  // HTTP status가 2xx인 경우
  function onSuccess(data: T): void {}

  return useAxios<T>(
    url,
    config,
    instance,
    defu(options, {
      onError,
      onFinish,
      onSuccess,
      immediate: true
      //shallow: false
    } as UseApiOptions<T>)
  )
}
