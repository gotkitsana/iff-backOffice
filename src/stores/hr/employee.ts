import { defineStore } from 'pinia'
import api from '@/utils/axios'

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

  return {
    onGetEmployees,
    onGetEmployeeByID,
    onCreateEmployee,
    onUpdateEmployee,
    onDeleteEmployee,
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
  department: string | null
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

export interface IUpdateEmployeePayload extends ICreateEmployeePayload {
  _id: string
}
