import { ref, type Ref } from 'vue'
import { SellingStatus } from '@/types/sales'
import { getShippingSlipUrl } from '@/utils/imageUrl'
import type { IUpdateSalesPayload } from '@/types/sales'

export interface UseSlipManagementOptions {
  saleId: string
  currentStatusString: Ref<string>
  onStatusUpdate?: (payload: IUpdateSalesPayload) => void | Promise<void>
}

export function useSlipManagement(options: UseSlipManagementOptions) {
  const { saleId, currentStatusString, onStatusUpdate } = options

  // Slip states
  const hasSlip = ref(false)
  const hasShippingSlip = ref(false)
  const hasPendingSlipUpload = ref(false)
  const hasPendingShippingSlipUpload = ref(false)
  const skipShippingSlipUpload = ref(false)
  const requireShippingSlipUpload = ref(true) // ค่าเริ่มต้น = true (ต้องอัพโหลด)

  // Handlers
  const handleSlipStatusChanged = (status: boolean) => {
    hasSlip.value = status
  }

  const handleShippingSlipStatusChanged = (status: boolean) => {
    hasShippingSlip.value = status
  }

  const handleSlipPendingUpload = (isPending: boolean) => {
    hasPendingSlipUpload.value = isPending
  }

  const handleShippingSlipPendingUpload = (isPending: boolean) => {
    hasPendingShippingSlipUpload.value = isPending
  }

  const handleSkipShippingSlipUploadChanged = (skip: boolean) => {
    skipShippingSlipUpload.value = skip
  }

  const handleRequireShippingSlipUploadChanged = (require: boolean) => {
    requireShippingSlipUpload.value = require
  }

  // Handler สำหรับเมื่ออัพโหลดสลิปสำเร็จ - ตรวจสอบและเปลี่ยนสถานะอัตโนมัติ
  const handleSlipUploaded = async (uploadedSaleId: string, saleForm: IUpdateSalesPayload) => {
    if (!uploadedSaleId || uploadedSaleId !== saleId) return

    const currentStatusStr = currentStatusString.value
    if (currentStatusStr !== 'wait_payment') return

    // ตรวจสอบว่ามีสลิปแล้วจริงๆ โดย query ด้วย saleId
    try {
      const apiUrl = (import.meta as any).env.VITE_API_URL as string
      const slipUrl = `${apiUrl}/erp/download/slip?saleId=${uploadedSaleId}`

      // ตรวจสอบว่ามีสลิปจริงๆ หรือไม่
      const slipExists = await new Promise<boolean>((resolve) => {
        const img = new Image()
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000)

        img.onload = () => {
          clearTimeout(timeout)
          resolve(true)
        }

        img.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }

        img.src = slipUrl
      })

      // ถ้ามีสลิปแล้ว ให้เปลี่ยนสถานะเป็น preparing
      if (slipExists && onStatusUpdate) {
        const payload: IUpdateSalesPayload = {
          ...saleForm,
          sellingStatus: SellingStatus.preparing,
        }
        await onStatusUpdate(payload)
      }
    } catch (error) {
      console.error('Error checking slip:', error)
    }
  }

  // Handler สำหรับเมื่ออัพโหลด shipping slip สำเร็จ - ตรวจสอบและเปลี่ยนสถานะอัตโนมัติ
  const handleShippingSlipUploaded = async (
    uploadedSaleId: string,
    saleForm: IUpdateSalesPayload,
  ) => {
    if (!uploadedSaleId || uploadedSaleId !== saleId) return

    const currentStatusStr = currentStatusString.value
    if (currentStatusStr !== 'preparing') return

    // ตรวจสอบว่ามี shipping slip แล้วจริงๆ
    try {
      const extensions = ['jpg', 'jpeg', 'png']
      let found = false

      for (const ext of extensions) {
        const shippingSlipUrl = getShippingSlipUrl(uploadedSaleId, ext)
        const slipExists = await new Promise<boolean>((resolve) => {
          const img = new Image()
          const timeout = setTimeout(() => {
            resolve(false)
          }, 5000)

          img.onload = () => {
            clearTimeout(timeout)
            resolve(true)
          }

          img.onerror = () => {
            clearTimeout(timeout)
            resolve(false)
          }

          img.src = shippingSlipUrl
        })

        if (slipExists) {
          found = true
          break
        }
      }

      // ถ้ามี shipping slip แล้ว ให้เปลี่ยนสถานะเป็น shipping
      if (found && onStatusUpdate) {
        const payload: IUpdateSalesPayload = {
          ...saleForm,
          sellingStatus: SellingStatus.shipping,
        }
        await onStatusUpdate(payload)
      }
    } catch (error) {
      console.error('Error checking shipping slip:', error)
    }
  }

  // Reset function
  const resetSlipStates = () => {
    hasSlip.value = false
    hasShippingSlip.value = false
    hasPendingSlipUpload.value = false
    hasPendingShippingSlipUpload.value = false
    skipShippingSlipUpload.value = false
    requireShippingSlipUpload.value = true
  }

  return {
    // States
    hasSlip,
    hasShippingSlip,
    hasPendingSlipUpload,
    hasPendingShippingSlipUpload,
    skipShippingSlipUpload,
    requireShippingSlipUpload,
    // Handlers
    handleSlipStatusChanged,
    handleShippingSlipStatusChanged,
    handleSlipPendingUpload,
    handleShippingSlipPendingUpload,
    handleSkipShippingSlipUploadChanged,
    handleRequireShippingSlipUploadChanged,
    handleSlipUploaded,
    handleShippingSlipUploaded,
    resetSlipStates,
  }
}
