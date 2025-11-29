import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type { IAccountCategory } from './category';
import type { IDepartment } from '../hr/department';

export const useAccountExpenseStore = defineStore('AccountExpense', () => {
  async function onGetExpenses({ from, to }: { from: number; to: number }) {
    const { data } = await api.get(`/account/expense?from=${from}&to=${to}`)
    return data.data
  }

  async function onGetExpenseByID({ id }: { id: string }) {
    const { data } = await api.get(`/account/expense?id=${id}`)
    return data.data
  }

  async function onGetExpenseByFilter({
    department,
    category,
    from,
    to,
  }: {
    department: string
    category: string
    from: number
    to: number
  }) {
    const query = new URLSearchParams()
    if (department) query.append('department', department)
    if (category) query.append('category', category)
    if (from) query.append('from', from.toString())
    if (to) query.append('to', to.toString())
    const { data } = await api.get(`/account/expense?${query.toString()}`)
    return data.data
  }


  async function onCreateExpense(payload: ICreateExpensePayload) {
    const { data } = await api.post(`/account/expense`, payload)
    return data
  }

  async function onUpdateExpense(payload: IUpdateExpensePayload) {
    const { data } = await api.put(`/account/expense`, payload)
    return data
  }

  async function onDeleteExpense(id: string) {
    const { data } = await api.delete(`/account/expense?id=${id}`)
    return data
  }

  async function onSendExpenseSlip({ id, image }: { id: string; image: File }) {
    const formData = new FormData()
    formData.append('image', image)
    const { data } = await api.post(`/account/expense/slip?id=${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return data.data
  }

  const expense_types = [
    { label: 'ไม่ประจำ', value: 'unfixed' },
    { label: 'ประจำ', value: 'fixed' },
    { label: 'โครงการ', value: 'project' },
    { label: 'ลงทุน', value: 'investment' },
  ]

  return {
    onGetExpenses,
    onGetExpenseByID,
    onGetExpenseByFilter,

    onCreateExpense,
    onUpdateExpense,
    onDeleteExpense,
    onSendExpenseSlip,

    expense_types,
  }
})

export type IExpense = {
  _id: string
  type: string
  category: IAccountCategory | null
  department: IDepartment | null
  item: string
  amount: number
  dueDate: string
  paymentMethod: string
  itemStatus: string
  note: string
  admin: string | null
  cat: number
  uat: number
}

export type ICreateExpensePayload = {
  type: string
  category: string
  department: string
  dueDate: string //กำหนดชำระ
  paymentMethod: string //;//วิธีการชำระ
  itemStatus: string //วิสถานะรายการ
  item: string
  amount: number
  admin: string
  note: string
}

export interface IUpdateExpensePayload extends ICreateExpensePayload {
  _id: string
}


