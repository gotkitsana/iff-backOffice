import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type { ICategory } from './category'

export const useProductStore = defineStore('product', () => {
  async function onGetProducts() {
    const { data } = await api.get(`/product`)
    return data.data
  }

  async function onGetProductsByID(id: string) {
    const { data } = await api.get(`/product?id=${id}`)
    return data.data
  }

  async function onGetProductsByCategory(categoryId: string) {
    const { data } = await api.get(`/product?cateId=${categoryId}`)
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

  const seedTypeOptions = [
    {
      label: 'ลอย',
      value: 'ลอย',
    },
    { label: 'จม', value: 'จม' },
  ]

  const genderOptions = [
    {
      label: 'ตัวผู้',
      value: 'male',
    },
    { label: 'ตัวเมีย', value: 'female' },
    { label: 'ไม่ระบุ', value: 'unknown' },
  ]

  const ageOptions = [
    { label: 'Tosai (6เดือน-1ปี)', value: 'tosai' },
    { label: 'Nisai (1-2ปี)', value: 'nisai' },
    { label: 'Sansai (2-3ปี)', value: 'sansai' },
    { label: 'Yonsai (3-4ปี)', value: 'yonsai' },
    { label: 'Rokusai (4-5ปี)', value: 'rokusai' },
  ]

  return {
    onGetProducts,
    onGetProductsByID,
    onGetProductsByCategory,
    onCreateProduct,
    onUpdateProduct,
    onDeleteProduct,
    seedTypeOptions,
    genderOptions,
    ageOptions,
  }
})

export interface IProduct {
  code: string
  birth?: string
  weight?: number
  breeders?: string
  lotNumber: {
    active: boolean
    cat: number
    name: string
    note: string
    uat: number
    _id: string
  }
  quality?: {
    active: true
    cat: number
    name: string
    note: string
    uat: number
    _id: string
  } | null
  fishpond: {
    name: string
    active: boolean
    cat: number
    code: string
    depth: number
    greenhouse: string
    images: { filename: string; type: string }[]
    length: number
    note: string
    uat: number
    width: number
    _id: string
  } | null

  seedType?: string
  foodtype?: {
    active: boolean
    cat: number
    name: string
    note: string
    uat: number
    _id: string
  }
  seedSize?: {
    active: boolean
    cat: number
    name: string
    note: string
    uat: number
    _id: string
  }
  brand?: {
    active: true
    cat: number
    name: string
    note: string
    uat: number
    _id: string
  }

  balance?: number
  _id: string
  type: IType
  name: string
  price: number
  detail?: string
  category: {
    _id: string
    name: string
  } | null
  species: {
    _id: string
    name: string
    detail?: string
  } | null
  food: {
    type: string
    produceDate: number
    expireDate: number
    marketPrice: number
    costPrice: number
    customerPrice: number
    dealerPrice: number
  } | null
  sku: string
  farm: {
    active: boolean
    cat: number
    name: string
    note: string
    uat: number
    _id: string
  } | null
  fishStatus?: {
    active: boolean
    cat: number
    name: string
    note: string
    uat: number
    _id: string
  } | null
  size?: number
  gender?: string
  age?: string
  sold: boolean
  rate?: number
  youtube: string
  certificate?: string
  images: IProductImage[]
  auctionOnly: IAuctionOnly
  waitQC: boolean // สถานะการรอการตรวจสอบคุณภาพ true = รอการตรวจสอบคุณภาพ, false = ผ่านการตรวจสอบคุณภาพ
  cat: number
  uat: number
}

export interface ICreateProductPayload {
  type: IType // 0 = ปลา, 1 = สินค้าอื่นๆ
  name: string // ชื่อสินค้า
  code: string // รหัสสินค้า
  lotNumber: string // หมายเลขล็อต
  price: number // ราคาสินค้า
  detail?: string // รายละเอียดสินค้า
  category: string // หมวดหมู่ของสินค้า
  sold: boolean // สถานะขายสินค้า true = ขายแล้ว, false = ยังไม่ขาย
  waitQC: boolean // สถานะการรอการตรวจสอบคุณภาพ true = รอการตรวจสอบคุณภาพ, false = ผ่านการตรวจสอบคุณภาพ
  youtube: string // url ของวิดีโอ ไม่บังคับ
  images?: { filename: string; type: string }[] // รูปภาพของสินค้า ไม่บังคับ
  certificate?: string // หนังสือรับรองของสินค้า ถ้า type = 0 ไม่ต้องระบุ
  auctionOnly: IAuctionOnly // 0 = สินค้าสำหรับขาย, 1 = สินค้าสำหรับประมูล
  weight?: number // น้ำหนักปลา, น้ำหนักต่อกระสอบ (กก.)

  sku?: string // รหัสปลา
  size?: number // ขนาดปลา ถ้า type = 1 ไม่ต้องระบุ
  farm?: string // ชื่อฟาร์มปลา ถ้า type = 1 ไม่ต้องระบุ
  birth?: string // วันเกิดปลา ถ้า type = 1 ไม่ต้องระบุ
  age?: string // อายุปลา ถ้า type = 1 ไม่ต้องระบุ
  gender?: string // เพศผู้, เพศเมีย, ไม่ระบุ  ถ้า type = 1 ไม่ต้องระบุ
  breeders?: string // แม่พันธุ์ปลา ถ้า type = 1 ไม่ต้องระบุ
  quality?: string // คุณภาพปลา ถ้า type = 1 ไม่ต้องระบุ
  fishpond?: string // บ่อปลา ถ้า type = 1 ไม่ต้องระบุ
  rate?: number // คะแนนของสินค้า (เป็น ดาวเต็ม 5) ถ้า type = 1 ไม่ต้องระบุ
  species?: string // ชื่อสายพันธุ์ปลา ถ้า type = 1 ไม่ต้องระบุ

  seedType?: string // ชนิดเม็ด ถ้า type = 0 ไม่ต้องระบุ
  balance?: number // คงเหลือ ถ้า type = 0 ไม่ต้องระบุ

  food: {
    produceDate: number // วันที่ผลิต ถ้า type = 0 ไม่ต้องระบุ
    expireDate: number // วันหมดอายุ ถ้า type = 0 ไม่ต้องระบุ
    marketPrice: number // ราคาท้องตลาด ถ้า type = 0 ไม่ต้องระบุ
    costPrice: number // ราคาทุน ถ้า type = 0 ไม่ต้องระบุ
    customerPrice: number // ราคาลูกค้า ถ้า type = 0 ไม่ต้องระบุ
    dealerPrice: number // ราคาพ่อค้า ถ้า type = 0 ไม่ต้องระบุ
  }

  brand?: string
  foodtype?: string
  seedSize?: string
  fishStatus?: string
}

export interface IUpdateProductPayload
  extends Omit<
    IProduct,
    | 'fishpond'
    | 'species'
    | 'farm'
    | 'quality'
    | 'lotNumber'
    | 'seedSize'
    | 'foodtype'
    | 'brand'
    | 'fishStatus'
    | 'waitQC'
  > {
  _id: string
  fishpond?: string
  species?: string
  farm?: string
  quality?: string
  lotNumber?: string
  seedSize?: string
  foodtype?: string
  brand?: string
  fishStatus?: string
  waitQC?: boolean
}

export type IType = 0 | 1 // 0 = ปลา 1 = สินค้าอื่นๆ
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
  | 'fishpond'
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
  | 'foodtype'
  | 'produceDate'
  | 'expireDate'
  | 'marketPrice'
  | 'costPrice'
  | 'customerPrice'
  | 'dealerPrice'
  | 'species'
  | 'code'
  | 'greenhouse'
  | 'brand'
  | 'fishStatus'

export type IFieldsType = 'text' | 'number' | 'select' | 'textarea' | 'date' | 'boolean'
export type IFieldsRequired = boolean
export type IFieldsOptions = { label: string; value: string | number }[]

export interface IFields {
  key: IFieldsKey
  label: string
  type: IFieldsType
  required: IFieldsRequired
  options?: IFieldsOptions
  closeInEdit?: boolean
}

export interface ICategoryOption extends ICategory {
  fields: IFields[]
}

export type IProductImage = {
  filename: string
  type: string
}

export type ICertificateFile = {
  filename: string
  preview: string
}

export interface IFoodFilters {
  sku: string
  lotNumber: string
  brandName: string
  foodtype: string
  seedType: string
  seedSize: string
  priceMin: number
  priceMax: number
}

export interface IMicroorganismFilters {
  sku: string
  lotNumber: string
  brandName: string
  priceMin: number
  priceMax: number
}
