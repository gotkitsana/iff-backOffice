import { computed, type Ref, type ComputedRef } from 'vue'
import { useSalesStore } from '@/stores/sales/sales'
import type { SellingStatusString } from '@/types/sales'
import { convertStatusNumberToString } from '@/types/sales'

export interface UseSalesVisibilityOptions {
  paymentMethod?: Ref<string | undefined>
  deliveryStatus?: Ref<string | undefined>
  currentStatusString?: Ref<string>
  products?: Ref<Array<{ id: string; quantity: number }>>
  getStatusStepIndex?: (status: string | number) => number
}

export function useSalesVisibility(options: UseSalesVisibilityOptions) {
  const { paymentMethod, deliveryStatus, currentStatusString, products, getStatusStepIndex } =
    options

  const salesStore = useSalesStore()

  // Helper function for status step index
  const defaultGetStatusStepIndex = (status: string | number) => {
    const statusString = typeof status === 'number' ? convertStatusNumberToString(status) : status
    return salesStore.sellingStatusOptions.findIndex((option) => option.value === statusString)
  }

  const statusStepIndexFn = getStatusStepIndex || defaultGetStatusStepIndex

  // Computed for showing slip upload
  const showSlipUpload = computed(() => {
    const pm = paymentMethod?.value
    const statusStr = currentStatusString?.value

    if (!pm || !statusStr) return false

    // สำหรับ cash: ซ่อนเมื่อ deliveryStatus = preparing
    if (pm === 'cash' && deliveryStatus?.value === 'preparing') {
      return false
    }

    // สำหรับ cod: ไม่ต้องแสดง
    if (pm === 'cod') {
      return false
    }

    if (pm === 'credit') {
      return false
    }

    // สำหรับ order: แสดงเมื่อ status = wait_payment หรือมากกว่า
    if (pm === 'order') {
      const currentStepIndex = statusStepIndexFn(statusStr)
      const waitPaymentStepIndex = statusStepIndexFn('wait_payment')
      return currentStepIndex >= waitPaymentStepIndex
    }

    // สำหรับ transfer/card: แสดงเมื่อ status >= wait_payment
    const currentStepIndex = statusStepIndexFn(statusStr)
    const waitPaymentStepIndex = statusStepIndexFn('wait_payment')
    return currentStepIndex >= waitPaymentStepIndex
  })

  // Computed for showing shipping slip upload
  const showShippingSlipUpload = computed(() => {
    if (!currentStatusString?.value) return false
    const statusStr = currentStatusString.value
    const currentStepIndex = statusStepIndexFn(statusStr)
    const preparingStepIndex = statusStepIndexFn('preparing')
    return currentStepIndex >= preparingStepIndex
  })

  // Computed properties สำหรับการแสดงผลตาม payment method
  const showProductSelection = computed(() => {
    return paymentMethod?.value !== 'order'
  })

  const showCustomProducts = computed(() => {
    if (paymentMethod?.value !== 'order') return false
    // แสดงเฉพาะเมื่อไม่มีสินค้าปกติ
    const hasProducts = products?.value?.some((p) => p.id && p.quantity > 0) || false
    return !hasProducts
  })

  const showDeliveryStatus = computed(() => {
    return paymentMethod?.value === 'cash'
  })

  const showPaymentDueDate = computed(() => {
    return paymentMethod?.value === 'credit'
  })

  const showBankSelection = computed(() => {
    const pm = paymentMethod?.value
    if (!pm) return false

    // สำหรับ order: แสดงเมื่อมีสินค้า
    if (pm === 'order') {
      const hasProducts = products?.value?.some((p) => p.id && p.quantity > 0) || false
      return hasProducts
    }
    // สำหรับ transfer/card: แสดงเสมอ
    return pm === 'transfer' || pm === 'card'
  })

  const showShippingAddress = computed(() => {
    const pm = paymentMethod?.value
    if (!pm) return false

    if (pm === 'cash') {
      // เงินสด: แสดงถ้าเลือก "แพ็ครอจัดส่ง"
      return deliveryStatus?.value === 'preparing'
    }
    if (pm === 'order') {
      // สำหรับ order: แสดงเมื่อมีสินค้า
      const hasProducts = products?.value?.some((p) => p.id && p.quantity > 0) || false
      return hasProducts
    }
    // เครดิต, โอน, บัตร, ปลายทาง: บังคับ
    return pm === 'credit' || pm === 'transfer' || pm === 'card' || pm === 'cod'
  })

  const requiresShippingAddress = computed(() => {
    const pm = paymentMethod?.value
    if (!pm) return false

    if (pm === 'cash') {
      return deliveryStatus?.value === 'preparing'
    }
    if (pm === 'order') {
      // สำหรับ order: บังคับเมื่อมีสินค้า
      const hasProducts = products?.value?.some((p) => p.id && p.quantity > 0) || false
      return hasProducts
    }
    return pm === 'credit' || pm === 'transfer' || pm === 'card' || pm === 'cod'
  })

  // Computed สำหรับแสดง/ซ่อนส่วน "ข้อมูลเพิ่มเติม"
  const showAdditionalInfo = computed(() => {
    // ซ่อนเมื่อ paymentMethod = cash และ deliveryStatus = received
    if (paymentMethod?.value === 'cash' && deliveryStatus?.value === 'received') {
      return false
    }
    return true
  })

  return {
    showSlipUpload,
    showShippingSlipUpload,
    showProductSelection,
    showCustomProducts,
    showDeliveryStatus,
    showPaymentDueDate,
    showBankSelection,
    showShippingAddress,
    requiresShippingAddress,
    showAdditionalInfo,
  }
}
