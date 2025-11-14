export type ICreateSalesPayload = {
  item: string // เลขรายการ
  status: string // สถานะรายการ
  user: string // ผู้ซื้อ
  products: {
    id: string
    category: string
    price: number
    quantity: number
    retailID?: string
    name?: string
    unit?: string
  }[] | null // สินค้า
  deposit: number // มัดจำ
  discount: number // ส่วนลด
  seller: string // ผู้ขาย
  note: string // หมายเหตุ
  deliveryNo: number //ค่าจัดส่ง
  delivery?: string //หมายเลขการจัดส่ง
}

export type IUpdateSalesPayload = {
  _id: string
  item: string // เลขรายการ
  status: string // สถานะรายการ
  user: string // ผู้ซื้อ
  products: {
    id: string
    category: string
    price: number
    quantity: number
    retailID?: string
    name?: string
    unit?: string
  }[] // สินค้า
  deposit: number // มัดจำ
  discount: number // ส่วนลด
  seller: string // ผู้ขาย
  note: string // หมายเหตุ

  deliveryNo: number //ค่าจัดส่ง
  delivery?: string //หมายเลขการจัดส่ง

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
    retailID?: string
    unit?: string
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
  deliveryNo: number
  delivery?: string
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
  | 'wait_product' // 1 ระหว่างจัดหา
  | 'wait_confirm' // 2 รอตัดสินใจ
  | 'wait_payment' // 3 รอชำระเงิน
  | 'preparing' // 4 แพ็คจัดเตรียมสินค้า
  | 'shipping' // 5 ระหว่างขนส่ง
  | 'received' // 6 ได้รับสินค้าแล้ว
  | 'damaged' // 7 สินค้าเสียหาย

export type SellingLabel =
  | 'ระหว่างจัดหา'
  | 'รอตัดสินใจ'
  | 'รอชำระเงิน'
  | 'แพ็คจัดเตรียมสินค้า'
  | 'ระหว่างขนส่ง'
  | 'ได้รับสินค้าแล้ว'
  | 'สินค้าเสียหาย'
