import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useFoodSaleStore = defineStore('foodSale', () => {
  async function onGetFoodSales() {
    const { data } = await api.get(`/foodsale`)
    return data.data
  }

  async function onCreateFoodSale(payload: ICreateFoodSalePayload) {
    const { data } = await api.post(`/foodsale`, payload)
    return data
  }

  async function onUpdateFoodSale(payload: IUpdateFoodSalePayload) {
    const { data } = await api.put(`/foodsale`, payload)
    return data
  }

  async function onDeleteFoodSale(id: string) {
    const { data } = await api.delete(`/foodsale?id=${id}`)
    return data
  }

  return {
    onGetFoodSales,
    onCreateFoodSale,
    onUpdateFoodSale,
    onDeleteFoodSale,
  }
})

export interface IFoodSale {
  _id: string
  name: string
  product: {
    _id: string
    name: string
  }
  priceKilo: number
  costPriceKilo: number
  active: boolean
  note: string
  cat: number
  uat: number
}

export interface ICreateFoodSalePayload {
  name: string
  note: string
  product: string
  priceKilo: number
  costPriceKilo: number
}

export interface IUpdateFoodSalePayload extends ICreateFoodSalePayload {
  _id: string
}
