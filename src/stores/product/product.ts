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

export interface IProduct {
  birth: string
  weight: number
  breeders: string
  lotNumber: string
  quality: string
  pond: string
  seedType: string
  seedSize: string
  balance: number
  _id: string
  type: IType
  name: string
  price: number
  detail: string
  category: string
  sku: string
  farm: string
  size: number
  gender: string
  age: string
  sold: false
  rate: number
  youtube: string
  certificate?: string
  images: IProductImage[]
  auctionOnly: IAuctionOnly
  uat: number
}

export interface ICreateProductPayload {
  type: IType // 0 = ปลา, 1 = สินค้าอื่นๆ
  name: string // ชื่อสินค้า หรือ ชื่อสายพันธุ์ปลา
  lotNumber: string // หมายเลขล็อต
  price: number | null // ราคาสินค้า
  detail: string // รายละเอียดสินค้า
  category: string // หมวดหมู่ของสินค้า
  sold: boolean // สถานะขายสินค้า true = ขายแล้ว, false = ยังไม่ขาย
  youtube: string // url ของวิดีโอ ไม่บังคับ
  images?: { filename: string; type: string }[] // รูปภาพของสินค้า ไม่บังคับ
  certificate?: string // หนังสือรับรองของสินค้า ถ้า type = 0 ไม่ต้องระบุ
  auctionOnly: IAuctionOnly // 0 = สินค้าสำหรับขาย, 1 = สินค้าสำหรับประมูล
  weight: number // น้ำหนักปลา น้ำหนักต่อกระสอบ (กก.)

  sku?: string // รหัสปลา ถ้า type = 1 ไม่ต้องระบุ
  size?: number // ขนาดปลา ถ้า type = 1 ไม่ต้องระบุ
  farm?: string // ชื่อฟาร์มปลา ถ้า type = 1 ไม่ต้องระบุ
  birth?: string // วันเกิดปลา ถ้า type = 1 ไม่ต้องระบุ
  age?: string // อายุปลา ถ้า type = 1 ไม่ต้องระบุ
  gender?: string // เพศผู้, เพศเมีย, ไม่ระบุ  ถ้า type = 1 ไม่ต้องระบุ
  breeders?: string // แม่พันธุ์ปลา ถ้า type = 1 ไม่ต้องระบุ
  quality?: string // คุณภาพปลา ถ้า type = 1 ไม่ต้องระบุ
  pond?: string // บ่อปลา ถ้า type = 1 ไม่ต้องระบุ
  rate?: number // คะแนนของสินค้า (เป็น ดาวเต็ม 5) ถ้า type = 1 ไม่ต้องระบุ

  seedType?: string // ชนิดเม็ด ถ้า type = 0 ไม่ต้องระบุ
  seedSize?: string // ขนาดเม็ด ถ้า type = 0 ไม่ต้องระบุ
  balance?: number // คงเหลือ ถ้า type = 0 ไม่ต้องระบุ
}

export interface IUpdateProductPayload extends ICreateProductPayload {
  _id: string
}

export type IType =  0 | 1 // 0 = ปลา 1 = สินค้าอื่นๆ
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

export type IFieldsKey =
  | 'name'
  | 'lotNumber'
  | 'price'
  | 'weight'
  | 'sku'
  | 'size'
  | 'farm'
  | 'birth'
  | 'age'
  | 'gender'
  | 'breeders'
  | 'quality'
  | 'pond'
  | 'rate'
  | 'seedType'
  | 'seedSize'
  | 'balance'
  | 'detail'
  | 'type'
  | 'category'
  | 'youtube'
  | 'images'
  | 'certificate'
  | 'auctionOnly'
  | 'sold'

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
