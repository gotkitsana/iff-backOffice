import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useProductStore = defineStore('product', () => {
  async function onGetProducts() {
    const { data } = await api.get(`/product`)
    return data.data
  }

  async function onGetProductsByID(id: string) {
    const { data } = await api.get(`/product?id=${id}`)
    return data.data
  }

  async function onCreateProduct(payload: ICreateProductPayload) {
    const { data } = await api.post(`/product`, payload)
    return data
  }


  async function onUpdateProduct(payload: IUpdateProductPayload) {
    const { data } = await api.put(`/product`, payload)
    return data
  }

  async function onDeleteProduct(id: string) {
    const { data } = await api.delete(`/product?id=${id}`)
    return data
  }

  return {
    onGetProducts,
    onGetProductsByID,

    onCreateProduct,
    onUpdateProduct,
    onDeleteProduct,
  }
})

export type IProduct = {
  filename: string
  fileType: string
  _id: string
  type: number
  name: string
  price: number
  detail: string
  category: string
  youtube: string
  cat: number
  uat: number
}

export type IProductDetail = {
  filename: string
  fileType: string
  _id: string
  type: number
  name: string
  price: number
  detail: string
  category: {
    _id: string
    name: string
  }
  youtube: string
  cat: number
  uat: number
}

export type ICreateProductPayload = {
  name: string
  cateId: string
  detail: string
  cat: number
  price: number
}

export interface IUpdateProductPayload extends ICreateProductPayload {
  _id: string
  name: string
  cateId: string
  detail: string
  cat: number
  price: number
}

