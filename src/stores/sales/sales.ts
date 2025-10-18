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
    { label: 'สารปรับสภาพน้ำ', value: 'microorganism' },
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

  const sellingStatusOptions: { label: SellingLabel; value: SellingStatus }[] = [
    { label: 'ระหว่างจัดหา', value: 'wait_product' },
    { label: 'รอตัดสินใจ', value: 'wait_confirm' },
    { label: 'รอชำระเงิน', value: 'wait_payment' },
    { label: 'ชำระเงินเรียบร้อย', value: 'paid_complete' },
    { label: 'แพ็คจัดเตรียมสินค้า', value: 'preparing' },
    { label: 'ระหว่างขนส่ง', value: 'shipping' },
    { label: 'ได้รับสินค้าแล้ว', value: 'received' },
    { label: 'สินค้าเสียหาย', value: 'damaged' },
  ]

  const statusWorkflow: StatusWorkflow = {
    wait_product: {
      label: 'ระหว่างจัดหา',
      color: 'warning',
      icon: 'pi pi-clock',
      nextSteps: [
        'wait_confirm',
        'wait_payment',
        'paid_complete',
        'preparing',
        'shipping',
        'received',
        'damaged',
      ],
      description: 'กำลังจัดหาสินค้าตามที่ลูกค้าต้องการ',
      stepOrder: 1,
    },
    wait_confirm: {
      label: 'รอตัดสินใจ',
      color: 'info',
      icon: 'pi pi-check-circle',
      nextSteps: [
        'wait_payment',
        'paid_complete',
        'preparing',
        'shipping',
        'received',
        'damaged',
        'wait_product',
      ],
      description: 'รอการยืนยันรายการขาย',
      stepOrder: 2,
    },
    wait_payment: {
      label: 'รอชำระเงิน',
      color: 'warning',
      icon: 'pi pi-credit-card',
      nextSteps: ['paid_complete', 'preparing', 'shipping', 'received', 'damaged', 'wait_confirm'],
      description: 'รอการชำระเงินจากลูกค้า',
      stepOrder: 3,
    },
    paid_complete: {
      label: 'ชำระเงินเรียบร้อย',
      color: 'success',
      icon: 'pi pi-check',
      nextSteps: ['preparing', 'shipping', 'received', 'damaged'],
      description: 'การชำระเงินเสร็จสิ้นแล้ว',
      stepOrder: 4,
    },
    preparing: {
      label: 'แพ็คจัดเตรียมสินค้า',
      color: 'info',
      icon: 'pi pi-box',
      nextSteps: ['shipping', 'received', 'damaged'],
      description: 'กำลังแพ็คและเตรียมสินค้าสำหรับจัดส่ง',
      stepOrder: 5,
    },
    shipping: {
      label: 'ระหว่างขนส่ง',
      color: 'info',
      icon: 'pi pi-truck',
      nextSteps: ['received', 'damaged'],
      description: 'สินค้าอยู่ระหว่างการขนส่ง',
      stepOrder: 6,
    },
    received: {
      label: 'ได้รับสินค้าแล้ว',
      color: 'success',
      icon: 'pi pi-check-circle',
      nextSteps: [],
      description: 'ลูกค้าได้รับสินค้าเรียบร้อยแล้ว',
      stepOrder: 7,
    },
    damaged: {
      label: 'สินค้าเสียหาย',
      color: 'danger',
      icon: 'pi pi-times-circle',
      nextSteps: ['wait_product', 'wait_confirm', 'wait_payment'],
      description: 'สินค้าเสียหายระหว่างการขนส่ง',
      stepOrder: 8,
    },
  }

  const getStatusTag = (status: SellingStatus): { label: SellingLabel; severity: 'secondary' | 'info' | 'success' | 'warning' | 'danger' } => {
    switch (status) {
      case 'wait_product':
        return { label: 'ระหว่างจัดหา', severity: 'warning' }
      case 'wait_confirm':
        return { label: 'รอตัดสินใจ', severity: 'warning' }
      case 'wait_payment':
        return { label: 'รอชำระเงิน', severity: 'warning' }
      case 'paid_complete':
        return { label: 'ชำระเงินเรียบร้อย', severity: 'success' }
      case 'preparing':
        return { label: 'แพ็คจัดเตรียมสินค้า', severity: 'info' }
      case 'shipping':
        return { label: 'ระหว่างขนส่ง', severity: 'info' }
      case 'received':
        return { label: 'ได้รับสินค้าแล้ว', severity: 'success' }
      case 'damaged':
        return { label: 'สินค้าเสียหาย', severity: 'danger' }
      default:
        return { label: status, severity: 'info' }
    }
  }

  const getPaymentMethodTag = (method: string) => {
    switch (method) {
      case 'SCBA':
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
    getStatusTag,
    paymentMethods,
    statusWorkflow,
  }
})

export type ICreateSalesPayload = {
  item: string // เลขรายการ
  status: string // สถานะรายการ
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
  status: string // สถานะรายการ
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
  products: {
    name: string
    price: number | null
    type: number
    category: string | null
    id: string
    quantity: number
  }[]
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

export type StatusWorkflow = Record<
  SellingStatus,
  {
    label: SellingLabel
    color: 'secondary' | 'info' | 'success' | 'warning' | 'danger'
    icon: string
    nextSteps: SellingStatus[]
    description: string
    stepOrder: number
  }
>

export type SellingStatus =
  | 'wait_product'
  | 'wait_confirm'
  | 'wait_payment'
  | 'paid_complete'
  | 'preparing'
  | 'shipping'
  | 'received'
  | 'damaged'

export type SellingLabel =
  | 'ระหว่างจัดหา'
  | 'รอตัดสินใจ'
  | 'รอชำระเงิน'
  | 'ชำระเงินเรียบร้อย'
  | 'จัดเตรียมสินค้า'
  | 'แพ็คจัดเตรียมสินค้า'
  | 'ระหว่างขนส่ง'
  | 'ได้รับสินค้าแล้ว'
  | 'สินค้าเสียหาย'
