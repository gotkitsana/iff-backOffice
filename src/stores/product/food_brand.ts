import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useFoodBrandStore = defineStore('foodBrand', () => {
  async function onGetFoodBrands() {
    const { data } = await api.get(`/brand`)
    return data.data
  }

  async function onCreateFoodBrand(payload: ICreateFoodBrandPayload) {
    const { data } = await api.post(`/brand`, payload)
    return data
  }

  async function onUpdateFoodBrand(payload: IUpdateFoodBrandPayload) {
    const { data } = await api.put(`/brand`, payload)
    return data
  }

  async function onDeleteFoodBrand(id: string) {
    const { data } = await api.delete(`/brand?id=${id}`)
    return data
  }

  return {
    onGetFoodBrands,
    onCreateFoodBrand,
    onUpdateFoodBrand,
    onDeleteFoodBrand,
  }
})

export interface IFoodBrand {
  _id: string
  name: string
  active: boolean
  note: string
  cat: number
  uat: number
}

export interface ICreateFoodBrandPayload {
  name: string
  note: string
}

export interface IUpdateFoodBrandPayload extends ICreateFoodBrandPayload {
  _id: string
}
