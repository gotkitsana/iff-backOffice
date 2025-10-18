import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type { IMember } from '../member/member'

export const useSalesStore = defineStore('sales', () => {
  async function onGetSales() {
    const { data } = await api.get(`/sale`)
    return data.data
  }

  async function onGetSalesDetail(id: string) {
    const { data } = await api.get(`/sale?id=${id}`)
    return data.data
  }

  async function onCreateSalesDetail(payload: ICreateSalesPayload) {
    const { data } = await api.post(`/sale`, payload)
    return data
  }

  async function onUpdateSalesDetail(payload: IUpdateSalesPayload) {
    const { data } = await api.put(`/sale`, payload)
    return data
  }

  const paymentMethods = [
    { label: 'เงินสด', value: 'cash' },
    { label: 'โอน', value: 'transfer' },
    { label: 'บัตรเครดิต', value: 'credit' },
    { label: 'QR PromptPay', value: 'promptpay' },
    { label: 'อื่นๆ', value: 'other' },
  ]

  const categoryTypes = [
    { label: 'ปลา', value: 'fish' },
    { label: 'สารปรับสภาพน้ำ', value: 'water' },
    { label: 'คอนสทรัคชั่น', value: 'construction' },
    { label: 'บริการ', value: 'service' },
    { label: 'อาหาร', value: 'food' },
    { label: 'ยา', value: 'medicine' },
    { label: 'อุปกรณ์', value: 'equipment' },
  ]

  const sellers = [
    { label: 'Bert', value: 'Bert' },
    { label: 'Little', value: 'Little' },
    { label: 'Sale01', value: 'Sale01' },
    { label: 'Sale02', value: 'Sale02' },
  ]

  const sellingStatusOptions: { label: string; value: SellingStatus }[] = [
    { label: 'ระหว่างจัดหา', value: 'wait_product' },
    { label: 'รอตัดสินใจ', value: 'wait_confirm' },
    { label: 'รอชำระเงิน', value: 'wait_payment' },
    { label: 'ชำระเงินเรียบร้อย', value: 'paid_complete' },
    { label: 'ระหว่างรอจัดส่ง', value: 'preparing' },
    { label: 'ระหว่างขนส่ง', value: 'shipping' },
    { label: 'ได้รับสินค้าแล้ว', value: 'received' },
    { label: 'สินค้าเสียหาย', value: 'damaged' },
  ]

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'wait_product':
        return { label: 'รอจัดหา', severity: 'warning' }
      case 'wait_confirm':
        return { label: 'รอยืนยัน', severity: 'warning' }
      case 'wait_payment':
        return { label: 'รอชำระเงิน', severity: 'warning' }
      case 'paid_complete':
        return { label: 'ชำระเงินเรียบร้อย', severity: 'success' }
      case 'pack_and_ship':
        return { label: 'แพ็คเตรียมสินค้ารอจัดส่ง', severity: 'info' }
      case 'shipping':
        return { label: 'อยู่ระหว่างขนส่ง', severity: 'info' }
      case 'received':
        return { label: 'ได้รับสินค้าเรียบร้อย', severity: 'success' }
      case 'damaged':
        return { label: 'สินค้าเสียหาย', severity: 'danger' }
      default:
        return { label: status, severity: 'info' }
    }
  }

  const getPaymentMethodTag = (method: string) => {
    switch (method) {
      case 'SCB':
        return { label: 'SCB', severity: 'info' }
      case 'KBANK':
        return { label: 'KBANK', severity: 'info' }
      case 'BBL':
        return { label: 'BBL', severity: 'info' }
      case 'cash':
        return { label: 'เงินสด', severity: 'success' }
      case 'transfer':
        return { label: 'โอนเงิน', severity: 'info' }
      case 'credit':
        return { label: 'เครดิต', severity: 'warning' }
      default:
        return { label: method, severity: 'secondary' }
    }
  }

  return {
    onGetSales,
    onGetSalesDetail,
    onCreateSalesDetail,
    onUpdateSalesDetail,
    categoryTypes,
    sellers,
    sellingStatusOptions,
    getPaymentMethodTag,
    getStatusTag,
    paymentMethods,
  }
})

export type ICreateSalesPayload = {
  item: string // เลขรายการ
  status: SellingStatus // สถานะรายการ
  user: string // ผู้ซื้อ
  products: { id: string; quantity: number }[] // สินค้า
  deposit: number // มัดจำ
  discount: number // ส่วนลด
  seller: string // ผู้ขาย
  note: string // หมายเหตุ
}

export type IUpdateSalesPayload = {
  _id: string
  item: string // เลขรายการ
  status: SellingStatus // สถานะรายการ
  user: string // ผู้ซื้อ
  products: { id: string; quantity: number }[] // สินค้า
  deposit: number // มัดจำ
  discount: number // ส่วนลด
  seller: string // ผู้ขาย
  note: string // หมายเหตุ

  payment: 'cash' | 'transfer' | 'credit' | 'promptpay' | 'other'
  bankCode: string
  bankAccount: string

  cat: number
}

export type ISales = {
  _id: string
  item: string
  status: SellingStatus
  user: {
    _id: string
    displayName: string
    code: string
    name: string
    status: 'ci' | 'cs' | 'css'
    type: string
  }
  products: [
    {
      name: string
      price: number | null
      type: number
      category: string | null
      id: string
      quantity: number
    },
  ]
  deposit: number
  discount: number
  seller: string
  deliveryStatus: string
  note: string
  cat: number
  uat: number
  payment: 'cash' | 'transfer' | 'credit' | 'promptpay' | 'other'
  bankCode: string
  bankAccount: string
}

export type SellingStatus =
  | 'wait_product'
  | 'wait_confirm'
  | 'wait_payment'
  | 'paid_complete'
  | 'preparing'
  | 'shipping'
  | 'received'
  | 'damaged'
