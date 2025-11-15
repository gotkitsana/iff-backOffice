import type { IProduct } from '@/stores/product/product'
import type { ISales, IUpdateSalesPayload } from '@/types/sales'

/**
 * คำนวณยอดรวมของสินค้าในรายการขาย
 */
export function calculateOrderTotal(order: IUpdateSalesPayload, allProducts: IProduct[]): number {
  const productsTotal = order.products.reduce((sum, item) => {
    const product = allProducts.find((p) => p._id === item.id)
    if (!product) return sum

    if (product.category?.name === 'ปลา') {
      const price = product.price || 0
      return sum + price
    } else {
      const price = product.food?.customerPrice || 0
      return sum + price * item.quantity
    }
  }, 0)

  return productsTotal - (order.discount || 0)
}

/**
 * คำนวณยอดรวมของรายการขาย (ISales)
 */
export function calculateSaleTotal(sale: ISales, allProducts: IProduct[]): number {
  const productsTotal = sale.products?.reduce((sum, item) => {
    const product = allProducts.find((p) => p._id === item.id)
    if (!product) return sum

    if (product.category?.name === 'ปลา') {
      const price = product.price || 0
      return sum + price
    } else {
      const price = product.food?.customerPrice || 0
      return sum + price * item.quantity
    }
  }, 0)

  return productsTotal ? productsTotal - (sale.discount || 0) : 0
}

/**
 * คำนวณยอดสุทธิ (รวมค่าจัดส่ง)
 */
export function calculateNetAmount(sale: ISales | IUpdateSalesPayload): number {
  const productTotal =
    'products' in sale && sale.products
      ? sale.products.reduce((sum: number, product: any) => {
          return sum + (product.price || 0) * (product.quantity || 1)
        }, 0)
      : 0

  const netAmount = productTotal - (sale.deliveryNo || 0) - (sale.discount || 0)
  return netAmount < 0 ? 0 : netAmount
}
