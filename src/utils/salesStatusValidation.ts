import type { SellingStatusString, PaymentMethod, DeliveryStatus } from '@/types/sales'

export type ValidationMode = 'create' | 'edit' | 'status-change'

export type StatusValidationInput = {
  selectedStatus: SellingStatusString
  hasProducts: boolean
  hasBankInfo: boolean
  hasSlip: boolean
  hasShippingSlip: boolean
  currentStatus?: SellingStatusString
  mode: ValidationMode
}

export type PaymentMethodValidationInput = {
  paymentMethod: PaymentMethod
  hasProducts: boolean
  hasBankInfo: boolean
  hasSlip: boolean
  hasShippingSlip: boolean
  hasShippingAddress: boolean
  deliveryStatus?: DeliveryStatus
  hasPaymentDueDate?: boolean
  hasCustomProducts?: boolean
  mode?: 'add' | 'edit'
}

export type RequiredFields = {
  products: boolean
  bankInfo: boolean
  slip: boolean
  shippingSlip: boolean
}

export type StatusValidationResult = {
  isValid: boolean
  errors: string[]
  finalStatus: SellingStatusString
  requiredFields: RequiredFields
}

/**
 * คำนวณ finalStatus ตามเงื่อนไขการอัพโหลดสลิปและใบเสร็จ
 */
export function calculateFinalStatus(
  selectedStatus: SellingStatusString,
  hasSlip: boolean,
  hasShippingSlip: boolean,
): SellingStatusString {
  // wait_payment: ถ้าอัพสลิปแล้ว -> preparing, ถ้าอัพสลิป+ใบขนส่ง -> shipping
  if (selectedStatus === 'wait_payment') {
    if (hasSlip && hasShippingSlip) {
      return 'shipping'
    }
    if (hasSlip) {
      return 'preparing'
    }
    return 'wait_payment'
  }

  // preparing: ถ้าอัพใบขนส่งแล้ว -> shipping
  if (selectedStatus === 'preparing') {
    if (hasShippingSlip) {
      return 'shipping'
    }
    return 'preparing'
  }

  // shipping: ใช้ status ที่เลือก
  if (selectedStatus === 'shipping') {
    return 'shipping'
  }

  // อื่นๆ: ใช้ status ที่เลือก
  return selectedStatus
}

/**
 * ตรวจสอบว่าสามารถแก้ไข field นี้ได้หรือไม่ตาม currentStatus
 */
export function canEditField(
  field: 'products' | 'bankInfo' | 'slip' | 'shippingSlip',
  currentStatus: SellingStatusString,
): boolean {
  switch (currentStatus) {
    case 'order':
      // แก้ไขสินค้าและข้อมูลธนาคารได้ (สำหรับกรณี order ที่มีสินค้าแล้ว)
      return field === 'products' || field === 'bankInfo'

    case 'wait_payment':
      // แก้ไขสินค้า, ข้อมูลธนาคาร, และสลิปได้ (สำหรับอัพโหลดสลิปโอนเงิน)
      return field === 'products' || field === 'bankInfo' || field === 'slip'

    case 'preparing':
      // แก้ไขใบเสร็จการขนส่งได้
      return field === 'shippingSlip'

    case 'shipping':
      // ให้เลือกจบการขาย อาจจะมีให้อัพโหลดรูปจากขนส่ง


    case 'received':
    case 'damaged':
      // ไม่สามารถแก้ไขอะไรได้
      return false

    default:
      return false
  }
}

/**
 * คืนค่า status ที่สามารถเลือกได้ตาม currentStatus และ mode
 */
export function getAvailableStatuses(
  currentStatus: SellingStatusString | undefined,
  mode: ValidationMode,
): SellingStatusString[] {
  if (mode === 'create') {
    // สร้างรายการ: เลือกได้ step 1-5 (ใช้ payment method แทน)
    return ['order', 'wait_payment', 'preparing', 'shipping']
  }

  if (!currentStatus) {
    return []
  }

  if (mode === 'edit') {
    // แก้ไขรายการ: ขึ้นอยู่กับ currentStatus
    switch (currentStatus) {
      case 'order':
        // เปลี่ยน step 2-5 ได้
        return ['order', 'wait_payment', 'preparing', 'shipping']
      case 'wait_payment':
        // เปลี่ยน step 3-4 ได้ (auto)
        return ['wait_payment', 'preparing', 'shipping']
      case 'preparing':
        // เปลี่ยน step 4 ได้ (auto)
        return ['preparing', 'shipping']
      case 'shipping':
        // เปลี่ยน step 5-6 ได้
        return ['shipping', 'received', 'damaged']
      case 'received':
      case 'damaged':
        // ไม่สามารถเปลี่ยนได้
        return [currentStatus]
      default:
        return []
    }
  }

  if (mode === 'status-change') {
    // เปลี่ยนขั้นตอน: ขึ้นอยู่กับ currentStatus
    switch (currentStatus) {
      case 'order':
        // เปลี่ยน step 2-4 ได้
        return ['wait_payment', 'preparing', 'shipping']
      case 'wait_payment':
        // เปลี่ยน step 3-4 ได้ (auto)
        return ['preparing', 'shipping']
      case 'preparing':
        // เปลี่ยน step 4 ได้ (auto)
        return ['shipping']
      case 'shipping':
        // เปลี่ยน step 5-6 ได้
        return ['received', 'damaged']
      case 'received':
      case 'damaged':
        // ไม่สามารถเปลี่ยนได้
        return []

      default:
        return []
    }
  }

  return []
}

/**
 * Validation สำหรับหน้าสร้างรายการขาย
 */
export function validateStatusForCreate(input: StatusValidationInput): StatusValidationResult {
  const errors: string[] = []
  const requiredFields: RequiredFields = {
    products: false,
    bankInfo: false,
    slip: false,
    shippingSlip: false,
  }

  // ตรวจสอบเงื่อนไขตาม selectedStatus
  switch (input.selectedStatus) {
    case 'order':
      // ไม่บังคับสินค้า
      requiredFields.products = false
      requiredFields.bankInfo = false
      requiredFields.slip = false
      requiredFields.shippingSlip = false
      break

    case 'wait_payment':
      // บังคับสินค้า + ธนาคาร, ไม่บังคับสลิป/ใบเสร็จ
      requiredFields.products = true
      requiredFields.bankInfo = true
      requiredFields.slip = false
      requiredFields.shippingSlip = false
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
      if (!input.hasBankInfo) {
        errors.push('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
      }
      break

    case 'preparing':
      // บังคับสินค้า + ธนาคาร + สลิป, ไม่บังคับใบเสร็จ
      requiredFields.products = true
      requiredFields.bankInfo = true
      requiredFields.slip = true
      requiredFields.shippingSlip = false
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
      if (!input.hasBankInfo) {
        errors.push('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
      }
      if (!input.hasSlip) {
        errors.push('กรุณาอัปโหลดสลิปการโอนเงิน')
      }
      break

    case 'shipping':
      // บังคับสินค้า + ธนาคาร + สลิป + ใบเสร็จ
      requiredFields.products = true
      requiredFields.bankInfo = true
      requiredFields.slip = true
      requiredFields.shippingSlip = true
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
      if (!input.hasBankInfo) {
        errors.push('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
      }
      if (!input.hasSlip) {
        errors.push('กรุณาอัปโหลดสลิปการโอนเงิน')
      }
      if (!input.hasShippingSlip) {
        errors.push('กรุณาอัปโหลดใบเสร็จการขนส่ง')
      }
      break

    default:
      errors.push('สถานะไม่ถูกต้อง')
  }

  // คำนวณ finalStatus
  const finalStatus = calculateFinalStatus(
    input.selectedStatus,
    input.hasSlip,
    input.hasShippingSlip,
  )

  return {
    isValid: errors.length === 0,
    errors,
    finalStatus,
    requiredFields,
  }
}

/**
 * Validation สำหรับหน้าแก้ไขรายการขาย
 */
export function validateStatusForEdit(input: StatusValidationInput): StatusValidationResult {
  const errors: string[] = []
  const requiredFields: RequiredFields = {
    products: false,
    bankInfo: false,
    slip: false,
    shippingSlip: false,
  }

  if (!input.currentStatus) {
    return {
      isValid: false,
      errors: ['ไม่พบสถานะปัจจุบัน'],
      finalStatus: input.selectedStatus,
      requiredFields,
    }
  }

  // ตรวจสอบว่า currentStatus อนุญาตให้เปลี่ยนไปยัง selectedStatus ได้หรือไม่
  const availableStatuses = getAvailableStatuses(input.currentStatus, 'edit')
  if (!availableStatuses.includes(input.selectedStatus)) {
    errors.push(`ไม่สามารถเปลี่ยนสถานะจาก ${input.currentStatus} ไปยัง ${input.selectedStatus} ได้`)
  }

  // ตรวจสอบเงื่อนไขการแก้ไขข้อมูลตาม currentStatus
  switch (input.currentStatus) {
    case 'order':
      // แก้ไขสินค้าได้, เปลี่ยน step 2-4 ได้
      if (input.selectedStatus === 'order') {
        // ไม่เปลี่ยน status (แค่แก้ไขสินค้า)
        requiredFields.products = false
      } else {
        // เปลี่ยน status ต้องตรวจสอบเงื่อนไขของ status ใหม่
        const createValidation = validateStatusForCreate({
          ...input,
          mode: 'create',
        })
        errors.push(...createValidation.errors)
        requiredFields.products = createValidation.requiredFields.products
        requiredFields.bankInfo = createValidation.requiredFields.bankInfo
        requiredFields.slip = createValidation.requiredFields.slip
        requiredFields.shippingSlip = createValidation.requiredFields.shippingSlip
      }
      break

    case 'wait_payment':
      // แก้ไขสินค้า+ธนาคารได้, เปลี่ยน step 4-5 ได้ (auto)
      if (input.selectedStatus === 'wait_payment') {
        // ไม่เปลี่ยน status (แค่แก้ไขสินค้าหรือข้อมูลธนาคาร)
        requiredFields.products = false
        requiredFields.bankInfo = false
      } else {
        // เปลี่ยน status (auto ตามเงื่อนไข)
        const createValidation = validateStatusForCreate({
          ...input,
          mode: 'create',
        })
        errors.push(...createValidation.errors)
        requiredFields.products = createValidation.requiredFields.products
        requiredFields.bankInfo = createValidation.requiredFields.bankInfo
        requiredFields.slip = createValidation.requiredFields.slip
        requiredFields.shippingSlip = createValidation.requiredFields.shippingSlip
      }
      break

    case 'preparing':
      // แก้ไขสลิปได้, เปลี่ยน step 5 ได้ (auto)
      if (input.selectedStatus === 'preparing') {
        // ไม่เปลี่ยน status (แค่แก้ไขสลิป)
        requiredFields.slip = false
      } else {
        // เปลี่ยน status (auto ตามเงื่อนไข)
        const createValidation = validateStatusForCreate({
          ...input,
          mode: 'create',
        })
        errors.push(...createValidation.errors)
        requiredFields.products = createValidation.requiredFields.products
        requiredFields.bankInfo = createValidation.requiredFields.bankInfo
        requiredFields.slip = createValidation.requiredFields.slip
        requiredFields.shippingSlip = createValidation.requiredFields.shippingSlip
      }
      break

    case 'shipping':
      // แก้ไขใบเสร็จได้, เปลี่ยน step 6-7 ได้
      if (input.selectedStatus === 'shipping') {
        // ไม่เปลี่ยน status (แค่แก้ไขใบเสร็จ)
        requiredFields.shippingSlip = false
      } else if (input.selectedStatus === 'received' || input.selectedStatus === 'damaged') {
        // เปลี่ยนเป็น received หรือ damaged (ไม่บังคับ)
        requiredFields.products = false
        requiredFields.bankInfo = false
        requiredFields.slip = false
        requiredFields.shippingSlip = false
      }
      break

    case 'received':
    case 'damaged':
      // ไม่สามารถแก้ไขหรือเปลี่ยน status ได้
      errors.push('ไม่สามารถแก้ไขรายการที่เสร็จสิ้นแล้วได้')
      break
  }

  // คำนวณ finalStatus
  const finalStatus = calculateFinalStatus(
    input.selectedStatus,
    input.hasSlip,
    input.hasShippingSlip,
  )

  return {
    isValid: errors.length === 0,
    errors,
    finalStatus,
    requiredFields,
  }
}

/**
 * Validation สำหรับหน้าเปลี่ยนขั้นตอนการขาย
 */
export function validateStatusForStatusChange(
  input: StatusValidationInput,
): StatusValidationResult {
  const errors: string[] = []
  const requiredFields: RequiredFields = {
    products: false,
    bankInfo: false,
    slip: false,
    shippingSlip: false,
  }

  if (!input.currentStatus) {
    return {
      isValid: false,
      errors: ['ไม่พบสถานะปัจจุบัน'],
      finalStatus: input.selectedStatus,
      requiredFields,
    }
  }

  // ตรวจสอบว่า currentStatus อนุญาตให้เปลี่ยนไปยัง selectedStatus ได้หรือไม่
  const availableStatuses = getAvailableStatuses(input.currentStatus, 'status-change')
  if (!availableStatuses.includes(input.selectedStatus)) {
    errors.push(`ไม่สามารถเปลี่ยนสถานะจาก ${input.currentStatus} ไปยัง ${input.selectedStatus} ได้`)
  }

  // ตรวจสอบเงื่อนไขตาม currentStatus
  switch (input.currentStatus) {
    case 'order':
      // เปลี่ยน step 2-4 ได้
      if (
        input.selectedStatus === 'wait_payment' ||
        input.selectedStatus === 'preparing' ||
        input.selectedStatus === 'shipping'
      ) {
        const createValidation = validateStatusForCreate({
          ...input,
          mode: 'create',
        })
        errors.push(...createValidation.errors)
        requiredFields.products = createValidation.requiredFields.products
        requiredFields.bankInfo = createValidation.requiredFields.bankInfo
        requiredFields.slip = createValidation.requiredFields.slip
        requiredFields.shippingSlip = createValidation.requiredFields.shippingSlip
      }
      break

    case 'wait_payment':
      // เปลี่ยน step 4-5 ได้, เลือก step เองไม่ได้แล้ว (auto)
      if (input.selectedStatus === 'preparing') {
        requiredFields.products = true
        requiredFields.bankInfo = true
        requiredFields.slip = true
        requiredFields.shippingSlip = false
        if (!input.hasProducts) {
          errors.push('กรุณาเลือกสินค้า')
        }
        if (!input.hasBankInfo) {
          errors.push('กรุณาเลือกบัญชีธนาคาร')
        }
        if (!input.hasSlip) {
          errors.push('กรุณาอัปโหลดสลิปการโอนเงิน (บังคับ)')
        }
      } else if (input.selectedStatus === 'shipping') {
        requiredFields.products = true
        requiredFields.bankInfo = true
        requiredFields.slip = true
        requiredFields.shippingSlip = true
        if (!input.hasProducts) {
          errors.push('กรุณาเลือกสินค้า')
        }
        if (!input.hasBankInfo) {
          errors.push('กรุณาเลือกบัญชีธนาคาร')
        }
        if (!input.hasSlip) {
          errors.push('กรุณาอัปโหลดสลิปการโอนเงิน (บังคับ)')
        }
        if (!input.hasShippingSlip) {
          errors.push('กรุณาอัปโหลดใบเสร็จการขนส่ง (บังคับ)')
        }
      }
      break

    case 'preparing':
      // เปลี่ยน step 5 ได้, เลือก step เองไม่ได้แล้ว (auto)
      if (input.selectedStatus === 'shipping') {
        requiredFields.shippingSlip = true
        if (!input.hasShippingSlip) {
          errors.push('กรุณาอัปโหลดใบเสร็จการขนส่ง (บังคับ)')
        }
      }
      break

    case 'shipping':
      // เปลี่ยน step 6-7 ได้, ไม่บังคับ
      if (input.selectedStatus === 'received' || input.selectedStatus === 'damaged') {
        // ไม่บังคับอะไร
        requiredFields.products = false
        requiredFields.bankInfo = false
        requiredFields.slip = false
        requiredFields.shippingSlip = false
      }
      break

    case 'received':
    case 'damaged':
      // ไม่สามารถเปลี่ยนได้
      errors.push('ไม่สามารถเปลี่ยนสถานะจากรายการที่เสร็จสิ้นแล้วได้')
      break
  }

  // คำนวณ finalStatus
  const finalStatus = calculateFinalStatus(
    input.selectedStatus,
    input.hasSlip,
    input.hasShippingSlip,
  )

  return {
    isValid: errors.length === 0,
    errors,
    finalStatus,
    requiredFields,
  }
}

/**
 * Validation สำหรับ payment method ใหม่
 */
export function validatePaymentMethod(input: PaymentMethodValidationInput): {
  isValid: boolean
  errors: string[]
  requiredFields: {
    products: boolean
    bankInfo: boolean
    slip: boolean
    shippingSlip: boolean
    shippingAddress: boolean
    paymentDueDate: boolean
    customProducts: boolean
  }
} {
  const errors: string[] = []
  const requiredFields = {
    products: false,
    bankInfo: false,
    slip: false,
    shippingSlip: false,
    shippingAddress: false,
    paymentDueDate: false,
    customProducts: false,
  }

  switch (input.paymentMethod) {
    case 'order':
      // ออเดอร์:
      // - Add mode: ไม่บังคับอะไร (แค่ลงข้อมูลนอกเหนือจากที่ขาย บันทึก สถานะรายการ = order)
      // - Edit mode: ถ้ามีสินค้าแล้ว ให้บังคับ bankInfo และ shippingAddress
      if (input.mode === 'edit' && input.hasProducts) {
        requiredFields.bankInfo = true
        requiredFields.shippingAddress = true
        if (!input.hasBankInfo) {
          errors.push('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
        }
        if (!input.hasShippingAddress) {
          errors.push('กรุณาเลือกที่อยู่จัดส่ง')
        }
      }
      // Add mode หรือไม่มี mode: ไม่บังคับอะไร
      break

    case 'cash':
      // เงินสด: บังคับสินค้า, deliveryStatus
      requiredFields.products = true
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
      if (!input.deliveryStatus) {
        errors.push('กรุณาเลือกสถานะการส่ง')
      }
      // ถ้าเลือก "แพ็ครอจัดส่ง" ต้องเลือกที่อยู่
      if (input.deliveryStatus === 'preparing' && !input.hasShippingAddress) {
        requiredFields.shippingAddress = true
        errors.push('กรุณาเลือกที่อยู่จัดส่ง')
      }
      break

    case 'credit':
      // เครดิต: บังคับสินค้า, paymentDueDate, shippingAddress
      requiredFields.products = true
      requiredFields.paymentDueDate = true
      requiredFields.shippingAddress = true
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
      if (!input.hasPaymentDueDate) {
        errors.push('กรุณาระบุวันชำระเงิน')
      }
      if (!input.hasShippingAddress) {
        errors.push('กรุณาเลือกที่อยู่จัดส่ง')
      }
      break

    case 'transfer':
    case 'card':
      // โอน/บัตร: บังคับสินค้า, bankInfo, shippingAddress
      requiredFields.products = true
      requiredFields.bankInfo = true
      requiredFields.shippingAddress = true
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
      if (!input.hasBankInfo) {
        errors.push('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
      }
      if (!input.hasShippingAddress) {
        errors.push('กรุณาเลือกที่อยู่จัดส่ง')
      }
      break

    case 'cod':
      // ปลายทาง: บังคับสินค้า, shippingAddress
      requiredFields.products = true
      requiredFields.shippingAddress = true
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
      if (!input.hasShippingAddress) {
        errors.push('กรุณาเลือกที่อยู่จัดส่ง')
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
    requiredFields,
  }
}
