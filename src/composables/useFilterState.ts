import { ref, watch } from 'vue'

export function useFilterState<T extends Record<string, any>>(
  propsFilters: T,
  emit: (event: 'update-filters', ...args: any[]) => void,
  defaultFilters: T,
) {
  const localFilters = ref<T>({ ...propsFilters })

  watch(
    () => propsFilters,
    (newFilters) => {
      if (newFilters) {
        localFilters.value = { ...localFilters.value, ...newFilters }
      }
    },
    { deep: true },
  )

  const updateFilter = (key: keyof T, value: any) => {
    localFilters.value[key] = value
    emit('update-filters', { ...localFilters.value })
  }

  const clearFilters = () => {
    localFilters.value = { ...defaultFilters }
    emit('update-filters', { ...localFilters.value })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return {
    localFilters,
    updateFilter,
    clearFilters,
    formatCurrency,
  }
}
