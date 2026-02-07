import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AppLayout from '@/components/AppLayout.vue'
import axios from 'axios'

interface ScreenTree {
  id: number
  name: string
  componentName: string
  url: string
  screens: ScreenTree[]
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '/',
          name: 'home',
          component: () => import('@/views/pages/Main.vue')
        },
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('@/views/pages/dashBoard/Dashboard.vue')
        },
        {
          path: '/dentistry-page',
          name: 'dentistry',
          component: () => import('@/views/pages/dentistry/Dentistry.vue')
        },
        {
          path: '/log-page',
          name: 'log',
          component: () => import('@/views/pages/log/Log.vue')
        },
        {
          path: '/pc-page',
          name: 'pc',
          // component: () => import('@/views/pages/pc/PC.vue'),
          children: [
            {
              path: 'dental-pc-ratio',
              name: 'dental-pc-ratio',
              component: () => import('@/views/pages/pc/DentalPcRatio.vue')
            },
            {
              path: 'dental-pc-perf',
              name: 'dental-pc-perf',
              component: () => import('@/views/pages/pc/DentalPcPerformance.vue')
            }
          ]
        },
        {
          path: '/access-log-page',
          name: 'access-log',
          component: () => import('@/views/pages/accessLog/AccessLogTable.vue')
        },
        {
          path: '/competitor-pc',
          name: 'conpetitorPc',
          component: () => import('@/views/pages/competitor/Competitor.vue')
        },
        {
          path: '/setting',
          name: 'setting',
          component: () => import('@/views/pages/admin/OneClickAdminSetting.vue')
        },
        {
          path: '/notice',
          name: 'notice',
          component: () => import('@/views/pages/notice/Notices.vue')
        },
        {
          path: '/addNotice',
          name: 'addNotice',
          component: () => import('@/views/pages/notice/AddNotice.vue')
        },
        {
          path: '/modifyNotice',
          name: 'modifyNotice',
          component: () => import('@/views/pages/notice/ModifyNotice.vue')
        },
        {
          path: '/noticesDetail',
          name: 'noticesDetail',
          component: () => import('@/views/pages/notice/NoticesDetail.vue')
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/pages/auth/LoginPage.vue')
    },
    {
      path: '/noticesContent',
      name: 'noticesContent',
      component: () => import('@/views/pages/notice/NoticesContent.vue')
    }
  ]
})

// 전역 네비게이션 가드 설정
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.path === '/login') {
    next()
  } else if (to.path === '/setting') {
    const found = authStore.roles.some((item) => item.type === 'ADMIN')

    if (found) {
      next()
    } else {
      next('/')
    }
  } else {
    if (authStore.isAuthenticated) {
      checkScreen(authStore.screens, to.path) ? next() : next('/')
    } else {
      try {
        const response = await axios.post('/api/auth/v1/validate')
        if (response && response?.data) {
          authStore.setAuthenticated(true)
          const info = await axios.get('/api/auth/v1/my-info')

          authStore.setUser(info.data.data.user)
          authStore.setRoleList(info.data.data.roles)
          authStore.setScreenList(info.data.data.screens)

          checkScreen(authStore.screens, to.path) ? next() : next('/')
        } else {
          next('/login')
        }
      } catch {
        next('/login')
      }
    }
  }
})

export function checkScreen(screens: ScreenTree[], url: string) {
  if (url === '/') {
    return true
  }
  return hasUrl(screens, url)
}

function hasUrl(data: ScreenTree[], url: string): boolean {
  return data.some(
    (screen) => screen.url === url || (screen.screens && hasUrl(screen.screens, url))
  )
}

export default router
