import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useAdminStore = defineStore('admin', () => {
  async function onGetAdmins() {
    const { data } = await api.get(`/admin`)
    return data.data
  }

  async function onGetAdminID(id: string) {
    const { data } = await api.get(`/admin?id=${id}`)
    return data.data
  }

  async function onDeleteAdmin(id: string) {
    const { data } = await api.delete(`/admin?id=${id}`)
    return data
  }

  async function onCreateAdmin(payload: CreateAdminPayload) {
    const { data } = await api.post(`/admin`, payload)
    return data
  }

  async function onUpdateAdmin(payload: EditAdminPayload) {
    const { data } = await api.put(`/admin`, payload)
    return data
  }

  async function onGetProfile() {
    const { data } = await api.get(`/admin/profile`)
    return data
  }

  return {
    onGetAdmins,
    onGetAdminID,
    onDeleteAdmin,
    onCreateAdmin,
    onUpdateAdmin,
    onGetProfile,
  }
})

export interface IAdmin {
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
}

export interface CreateAdminPayload {
  username: string
  name: string
  password: string
  role: number
  email: string
}

export interface EditAdminPayload {
  _id: string
  username: string
  name: string
  password: string
  email: string
  image: string
  role: number
  block: boolean
}


