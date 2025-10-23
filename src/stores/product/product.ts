import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type { ICategory, ICategoryLabel, ICategoryValue } from './category'

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

  async function onUploadImage(image: File) {
    const formData = new FormData()
    formData.append('imageFile', image)

    const { data } = await api.post(`/storage/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }

  return {
    onGetProducts,
    onGetProductsByID,

    onCreateProduct,
    onUpdateProduct,
    onDeleteProduct,
    onUploadImage,
  }
})

export type IProduct = {
  _id: string
  type: IType
  name: string
  price: number | null
  detail: string
  category: string | null
  sku: string
  farm: string
  size: number | null
  gender: IGender | null
  age: string
  sold: boolean
  rate: number
  youtube: string
  images: { filename: string; type: string }[]
  certificate: string | null
  auctionOnly: IAuctionOnly
  uat: number
}

export type IProductDetail = {
  _id: string
  type: IType
  name: string
  price: number | null
  detail: string
  category: {
    _id: string
    name: string
  } | null
  sku: string
  farm: string
  size: number | null
  gender: IGender | null
  age: string
  sold: boolean
  rate: number
  youtube: string
  certificate: string | null
  images: { filename: string; type: string }[]
  auctionOnly: IAuctionOnly
  uat: number
}

export interface ICreateProductPayload {
  type: IType // 1 = ปลา 0 = อื่นๆ
  name: string // ชื่อสินค้า หรือ ชื่อปลา
  price: number | null // ราคาสินค้า ถ้า auctionOnly = 1 ไม่ต้องระบุ
  detail: string // รายละเอียดสินค้า
  category: string | null // หมวดหมู่ของสินค้า
  sku: string // sku ของสินค้า
  farm: string // ชื่อฟาร์มปลา ถ้า auctionOnly = 0 ไม่ต้องระบุ
  size: number | null // ขนาดปลา ถ้า type = 0 ไม่ต้องระบุ
  gender: IGender // 1 = ตัวผู้ 0 = ตัวเมีย ถ้า auctionOnly = 0 ไม่ต้องระบุ
  age: string // อายุปลา ถ้า type = 0 ไม่ต้องระบุ
  sold: boolean // สถานะขายสินค้า true = ขายแล้ว, false = ยังไม่ขาย
  rate: number // คะแนนของสินค้า (เป็น ดาวเต็ม 5) ถ้า type = 0 ไม่ต้องระบุ
  youtube: string // url ของวิดีโอ ไม่บังคับ
  images?: { filename: string; type: string }[] // รูปภาพของสินค้า ไม่บังคับ
  certificate: string | null // หนังสือรับรองของสินค้า ถ้า type = 0 ไม่ต้องระบุ
  auctionOnly: IAuctionOnly // 0 = สินค้าสำหรับขาย, 1 = สินค้าสำหรับประมูล
}

export interface IUpdateProductPayload extends ICreateProductPayload {
  _id: string
}

export type IGender = 1 | 0 // 1 = ตัวผู้ 0 = ตัวเมีย
export type IType = 1 | 0 // 1 = ปลา 0 = อื่นๆ
export type IAuctionOnly = 0 | 1 // 0 = สินค้าสำหรับขาย 1 = สินค้าสำหรับประมูล


export type IUploadImageResponse = {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}

export type IFieldsKey = 'lotNumber' | 'pond' | 'fishId' | 'species' | 'breed' | 'birthDate' | 'age' | 'quality' | 'farm' | 'size' | 'weight' | 'gender' | 'price' | 'productName' | 'pelletType' | 'weightPerBag' | 'pelletSize' | 'remainingQuantity'
export type IFieldsType = 'text' | 'number' | 'select' | 'textarea' | 'date'
export type IFieldsRequired = boolean
export type IFieldsOptions = { label: string; value: string | number }[]

export interface IFields {
  key: IFieldsKey
  label: string
  type: IFieldsType
  required: IFieldsRequired
  options?: IFieldsOptions
}

export interface ICategoryOption extends ICategory {
  fields: IFields[]
}

export type IProductImage = {
  filename: string
  type: string
  preview?: string
}

export type ICertificateFile = {
  filename: string
  preview: string
}
