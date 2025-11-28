import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type { IDepartment } from './department'

export const useEmployeeStore = defineStore('Employee', () => {
  async function onGetEmployees() {
    const { data } = await api.get(`/hr/employee`)
    return data.data
  }

  async function onGetEmployeeByID(id: string) {
    const { data } = await api.get(`/hr/employee?id=${id}`)
    return data.data
  }

  async function onCreateEmployee(payload: ICreateEmployeePayload) {
    const { data } = await api.post(`/hr/employee`, payload)
    return data
  }

  async function onUpdateEmployee(payload: IUpdateEmployeePayload) {
    const { data } = await api.put(`/hr/employee`, payload)
    return data
  }

  async function onDeleteEmployee(id: string) {
    const { data } = await api.delete(`/hr/employee?id=${id}`)
    return data
  }

  const statusEmployee = [
    { label: 'ประจำ', value: 'active', severity: 'success' },
    { label: 'รายวัน(ทดลองงาน)', value: 'trial', severity: 'warn' },
    { label: 'รายวัน', value: 'daily', severity: 'info' },
    { label: 'ทดลองงาน', value: 'test', severity: 'warn' },
  ]

  return {
    onGetEmployees,
    onGetEmployeeByID,
    onCreateEmployee,
    onUpdateEmployee,
    onDeleteEmployee,
    statusEmployee,
  }
})

export type IEmployee = {
  _id: string
  displayName: string
  name: string
  code: string
  status: string
  position: string
  startDate: number
  department: IDepartment | null
  salaryPro: number
  salary: number
  bankCode: string
  bankAccount: string
  note: string
  cat: number
  uat: number
}

export type ICreateEmployeePayload = {
  displayName: string
  name: string
  code: string
  status: string
  position: string
  startDate: number
  department: string
  salaryPro: number
  salary: number
  bankCode: string
  bankAccount: string
  note: string
}

export interface IUpdateEmployeePayload extends ICreateEmployeePayload  {
  department: string
  _id: string
}
