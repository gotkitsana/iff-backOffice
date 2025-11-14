import { computed, type Ref, type ComputedRef } from 'vue'
import { getProductImageUrl } from '@/utils/imageUrl'
import type { IProduct } from '@/stores/product/product'
import type { ICategory } from '@/stores/product/category'
import type { IFoodSale } from '@/stores/product/food_sale'

export interface ProductFormItem {
  id: string
  quantity: number
  category: string
  price: number
  name?: string
}

export function useProductSelection(
  products: Ref<IProduct[] | undefined>,
  categories: Ref<ICategory[] | undefined>,
  foodSales: Ref<IFoodSale[] | undefined>,
  selectedProducts: Ref<ProductFormItem[]> | ComputedRef<ProductFormItem[]>,
) {
  // Image URL cache
  const imageUrlCache = new Map<string, string>()
  const getImageUrl = (filename: string): string => {
    if (imageUrlCache.has(filename)) {
      return imageUrlCache.get(filename)!
    }
    const url = getProductImageUrl(filename)
    imageUrlCache.set(filename, url)
    return url
  }

  // Helper: Find category by ID
  const handleFindCategory = (id: string | null | undefined): ICategory | undefined => {
    if (!id || !categories.value) return undefined
    return categories.value.find((category) => category._id === id)
  }

  // Available products (filter out auction only)
  const availableProducts = computed(() => {
    if (!products.value) return []
    return products.value.filter((p) => p.auctionOnly === 0)
  })

  // Get product by ID
  const getSelectedProduct = (id: string): IProduct | undefined => {
    return availableProducts.value.find((p) => p._id === id)
  }

  // Get product options for TreeSelect (excluding already selected products)
  const getProductOptionsForIndex = (currentIndex: number) => {
    if (!availableProducts.value) return []

    // Get selected product IDs (except current index)
    const selectedProductIds = (selectedProducts.value || [])
      .map((p, index) => (index !== currentIndex ? p.id : ''))
      .filter((id) => id !== '')

    // Filter unselected products
    const unselectedProducts = availableProducts.value.filter(
      (product) => !selectedProductIds.includes(product._id),
    )

    // Group by category
    const groupsMap = new Map<
      string,
      {
        label: string
        children: Array<{
          label: string
          value: string
          image?: string
          disabled?: boolean
          sold?: boolean
          balance?: number
          isFish?: boolean
          sku?: string
          isFoodSale?: boolean
          kilo?: number
          customerPriceKilo?: number
        }>
      }
    >()

    unselectedProducts.forEach((product) => {
      const catId = product.category?._id || 'unknown'
      const cat = handleFindCategory(product.category?._id)
      const isFish = cat?.value === 'fish'
      const isFood = cat?.value === 'food'

      const groupLabel = isFood ? 'อาหาร (กระสอบ)' : cat?.name || 'ไม่ระบุหมวดหมู่'
      const group = groupsMap.get(catId) || {
        label: groupLabel,
        children: [],
      }

      const imageUrl =
        product.images && product.images.length > 0
          ? getImageUrl(product.images[0].filename)
          : undefined

      const isSold = isFish ? product.sold : product.sold || (product.balance || 0) === 0

      group.children.push({
        label: `${product.name || `${product.species?.name}`}`,
        sku: product.sku || '',
        value: product._id,
        image: imageUrl,
        disabled: isSold,
        sold: product.sold,
        balance: product.balance,
        isFish: isFish,
        isFoodSale: false,
      })

      groupsMap.set(catId, group)
    })

    const treeNodes = Array.from(groupsMap.values()).map((group, groupIndex) => ({
      key: `group-${groupIndex}`,
      label: group.label,
      selectable: false,
      children: group.children
        .sort((a, b) => {
          if (a.disabled && !b.disabled) return 1
          if (!a.disabled && b.disabled) return -1
          return a.label.localeCompare(b.label)
        })
        .map((item) => ({
          key: item.value,
          label: item.label,
          value: item.value,
          data: item,
          selectable: !item.disabled,
          disabled: item.disabled,
          sku: item.sku,
          image: item.image,
          sold: item.sold,
          balance: item.balance,
          isFish: item.isFish,
          isFoodSale: item.isFoodSale,
          kilo: item.kilo,
          customerPriceKilo: item.customerPriceKilo,
        })),
    }))

    return treeNodes
  }

  // Get selected product details
  const selectedProductDetails = computed(() => {
    return (selectedProducts.value || []).map((product) => {
      if (!product.id) return null

      // Check if it's a food sale
      const foodSale = foodSales.value?.find((fs) => fs._id === product.id)

      if (foodSale) {
        const productDetail = foodSale.product
        const imageUrl =
          productDetail?.images && productDetail?.images.length > 0
            ? getProductImageUrl(productDetail.images[0].filename)
            : undefined

        return {
          ...productDetail,
          quantity: product.quantity,
          productId: foodSale._id,
          isMissing: false,
          category: handleFindCategory(productDetail?.category),
          image: imageUrl,
          isFoodSale: true,
          kilo: foodSale.kilo,
          customerPriceKilo: foodSale.customerPriceKilo,
          price: foodSale.customerPriceKilo,
        }
      }

      if (!availableProducts.value) return null
      const productDetail = availableProducts.value.find((p) => p._id === product.id)

      const category = handleFindCategory(productDetail?.category?._id)
      const imageUrl =
        productDetail?.images && productDetail?.images.length > 0
          ? getProductImageUrl(productDetail?.images[0].filename)
          : undefined

      if (!productDetail) {
        return {
          name: '',
          price: 0,
          productId: product.id,
          quantity: product.quantity,
          isMissing: true,
          category: undefined,
          image: undefined,
          sku: '',
          balance: 0,
        }
      }

      return {
        ...productDetail,
        quantity: product.quantity,
        productId: product.id,
        isMissing: false,
        category: category,
        image: imageUrl,
      }
    })
  })

  return {
    getImageUrl,
    handleFindCategory,
    availableProducts,
    getSelectedProduct,
    getProductOptionsForIndex,
    selectedProductDetails,
  }
}
