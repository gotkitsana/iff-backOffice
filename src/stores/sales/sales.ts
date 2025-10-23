import { defineStore } from 'pinia'
import api from '@/utils/axios'
import type {
  ICreateSalesPayload,
  IUpdateSalesPayload,
  SellingLabel,
  SellingStatus,
  StatusWorkflow,
} from '@/types/sales'
import type { ICategoryLabel } from '../product/category'

export const useSalesStore = defineStore('sales', () => {
  async function onGetSales() {
    const { data } = await api.get(`/sale`)
    return data.data
  }

  async function onGetSalesDetail(id: string) {
    const { data } = await api.get(`/sale?id=${id}`)
    return data.data
  }

  async function onCreateSales(payload: ICreateSalesPayload) {
    const { data } = await api.post(`/sale`, payload)
    return data
  }

  async function onUpdateSales(payload: IUpdateSalesPayload) {
    const { data } = await api.put(`/sale`, payload)
    return data
  }

  async function onDeleteSales(id: string) {
    const { data } = await api.delete(`/sale?id=${id}`)
    return data
  }

  async function onUploadSlip(id: string, slip: File) {
    const formData = new FormData()
    formData.append('imageFile', slip)

    const { data } = await api.post(`/sale/slip?saleId=${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }

  const paymentMethods = [
    { label: 'เงินสด', value: 'cash' },
    { label: 'โอน', value: 'transfer' },
    { label: 'บัตรเครดิต', value: 'credit' },
    { label: 'QR PromptPay', value: 'promptpay' },
    { label: 'อื่นๆ', value: 'other' },
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

  const getStatusTag = (
    status: SellingStatus,
  ): { label: SellingLabel; severity: 'secondary' | 'info' | 'success' | 'warning' | 'danger' } => {
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

  const getCategoryColor = (category: string | null) => {
    const colorMap: { label: ICategoryLabel; value: string }[] = [
      { label: 'ปลา', value: 'text-gray-600' },
      { label: 'สารปรับสภาพน้ำ', value: 'text-green-600' },
      { label: 'คอนสทรัคชั่น', value: 'text-purple-600' },
      { label: 'บริการ', value: 'text-orange-600' },
      { label: 'อาหาร', value: 'text-pink-600' },
      { label: 'เวชภัณฑ์', value: 'text-red-600' },
      { label: 'อุปกรณ์', value: 'text-teal-600' },
    ]
    return colorMap.find((c) => c.label === category)?.value || 'text-gray-600'
  }

  const getCategoryBgColor = (category: string | null) => {
    const bgColorMap: { label: ICategoryLabel; value: string }[] = [
      { label: 'ปลา', value: 'bg-gray-50' },
      { label: 'อุปกรณ์', value: 'bg-green-50' },
      { label: 'บริการ', value: 'bg-purple-50' },
      { label: 'คอนสทรัคชั่น', value: 'bg-orange-50' },
      { label: 'อาหาร', value: 'bg-pink-50' },
      { label: 'เวชภัณฑ์', value: 'bg-red-50' },
      { label: 'สารปรับสภาพน้ำ', value: 'bg-teal-50' },
    ]
    return bgColorMap.find((c) => c.label === category)?.value || 'bg-gray-50'
  }

  const getCategoryBgIcon = (category: string | null) => {
    const bgColorMap: { label: ICategoryLabel; value: string }[] = [
      { label: 'ปลา', value: 'bg-gray-100' },
      { label: 'อุปกรณ์', value: 'bg-green-100' },
      { label: 'บริการ', value: 'bg-purple-100' },
      { label: 'คอนสทรัคชั่น', value: 'bg-orange-100' },
      { label: 'อาหาร', value: 'bg-pink-100' },
      { label: 'เวชภัณฑ์', value: 'bg-red-100' },
      { label: 'สารปรับสภาพน้ำ', value: 'bg-teal-100' },
    ]
    return bgColorMap.find((c) => c.label === category)?.value || 'bg-gray-100'
  }

  const getCategoryBorderColor = (category: string | null) => {
    const borderColorMap: { label: ICategoryLabel; value: string }[] = [
      { label: 'ปลา', value: 'border-gray-200' },
      { label: 'อุปกรณ์', value: 'border-green-200' },
      { label: 'บริการ', value: 'border-purple-200' },
      { label: 'คอนสทรัคชั่น', value: 'border-orange-200' },
      { label: 'อาหาร', value: 'border-pink-200' },
      { label: 'เวชภัณฑ์', value: 'border-red-200' },
      { label: 'สารปรับสภาพน้ำ', value: 'border-teal-200' },
    ]
    return borderColorMap.find((c) => c.label === category)?.value || 'border-gray-200'
  }

  const getCategoryIcon = (category: string | null) => {
    const iconMap: { label: ICategoryLabel; value: string }[] = [
      { label: 'ปลา', value: 'pi-fish' },
      { label: 'อุปกรณ์', value: 'pi-box' },
      { label: 'บริการ', value: 'pi-wrench' },
      { label: 'คอนสทรัคชั่น', value: 'pi-building' },
      { label: 'อาหาร', value: 'pi-heart' },
      { label: 'เวชภัณฑ์', value: 'pi-plus-circle' },
      { label: 'สารปรับสภาพน้ำ', value: 'pi-circle' },
    ]
    return iconMap.find((c) => c.label === category)?.value || 'pi-box'
  }

  return {
    onGetSales,
    onGetSalesDetail,
    onCreateSales,
    onUpdateSales,
    onDeleteSales,
    sellers,
    sellingStatusOptions,
    getStatusTag,
    paymentMethods,
    statusWorkflow,
    getCategoryColor,
    getCategoryBgColor,
    getCategoryBgIcon,
    getCategoryBorderColor,
    getCategoryIcon,
    onUploadSlip,
  }
})
