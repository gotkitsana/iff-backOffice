export type PaymentMethod = 'order' | 'cash' | 'transfer' | 'card' | 'credit' | 'cod' | null

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

  sellingStatus: SellingStatus
  deliveryNo: number //ค่าจัดส่ง
  delivery?: string //หมายเลขการจัดส่ง
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

  sellingStatus: SellingStatus
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
  sellingStatus: SellingStatus
  user: string // id
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
  seller: string // id
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
  deliveryStatus?: DeliveryStatus // สำหรับเงินสด
  paymentDueDate?: Date | string // สำหรับเครดิต
  shippingAddress?: string // ที่อยู่จัดส่ง
  shippingProvince?: string // จังหวัดจัดส่ง
  customProducts?: Array<{ name: string; quantity: number; description: string }> // สำหรับออเดอร์
}

export type StatusWorkflow = Record<
  SellingStatusString,
  {
    label: SellingLabel
    color: 'secondary' | 'info' | 'success' | 'warning' | 'danger'
    icon: string
    nextSteps: SellingStatusString[]
    description: string
    stepOrder: number
  }
>

// export type SellingStatus =
//   | 'order' // 1 ออเดอร์
//   | 'wait_payment' // 2 รอชำระเงิน
//   | 'preparing' // 3 แพ็ครอจัดส่ง
//   | 'shipping' // 4 ระหว่างขนส่ง
//   | 'received' // 5 ได้รับสินค้าแล้ว
//   | 'damaged' // 6 สินค้าเสียหาย

export enum SellingStatus {
  none = 0,
  order = 1,
  wait_payment = 2,
  preparing = 3,
  shipping = 4,
  received = 5,
  damaged = 6,
}

// Type alias สำหรับ string status เพื่อใช้ใน frontend (สำหรับการแสดงผล)
export type SellingStatusString =
  | 'none'
  | 'order'
  | 'wait_payment'
  | 'preparing'
  | 'shipping'
  | 'received'
  | 'damaged'

// Helper functions สำหรับแปลงค่าระหว่าง string และ number
export function convertStatusStringToNumber(status: string): SellingStatus {
  const statusMap: Record<string, SellingStatus> = {
    none: SellingStatus.none,
    order: SellingStatus.order,
    wait_payment: SellingStatus.wait_payment,
    preparing: SellingStatus.preparing,
    shipping: SellingStatus.shipping,
    received: SellingStatus.received,
    damaged: SellingStatus.damaged,
  }
  return statusMap[status] ?? SellingStatus.none
}

export function convertStatusNumberToString(status: number): SellingStatusString {
  const statusMap: Record<number, SellingStatusString> = {
    [SellingStatus.none]: 'none',
    [SellingStatus.order]: 'order',
    [SellingStatus.wait_payment]: 'wait_payment',
    [SellingStatus.preparing]: 'preparing',
    [SellingStatus.shipping]: 'shipping',
    [SellingStatus.received]: 'received',
    [SellingStatus.damaged]: 'damaged',
  }
  return statusMap[status] ?? 'none'
}

export type SellingLabel =
  | 'ไม่ระบุ'
  | 'ออเดอร์'
  | 'รอชำระเงิน'
  | 'แพ็ครอจัดส่ง'
  | 'ระหว่างขนส่ง'
  | 'ได้รับสินค้าแล้ว'
  | 'สินค้าเสียหาย'
