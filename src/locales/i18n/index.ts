import { createI18n } from 'vue-i18n'
import ko from './ko.json'

// i18n 인스턴스 생성
export const i18n = createI18n({
  legacy: false,
  locale: 'ko',
  fallbackLocale: 'ko',
  messages: {
    ko
  }
})
