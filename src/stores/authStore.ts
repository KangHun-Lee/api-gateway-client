import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  email: string
  departmentName: string
  employeeNo: string
  positionName: string
}

interface Role {
  id: number
  type: string
  name: string
}

interface Screen {
  id: number
  name: string
  componentName: string
  url: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  roles: Role[]
  screens: ScreenTree[]
}

interface ScreenTree {
  id: number
  name: string
  componentName: string
  url: string
  screens: ScreenTree[]
  items: Item[]
}

interface Item {
  label: string
  to: string
  icon: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    roles: [],
    screens: []
  }),
  actions: {
    setAuthenticated(value: boolean) {
      this.isAuthenticated = value
    },
    setUser(user: User) {
      this.user = user
    },
    setRoleList(roles: Role[]) {
      this.roles = roles
    },
    setScreenList(screens: ScreenTree[]) {
      if (screens.length != 0) {
        const pcScreenIndex = screens.findIndex((screen: ScreenTree) => screen.url === '/pc-page')
        if (pcScreenIndex !== -1) {
          screens[pcScreenIndex].items = [
            {
              label: 'PC 성능 비율',
              to: '/pc-page/dental-pc-ratio',
              icon: 'pi pi-chart-line'
            },
            {
              label: '치과별 PC 성능',
              to: '/pc-page/dental-pc-perf',
              icon: 'pi pi-chart-line'
            }
          ] as Item[]
        }
        const maxScreenId = Math.max(...screens.map((screen: ScreenTree) => screen.id))
        let nextScreenId = maxScreenId + 1
        screens[pcScreenIndex].screens = screens[pcScreenIndex].items.map((item: Item) => {
          return {
            id: nextScreenId++, // 순차적인 ID 부여
            name: item.label,
            componentName: '',
            url: item.to,
            screens: [],
            items: []
          }
        })
      }

      this.screens = screens
    },
    logout() {
      this.isAuthenticated = false
      this.user = null
      this.roles = []
      this.screens = []
      // 추가적인 로그아웃 로직 (예: 쿠키 삭제, 서버에 로그아웃 요청 등)
    }
  }
})
