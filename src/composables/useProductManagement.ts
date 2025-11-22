import { computed, ref, type Ref } from 'vue'
import { toast } from 'vue3-toastify'
import type { IProduct } from '@/stores/product/product'
import type { IFoodSale } from '@/stores/product/food_sale'
import type { ICategory } from '@/stores/product/category'
import { useProductSelection } from './useProductSelection'

export interface ProductItem {
  id: string
  quantity: number
  category: string
  price: number
  name?: string
  retailID?: string
  unit?: string
}

export interface UseProductManagementOptions {
  products: Ref<ProductItem[]>
  productsData?: Ref<IProduct[] | undefined>
  foodSales?: Ref<IFoodSale[] | undefined>
  categories?: Ref<ICategory[] | undefined>
  customProducts?: Ref<Array<{ name: string; quantity: number; description: string }>>
  maxProducts?: number
  minProducts?: number
}

export function useProductManagement(options: UseProductManagementOptions) {
  const {
    products,
    productsData,
    foodSales,
    categories,
    customProducts,
    maxProducts = 10,
    minProducts = 1,
  } = options

  // Use product selection composable
  // Create default ref if productsData is undefined
  const productsDataRef = productsData || ref<IProduct[] | undefined>(undefined)
  const categoriesRef = categories || ref<ICategory[] | undefined>(undefined)
  const foodSalesRef = foodSales || ref<IFoodSale[] | undefined>(undefined)

  const productSelection = useProductSelection(
    productsDataRef,
    categoriesRef,
    foodSalesRef,
    computed(() => products.value || []),
  )

  // Calculate total amount
  const totalAmount = computed(() => {
    return (
      products.value?.reduce((sum, product) => {
        if (!product.id) return 0

        // ตรวจสอบว่าเป็น food sale (ModalAddSale)
        if (foodSales?.value) {
          const foodSale = foodSales.value.find((fs) => fs._id === product.id)
          if (foodSale) {
            return sum + (foodSale.customerPriceKilo || 0) * (product.quantity || 0)
          }
        }

        // กรณี product ปกติ
        const productDetail = productSelection.availableProducts.value?.find(
          (p) => p._id === product.id,
        )
        if (productDetail && productDetail.price) {
          return sum + (productDetail.price || 0) * product.quantity
        }

        // ถ้าไม่มี productDetail ให้ใช้ price จาก form (ModalEditSale)
        return sum + (product.price || 0) * product.quantity
      }, 0) || 0
    )
  })

  // Add product
  const addProduct = () => {
    if (!products.value) {
      products.value = [{ id: '', quantity: 1, category: '', price: 0 }]
      return
    }

    if (products.value.length < maxProducts) {
      // ถ้ามี customProducts ให้ clear ออก (StatusManager, ModalEditSale)
      if (customProducts?.value && customProducts.value.length > 0) {
        customProducts.value = []
      }
      products.value.push({ id: '', quantity: 1, category: '', price: 0 })
    } else {
      toast.warning(`สามารถเพิ่มสินค้าได้สูงสุด ${maxProducts} รายการ`)
    }
  }

  // Remove product
  const removeProduct = (index: number) => {
    if (products.value && products.value.length > minProducts) {
      products.value.splice(index, 1)
    } else {
      toast.warning(`ต้องมีสินค้าอย่างน้อย ${minProducts} รายการ`)
    }
  }

  // Update product for index
  const updateProductForIndex = (index: number, value: string | Record<string, unknown>) => {
    let selectedId: string
    if (typeof value === 'string') {
      selectedId = value
    } else if (value && typeof value === 'object') {
      selectedId = Object.keys(value)[0] || ''
    } else {
      return
    }

    if (!selectedId || !products.value) return

    const product = productSelection.availableProducts.value?.find((p) => p._id === selectedId)
    if (!product) return

    let price = product.price || 0
    if (product.category?.name != 'ปลา' && product.food?.customerPrice) {
      price = product.food.customerPrice
    }

    products.value[index] = {
      id: product._id,
      category: product.category?._id || '',
      price: price,
      quantity: products.value[index].quantity || 1,
    }
  }

  // Check if product is valid
  const isProductValid = (product: ProductItem) => {
    return product.id && product.quantity > 0
  }

  return {
    productSelection,
    totalAmount,
    addProduct,
    removeProduct,
    updateProductForIndex,
    isProductValid,
  }
}
