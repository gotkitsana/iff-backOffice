import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useDepartmentStore = defineStore('Department', () => {
  async function onGetDepartments() {
    const { data } = await api.get(`/hr/department`)
    return data.data
  }

  async function onCreateDepartment(payload: ICreateDepartmentPayload) {
    const { data } = await api.post(`/hr/department`, payload)
    return data
  }

  async function onUpdateDepartment(payload: IUpdateDepartmentPayload) {
    const { data } = await api.put(`/hr/department`, payload)
    return data
  }

  async function onDeleteDepartment(id: string) {
    const { data } = await api.delete(`/hr/department?id=${id}`)
    return data
  }

  return {
    onGetDepartments,
    onCreateDepartment,
    onUpdateDepartment,
    onDeleteDepartment,
  }
})

export type IDepartment = {
  _id: string
  name: string
  detail: string
  note: string
  active: boolean
  cat: number
  uat: number
}

export type ICreateDepartmentPayload = {
  name: string
  detail: string
  note: string
}

export interface IUpdateDepartmentPayload extends ICreateDepartmentPayload {
  _id: string
  active: boolean
}
