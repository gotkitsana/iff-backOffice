import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useAccountIncomeStore = defineStore('AccountIncome', () => {
  async function onGetIncomes({ from, to }: { from: number; to: number }) {
    const { data } = await api.get(`/account/income?from=${from}&to=${to}`)
    return data.data
  }

  async function onGetIncomeByID({ id }: { id: string }) {
    const { data } = await api.get(`/account/income?id=${id}`)
    return data.data
  }

  async function onGetIncomeByCategory({
    category,
    from,
    to,
  }: {
    category: string
    from: number
    to: number
  }) {
    const { data } = await api.get(`/account/income?category=${category}&from=${from}&to=${to}`)
    return data.data
  }

  async function onGetIncomeByDepartment({
    department,
    from,
    to,
  }: {
    department: string
    from: number
    to: number
  }) {
    const { data } = await api.get(`/account/income?department=${department}&from=${from}&to=${to}`)
    return data.data
  }

  async function onCreateIncome(payload: ICreateIncomePayload) {
    const { data } = await api.post(`/account/income`, payload)
    return data
  }

  async function onUpdateIncome(payload: IUpdateIncomePayload) {
    const { data } = await api.put(`/account/income`, payload)
    return data
  }

  async function onDeleteIncome(id: string) {
    const { data } = await api.delete(`/account/income?id=${id}`)
    return data
  }

  async function onSendIncomeSlip({ id, image }: { id: string; image: File }) {
    const formData = new FormData()
    formData.append('image', image)
    const { data } = await api.post(`/account/income/slip?id=${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return data.data
  }

  return {
    onGetIncomes,
    onGetIncomeByID,
    onGetIncomeByCategory,
    onGetIncomeByDepartment,

    onCreateIncome,
    onUpdateIncome,
    onDeleteIncome,
    onSendIncomeSlip,
  }
})

export type IIncome = {
  _id: string
  type: string
  category: string | null
  department: string | null
  item: string
  amount: number
  note: string
  admin: string | null
  cat: number
  uat: number
}

export type ICreateIncomePayload = {
  type: string
  category: string
  department: string
  item: string
  amount: number
  note: string
  admin: string
}

export interface IUpdateIncomePayload extends ICreateIncomePayload {
  _id: string
}
