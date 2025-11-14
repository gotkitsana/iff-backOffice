import type { SellingStatus } from '@/types/sales'

export type ValidationMode = 'create' | 'edit' | 'status-change'

export type StatusValidationInput = {
  selectedStatus: SellingStatus
  hasProducts: boolean
  hasBankInfo: boolean
  hasSlip: boolean
  hasShippingSlip: boolean
  currentStatus?: SellingStatus
  mode: ValidationMode
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
  finalStatus: SellingStatus
  requiredFields: RequiredFields
}

/**
 * คำนวณ finalStatus ตามเงื่อนไขการอัพโหลดสลิปและใบเสร็จ
 */
export function calculateFinalStatus(
  selectedStatus: SellingStatus,
  hasSlip: boolean,
  hasShippingSlip: boolean,
): SellingStatus {
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
  currentStatus: SellingStatus,
): boolean {
  switch (currentStatus) {
    case 'wait_product':
      // แก้ไขสินค้าได้
      return field === 'products'

    case 'wait_confirm':
      // แก้ไขสินค้าได้
      return field === 'products'

    case 'wait_payment':
      // แก้ไขสินค้าและข้อมูลธนาคารได้
      return field === 'products' || field === 'bankInfo'

    case 'preparing':
      // แก้ไขสลิปได้
      return field === 'slip'

    case 'shipping':
      // แก้ไขใบเสร็จได้
      return field === 'shippingSlip'

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
  currentStatus: SellingStatus | undefined,
  mode: ValidationMode,
): SellingStatus[] {
  if (mode === 'create') {
    // สร้างรายการ: เลือกได้ step 1-5
    return ['wait_product', 'wait_confirm', 'wait_payment', 'preparing', 'shipping']
  }

  if (!currentStatus) {
    return []
  }

  if (mode === 'edit') {
    // แก้ไขรายการ: ขึ้นอยู่กับ currentStatus
    switch (currentStatus) {
      case 'wait_product':
        // เปลี่ยน step 2-5 ได้
        return ['wait_product', 'wait_confirm', 'wait_payment', 'preparing', 'shipping']
      case 'wait_confirm':
        // เปลี่ยน step 3-5 ได้
        return ['wait_confirm', 'wait_payment', 'preparing', 'shipping']
      case 'wait_payment':
        // เปลี่ยน step 4-5 ได้ (auto)
        return ['wait_payment', 'preparing', 'shipping']
      case 'preparing':
        // เปลี่ยน step 5 ได้ (auto)
        return ['preparing', 'shipping']
      case 'shipping':
        // เปลี่ยน step 6-7 ได้
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
      case 'wait_product':
        // เปลี่ยน step 2-5 ได้
        return ['wait_confirm', 'wait_payment', 'preparing', 'shipping']
      case 'wait_confirm':
        // เปลี่ยน step 3-5 ได้
        return ['wait_payment', 'preparing', 'shipping']
      case 'wait_payment':
        // เปลี่ยน step 4-5 ได้ (auto)
        return ['preparing', 'shipping']
      case 'preparing':
        // เปลี่ยน step 5 ได้ (auto)
        return ['shipping']
      case 'shipping':
        // เปลี่ยน step 6-7 ได้
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
    case 'wait_product':
      // ไม่บังคับสินค้า
      requiredFields.products = false
      requiredFields.bankInfo = false
      requiredFields.slip = false
      requiredFields.shippingSlip = false
      break

    case 'wait_confirm':
      // บังคับสินค้า
      requiredFields.products = true
      requiredFields.bankInfo = false
      requiredFields.slip = false
      requiredFields.shippingSlip = false
      if (!input.hasProducts) {
        errors.push('กรุณาเลือกสินค้า')
      }
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
    case 'wait_product':
      // แก้ไขสินค้าได้, เปลี่ยน step 2-5 ได้
      // ถ้าเลือก wait_product = ไม่เปลี่ยน status (แค่แก้ไขสินค้า)
      if (input.selectedStatus === 'wait_product') {
        // ไม่ต้องตรวจสอบอะไร เพียงแค่แก้ไขสินค้า
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

    case 'wait_confirm':
      // แก้ไขสินค้าได้, เปลี่ยน step 3-5 ได้
      if (input.selectedStatus === 'wait_confirm') {
        // ไม่เปลี่ยน status (แค่แก้ไขสินค้า)
        requiredFields.products = false
      } else {
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
    case 'wait_product':
      // เปลี่ยน step 2-5 ได้, ต้องเลือก step เอง
      if (input.selectedStatus === 'wait_confirm') {
        requiredFields.products = true
        if (!input.hasProducts) {
          errors.push('กรุณาเลือกสินค้า')
        }
      } else if (
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

    case 'wait_confirm':
      // เปลี่ยน step 3-5 ได้, ต้องเลือก step เอง
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
