import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useAuctionMemberStore = defineStore('auctionMember', () => {
  async function onGetCustomers() {
    const { data } = await api.get(`/user`)
    return data.data
  }

  async function onGetCustomerID(id: string) {
    const { data } = await api.get(`/user?id=${id}`)
    return data.data
  }

  async function onDeleteCustomer(id: string) {
    const { data } = await api.delete(`/user?id=${id}`)
    return data
  }

  async function onCreateCustomer(payload: CreateCustomerPayload) {
    const { data } = await api.post(`/user`, payload)
    return data
  }

  async function onUpdateCustomer(payload: EditCustomerPayload) {
    const { data } = await api.put(`/user`, payload)
    return data
  }

  async function onResetPassword(payload: ResetPasswordPayload) {
    const { data } = await api.put(`/user/reset/password`, payload)
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
  displayName: string | null
  name: string
  password: string
  email: string
  isVerify: boolean
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
  isVerify: boolean
  bidder: boolean
}

export interface EditCustomerPayload {
  _id: string
  displayName: string
  name: string
  email: string
  isVerify: boolean
  bidder: boolean
}

export interface ResetPasswordPayload {
  id: string
  password: string
}
