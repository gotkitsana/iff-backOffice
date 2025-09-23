import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export type Role = 'system' | 'super_admin' | 'admin' | 'user' | 'sales' | 'none'

export const usePermissionStore = defineStore('permission', () => {
  const ROLES = reactive<{ [key in Role]: number }>({
    none: 0,
    sales: 1,
    user: 2,
    admin: 3,
    super_admin: 5,
    system: 6,
  })

  const admin_role = ref<{ label: string; value: number; key: Role }[]>([
    { label: 'ผู้ขาย', value: 1, key: 'sales' },
    { label: 'ผู้ใช้งาน', value: 2, key: 'user' },
    { label: 'Admin', value: 3, key: 'admin' },
    { label: 'Super Admin', value: 5, key: 'super_admin' },
    { label: 'ผู้ดูแลระบบ', value: 6, key: 'system' },
  ])

  function canAccess(isRole: number, allowedRoles: number[]): boolean {
    return allowedRoles.includes(isRole)
  }

  return {
    canAccess,
    ROLES,
    admin_role,
  }
})
