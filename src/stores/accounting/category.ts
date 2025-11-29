import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type { IExpenseTypeValue } from './expense'

export const useAccountCategoryStore = defineStore('AccountCategory', () => {
  async function onGetCategories() {
    const { data } = await api.get(`/account/category`)
    return data.data
  }

  async function onCreateAccountCategory(payload: ICreateAccountCategoryPayload) {
    const { data } = await api.post(`/account/category`, payload)
    return data
  }

  async function onUpdateAccountCategory(payload: IUpdateAccountCategoryPayload) {
    const { data } = await api.put(`/account/category`, payload)
    return data
  }

  async function onDeleteAccountCategory(id: string) {
    const { data } = await api.delete(`/account/category?id=${id}`)
    return data
  }

  return {
    onGetCategories,
    onCreateAccountCategory,
    onUpdateAccountCategory,
    onDeleteAccountCategory,
  }
})

export type IAccountCategory = {
  _id: string
  name: string // รายการ
  type: IExpenseTypeValue // ประเภท
  detail: string // รายละเอียด
  note: string // หมายเหตุ
  active: boolean // สถานะ
  department: string | null // แผนก
  cat: number
  uat: number
}

export type ICreateAccountCategoryPayload = {
  name: string
  detail: string
  department: string
  type: string
  note: string
}

export interface IUpdateAccountCategoryPayload extends ICreateAccountCategoryPayload {
  _id: string
  active: boolean
}
