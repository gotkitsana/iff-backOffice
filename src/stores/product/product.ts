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
  _id: string
  type: number
  name: string
  price: number | null
  detail: string
  category: string | null
  sku: string
  farm: string
  size: number
  gender: number
  age: string
  sold: boolean
  rate: number
  youtube: string
  certificate: string | null
  filename: string
  fileType: string
  auctionOnly: number
  cat: number
  uat: number
}

export type IProductDetail = {
  _id: string
  type: number
  name: string
  price: number | null
  detail: string
  category: string | null
  sku: string
  farm: string
  size: number
  gender: number
  age: string
  sold: boolean
  rate: number
  youtube: string
  certificate: string | null
  filename: string
  fileType: string
  auctionOnly: number
  cat: number
  uat: number
}

export type ICreateProductPayload = {
  type: number
  name: string
  price: number
  detail: string
  sku: string
  farm: string
  size: number
  gender: number
  age: string
  sold: boolean
  rate: number
  youtube: string
  images?: { filename: string; type: string }[]
  certificate: string | null
  auctionOnly: number
}

export type IUpdateProductPayload = {
  _id: string
  type: number
  name: string
  price: number
  detail: string
  sku: string
  farm: string
  size: number
  gender: number
  age: string
  sold: boolean
  rate: number
  youtube: string
  certificate: string | null
  images?: [
    {
      filename: string
      type: string
    },
  ]
  auctionOnly: number
}
