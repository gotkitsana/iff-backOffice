import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useFoodTypeStore = defineStore('foodType', () => {
  async function onGetFoodTypes() {
    const { data } = await api.get(`/foodtype`)
    return data.data
  }

  async function onCreateFoodType(payload: ICreateFoodTypePayload) {
    const { data } = await api.post(`/foodtype`, payload)
    return data
  }

  async function onUpdateFoodType(payload: IUpdateFoodTypePayload) {
    const { data } = await api.put(`/foodtype`, payload)
    return data
  }

  async function onDeleteFoodType(id: string) {
    const { data } = await api.delete(`/foodtype?id=${id}`)
    return data
  }

  return {
    onGetFoodTypes,
    onCreateFoodType,
    onUpdateFoodType,
    onDeleteFoodType,
  }
})

export interface IFoodType {
  _id: string
  name: string
  active: boolean
  note: string
  cat: number
  uat: number
}

export interface ICreateFoodTypePayload {
  name: string
  note: string
}

export interface IUpdateFoodTypePayload extends ICreateFoodTypePayload {
  _id: string
}
