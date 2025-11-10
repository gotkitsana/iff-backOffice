import type { IProduct } from "@/stores/product/product"
import { ref } from "vue"

// src/composables/useProductModals.ts
export function useProductModals() {
  const showAddModal = ref(false)
  const showExportModal = ref(false)
  const showEditModal = ref(false)
  const showDetailModal = ref(false)
  const showDeleteModal = ref(false)

  const selectedProduct = ref<IProduct | null>(null)


  const openAddModal = () => {
    showAddModal.value = true
  }

  const closeAddModal = () => {
    showAddModal.value = false
  }

  const openExportModal = () => {
    showExportModal.value = true
  }

  const closeExportModal = () => {
    showExportModal.value = false
  }

  const openDetailModal = (product: IProduct) => {
    selectedProduct.value = product
    showDetailModal.value = true
  }

  const closeDetailModal = () => {
    showDetailModal.value = false
    selectedProduct.value = null
  }

  const openEditModal = (product: IProduct) => {
    selectedProduct.value = product
    showEditModal.value = true
  }

  const closeEditModal = () => {
    showEditModal.value = false
    selectedProduct.value = null
  }

  const openDeleteModal = (product: IProduct) => {
    selectedProduct.value = product
    showDeleteModal.value = true
  }

  const closeDeleteModal = () => {
    showDeleteModal.value = false
    selectedProduct.value = null
  }

  return {
    showAddModal,
    showEditModal,
    showDetailModal,
    showDeleteModal,
    showExportModal,

    selectedProduct,

    openEditModal,
    openAddModal,
    openDetailModal,
    openExportModal,
    openDeleteModal,

    closeEditModal,
    closeAddModal,
    closeDetailModal,
    closeExportModal,
    closeDeleteModal,
  }
}
