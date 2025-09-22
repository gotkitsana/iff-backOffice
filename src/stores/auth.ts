import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import router from '@/router'
import api, { updateAuthToken } from '@/utils/axios'
import { toast } from 'vue3-toastify'
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
// import { usePermissionStore } from './permission'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const route = useRoute()
    // const permissionStore = usePermissionStore()

    const user = ref<any | undefined>(undefined)
    const requiredAuth = computed(() => route.meta.requiresAuth === true)

    const isRole = computed(
      () => ({
        label: 'ผู้ใช้งาน',
        value: 3,
        key: 'user',
      }),
      // permissionStore.admin_role.find((item) => item.value === user.value?.role) || {
      //   label: 'ผู้ใช้งาน',
      //   value: 3,
      //   key: 'user',
      // },
    )

    const fetchProfile = async () => {
      const { data } = await api.get('/admin/profile')
      user.value = data.data
      return data.data
    }

    useQuery<any>({
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

    async function login(payload: any) {
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
          updateAuthToken()
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
