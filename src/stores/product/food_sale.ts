import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type { IFieldsOptions, IFieldsRequired, IFieldsType, IProduct } from './product'
import type { ICategory } from './category'

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
  product: IProduct
  priceKilo: number
  costPriceKilo: number
  customerPriceKilo: number
  dealerPriceKilo: number
  kilo: number
  
  cat: number
  uat: number
}

export interface ICreateFoodSalePayload {
  product: string
  priceKilo: number //ราคาท้องตลาดต่อกิโล
  costPriceKilo: number //ราคาทุนต่อกิโล
  customerPriceKilo: number //ราคาลูกค้าต่อกิโล
  dealerPriceKilo: number //ราคาพ่อค้าต่อกิโล
  kilo: number //น้ำหนักต่อกิโล
}

export interface IUpdateFoodSalePayload extends ICreateFoodSalePayload {
  _id: string
}

export type IFieldsKeyRetail =
  | 'product'
  | 'priceKilo'
  | 'costPriceKilo'
  | 'customerPriceKilo'
  | 'dealerPriceKilo'

export interface IFieldsRetail {
  key: IFieldsKeyRetail
  label: string
  type: IFieldsType
  required: IFieldsRequired
  options?: IFieldsOptions
}

export interface IFieldsRetailUI extends ICategory {
  fields: IFieldsRetail[]
}
