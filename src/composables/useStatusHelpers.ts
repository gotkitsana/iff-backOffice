import { computed, type Ref } from 'vue'
import { useSalesStore } from '@/stores/sales/sales'
import { convertStatusNumberToString, type SellingStatus } from '@/types/sales'

export interface UseStatusHelpersOptions {
  sellingStatus?: Ref<SellingStatus | number | string | undefined>
  currentStatus?: string
}

export function useStatusHelpers(options: UseStatusHelpersOptions) {
  const { sellingStatus, currentStatus } = options
  const salesStore = useSalesStore()

  // Helper function for status step index
  const getStatusStepIndex = (status: SellingStatus | number | string) => {
    const statusString =
      typeof status === 'number'
        ? convertStatusNumberToString(status)
        : typeof status === 'string'
          ? status
          : convertStatusNumberToString(status)
    return salesStore.sellingStatusOptions.findIndex((option) => option.value === statusString)
  }

  // Current status string computed
  const currentStatusString = computed(() => {
    if (sellingStatus?.value !== undefined) {
      return typeof sellingStatus.value === 'number'
        ? convertStatusNumberToString(sellingStatus.value)
        : sellingStatus.value
    }
    return currentStatus || 'none'
  })

  return {
    getStatusStepIndex,
    currentStatusString,
  }
}
