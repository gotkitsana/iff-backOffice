import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { ref } from 'vue'

export const useSupplierStore = defineStore('supplier', () => {
  async function onGetSuppliers() {
    const { data } = await api.get(`/supplier`)
    return data.data
  }

  async function onCreateSupplier(payload: ICreateSupplierPayload) {
    const { data } = await api.post(`/supplier`, payload)
    return data
  }

  async function onUpdateSupplier(payload: IUpdateSupplierPayload) {
    const { data } = await api.put(`/supplier`, payload)
    return data
  }

  async function onDeleteSupplier(id: string) {
    const { data } = await api.delete(`/supplier?id=${id}`)
    return data
  }

  const supplierContactOptions = ref<{ label: string; value: string }[]>([
    { label: 'Facebook', value: 'facebook' },
    { label: 'Line', value: 'line' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'อีเมล', value: 'email' },
    { label: 'โทรศัพท์', value: 'phone' },
    { label: 'สำนักงาน', value: 'office' },
    { label: 'อื่นๆ', value: 'other' },
  ])

  return {
    onGetSuppliers,
    onCreateSupplier,
    onUpdateSupplier,
    onDeleteSupplier,
    supplierContactOptions,
  }
})

export interface ISupplier {
  _id: string
  name: string
  company: string
  phoneNo: string
  contact: string
  brand: {
    _id: string
    name: string
    category: string
    active: boolean
    image: string
    note: string
    cat: number
    uat: number
  }
  note: string
  active: boolean
  cat: number
  uat: number
}

export interface ICreateSupplierPayload {
  name: string
  phoneNo: string
  contact: string
  note: string
  brand: string
}

export interface IUpdateSupplierPayload extends ICreateSupplierPayload {
  _id: string
}
