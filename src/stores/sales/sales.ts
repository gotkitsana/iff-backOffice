import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useSalesStore = defineStore('sales', () => {
  async function onGetSales() {
    const { data } = await api.get(`/sales`)
    return data.data
  }

  const productCategories = [
    { label: 'ขายสินค้า', value: 'sell' },
    { label: 'บริการ', value: 'service' },
  ]

  const productTypes = [
    { label: 'สารปรับสภาพน้ำ', value: 'water' },
    { label: 'ปลา', value: 'fish' },
    { label: 'เวชภัณฑ์', value: 'medicine' },
    { label: 'บริการ', value: 'service' },
    { label: 'อาหาร', value: 'food' },
  ]

  const paymentMethods = [
    { label: 'SCB', value: 'SCB' },
    { label: 'KBANK', value: 'KBANK' },
    { label: 'BBL', value: 'BBL' },
  ]

  const sellers = [
    { label: 'Bert', value: 'Bert' },
    { label: 'Little', value: 'Little' },
    { label: 'Sale01', value: 'Sale01' },
    { label: 'Sale02', value: 'Sale02' },
  ]

  const sellingStatusOptions = [
    { label: 'รอจัดหา', value: 'wait_product' },
    { label: 'รอยืนยัน', value: 'wait_confirm' },
    { label: 'รอชำระเงิน', value: 'wait_payment' },
    { label: 'ชำระเงินเรียบร้อย', value: 'paid_complete' },
    { label: 'แพ็คเตรียมสินค้ารอจัดส่ง', value: 'pack_and_ship' },
    { label: 'อยู่ระหว่างขนส่ง', value: 'shipping' },
    { label: 'ได้รับสินค้าเรียบร้อย', value: 'received' },
    { label: 'สินค้าเสียหาย', value: 'damaged' },
  ]

  return {
    onGetSales,

    productCategories,
    productTypes,
    paymentMethods,
    sellers,
    sellingStatusOptions,
  }
})

export type IContentPayload = {
  content: string
}

export type IAuctionPayload = {
  productId: string
  biddingTime: number
  startDate: number
  endDate: number
  minBid: number
}

export type IUpdateAuctionPayload = {
  _id: string
  name: string
  cat: number
  type: number
}
