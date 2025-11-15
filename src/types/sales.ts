export type PaymentMethod = 'order' | 'cash' | 'transfer' | 'card' | 'credit' | 'cod'

export type DeliveryStatus = 'received' | 'preparing'

export type ICreateSalesPayload = {
  item: string // เลขรายการ
  user: string // ผู้ซื้อ
  paymentMethod: PaymentMethod // วิธีชำระเงิน (บังคับ)
  products:
    | {
        id: string
        category: string
        price: number
        quantity: number
        retailID?: string
        name?: string
        unit?: string
      }[]
    | null // สินค้า
  deposit: number // มัดจำ
  discount: number // ส่วนลด
  seller: string // ผู้ขาย
  note: string // หมายเหตุ
  deliveryNo: number //ค่าจัดส่ง
  delivery?: string //หมายเลขการจัดส่ง
  // Fields สำหรับวิธีชำระเงินต่างๆ
  deliveryStatus?: DeliveryStatus // สำหรับเงินสด
  paymentDueDate?: Date | string // สำหรับเครดิต
  shippingAddress?: string // ที่อยู่จัดส่ง
  shippingProvince?: string // จังหวัดจัดส่ง
  customProducts?: Array<{ name: string; quantity: number; description: string }> // สำหรับออเดอร์
  // Fields สำหรับการชำระเงิน
  payment?: 'cash' | 'transfer' | 'credit' | 'promptpay' | 'other'
  bankCode?: string
  bankAccount?: string
}

export type IUpdateSalesPayload = {
  _id: string
  item: string // เลขรายการ
  status: string // สถานะรายการ
  user: string // ผู้ซื้อ
  paymentMethod?: PaymentMethod // วิธีชำระเงิน
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

  // Fields สำหรับวิธีชำระเงินต่างๆ
  deliveryStatus?: DeliveryStatus // สำหรับเงินสด
  paymentDueDate?: Date | string // สำหรับเครดิต
  shippingAddress?: string // ที่อยู่จัดส่ง
  shippingProvince?: string // จังหวัดจัดส่ง
  customProducts?: Array<{ name: string; quantity: number; description: string }> // สำหรับออเดอร์

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
  paymentMethod?: PaymentMethod // วิธีชำระเงิน
  bankCode: string
  bankAccount: string
  deliveryNo: number
  delivery?: string
  // Fields สำหรับวิธีชำระเงินต่างๆ
  deliveryStatusForCash?: DeliveryStatus // สำหรับเงินสด
  paymentDueDate?: Date | string // สำหรับเครดิต
  shippingAddress?: string // ที่อยู่จัดส่ง
  shippingProvince?: string // จังหวัดจัดส่ง
  customProducts?: Array<{ name: string; quantity: number; description: string }> // สำหรับออเดอร์
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
  | 'order' // 1 ออเดอร์
  | 'wait_payment' // 2 รอชำระเงิน
  | 'preparing' // 3 แพ็ครอจัดส่ง
  | 'shipping' // 4 ระหว่างขนส่ง
  | 'received' // 5 ได้รับสินค้าแล้ว
  | 'damaged' // 6 สินค้าเสียหาย

export type SellingLabel =
  | 'ออเดอร์'
  | 'รอชำระเงิน'
  | 'แพ็ครอจัดส่ง'
  | 'ระหว่างขนส่ง'
  | 'ได้รับสินค้าแล้ว'
  | 'สินค้าเสียหาย'
