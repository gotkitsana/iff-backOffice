import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Cookies from 'js-cookie'

export function setupGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const token = Cookies.get(import.meta.env.VITE_COOKIE_NAME)
    // ถ้ามี token ให้ initialize
    if (!!token) {
      await authStore.initializeAuth()
    }

    // true / false
    const requiredAuth = to.meta.requiresAuth === true

    if (to.name === 'login' && !!token) {
      return next({ name: 'dashboard' })
    }

    console.log(requiredAuth, !token)
    // 🔒 หน้าต้อง login แต่ไม่ได้ login
    if (requiredAuth && !token) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    const requiredRoles = to.meta.roles as string[] | undefined
    // 🛡 ถ้ามีการกำหนด role และ user ไม่มีสิทธิ์
    if (requiredRoles && authStore.isRole && !requiredRoles.includes(authStore.isRole.key)) {
      return next({ name: 'unauthorized' }) // redirect ไปหน้าห้ามเข้า
    }

    return next()
  })
}
