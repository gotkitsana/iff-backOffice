import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import router from '@/router'
import api, { updateAuthToken } from '@/utils/axios'
import { toast } from 'vue3-toastify'
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import { usePermissionStore } from './permission'
import type { Role } from './permission'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const route = useRoute()
    const permissionStore = usePermissionStore()

    const user = ref<IProfile | undefined>(undefined)
    const requiredAuth = computed(() => route.meta.requiresAuth === true)

    const isRole = computed(
      () =>
        permissionStore.admin_role.find(
          (item: { label: string; value: number; key: Role }) => item.value === user.value?.role,
        ) || {
          label: 'ผู้ใช้งาน',
          value: 3,
          key: 'user',
        },
    )

    const fetchProfile = async () => {
      const { data } = await api.get('/profile')
      user.value = data.data
      return data.data
    }

    useQuery<IProfile>({
      queryKey: ['get_profile'],
      queryFn: fetchProfile,
      enabled: requiredAuth,
    })

    async function initializeAuth() {
      if (!user.value) {
        console.log('fetch_Profile')
        await fetchProfile()
      }
    }

    async function login(payload: ILoginPayload) {
      try {
        const { data } = await api.post('/auth/login', payload)
        if (data.data) {
          Cookies.set(import.meta.env.VITE_COOKIE_NAME, data.data.accessToken, {
            secure: false,
            sameSite: 'strict',
          })
          Cookies.set(import.meta.env.VITE_REFRESH_NAME, data.data.refreshToken, {
            secure: false,
            sameSite: 'strict',
          })
          // อัพเดท token ใน axios
          updateAuthToken(data.data.accessToken)
        } else {
          toast(data?.error?.msg || 'เกิดข้อผิดลาด', { type: 'error' })
        }
        return Promise.resolve(data)
      } catch (error) {
        toast('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', { type: 'error' })
        return Promise.reject(error)
      }
    }

    function logout() {
      Cookies.remove(import.meta.env.VITE_COOKIE_NAME, { secure: true, sameSite: 'strict' })
      Cookies.remove(import.meta.env.VITE_REFRESH_NAME, { secure: true, sameSite: 'strict' })
      localStorage.clear()
      navigateToLogin()
    }

    function navigateToLogin() {
      router.push('/login')
    }

    return {
      user,
      isRole,
      login,
      initializeAuth,
      logout,
      navigateToLogin,
    }
  },
  {
    persist: {
      key: 'ahs',
      storage: localStorage,
    },
  },
)


export interface ILoginPayload {
  username: string
  password: string
}


export interface IProfile {
  _id: string
  username: string
  name: string
  password: string
  email: string
  image: string
  role: number
  block: boolean
  cat: number
  uat: number
  __v: number
}
