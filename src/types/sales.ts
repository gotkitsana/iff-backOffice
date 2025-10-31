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

  payment?: 'cash' | 'transfer' | 'credit' | 'promptpay' | 'other'
  bankCode?: string
  bankAccount?: string

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
    name?: string
    price?: number | null
    type?: number
    category?: string | null
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



