import { toast } from 'vue3-toastify'
import type { ICreateSalesPayload, IUpdateSalesPayload } from '@/types/sales'

/**
 * Composable สำหรับจัดการสินค้าในฟอร์ม
 */
export function useProductManagement() {
  const addProduct = (
    products: Array<{ id: string; quantity: number; category: string; price: number }>,
    maxProducts: number = 10,
  ) => {
    if (products.length < maxProducts) {
      products.push({ id: '', quantity: 1, category: '', price: 0 })
    } else {
      toast.warning(`สามารถเพิ่มสินค้าได้สูงสุด ${maxProducts} รายการ`)
    }
  }

  const removeProduct = (
    products: Array<{ id: string; quantity: number; category: string; price: number }>,
    index: number,
  ) => {
    if (products.length > 1) {
      products.splice(index, 1)
    } else {
      toast.warning('ต้องมีสินค้าอย่างน้อย 1 รายการ')
    }
  }

  const isProductValid = (product: { id: string; quantity: number }) => {
    return product.id && product.quantity > 0
  }

  const hasValidProducts = (products: Array<{ id: string; quantity: number }>): boolean => {
    return products.some((p) => isProductValid(p))
  }

  return {
    addProduct,
    removeProduct,
    isProductValid,
    hasValidProducts,
  }
}
