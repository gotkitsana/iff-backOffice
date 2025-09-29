import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useCustomerStore = defineStore('customer', () => {
  async function onGetCustomers() {
    const { data } = await api.get(`/member`)
    return data.data
  }

  async function onGetCustomerID(id: string) {
    const { data } = await api.get(`/member?id=${id}`)
    return data.data
  }

  async function onDeleteCustomer(id: string) {
    const { data } = await api.delete(`/member?id=${id}`)
    return data
  }

  async function onCreateCustomer(payload: CreateCustomerPayload) {
    const { data } = await api.post(`/member`, payload)
    return data
  }

  async function onUpdateCustomer(payload: EditCustomerPayload) {
    const { data } = await api.put(`/member`, payload)
    return data
  }

  async function onResetPassword(payload: ResetPasswordPayload) {
    const { data } = await api.put(`/member/reset/password`, payload)
    return data
  }

  return {
    onGetCustomers,
    onGetCustomerID,
    onDeleteCustomer,
    onUpdateCustomer,
    onCreateCustomer,
    onResetPassword,
  }
})

export interface Customer {
  _id: string
  username: string
  displayName: string
  name: string
  password: string
  email: string
  phone: string
  bidder: boolean
  cat: number
  uat: number
}


export interface CreateCustomerPayload {
  username: string
  displayName: string
  name: string
  password: string
  email: string
  phone: string
  bidder: boolean
}

export interface EditCustomerPayload {
  _id: string
  displayName: string
  name: string
  email: string
  phone: string
  bidder: boolean
}


export interface ResetPasswordPayload {
  id: string
  password: string
}
