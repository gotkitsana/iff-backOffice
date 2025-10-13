import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useCustomerStore = defineStore('customer', () => {
  async function onGetCustomers() {
    const { data } = await api.get(`/customer`)
    return data.data
  }

  return {
    onGetCustomers,

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
