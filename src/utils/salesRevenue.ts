import type { ISales, SellingStatus } from '@/types/sales'
import type { ICategoryValue } from '@/stores/product/category'

/**
 * คำนวณยอดรวมของรายการขาย
 */
export function calculateSaleTotal(sale: ISales): number {
  const productTotal = sale.products
    ? sale.products.reduce((sum, product) => {
        return sum + (product.price || 0) * product.quantity
      }, 0)
    : 0
  return productTotal - (sale.discount || 0) - (sale.deliveryNo || 0)
}

/**
 * คำนวณยอดรวมตามสถานะ
 */
export function calculateRevenueByStatus(
  sales: ISales[],
  statusFilter: (status: SellingStatus) => boolean,
): number {
  return (
    sales
      ?.filter((s) => statusFilter(s.status as SellingStatus))
      .reduce((sum, sale) => sum + calculateSaleTotal(sale), 0) || 0
  )
}

/**
 * คำนวณยอดขายตามหมวดหมู่
 */
export function calculateCategoryRevenue(
  sales: ISales[],
  categoryName: ICategoryValue,
  categories: Array<{ _id: string; value: ICategoryValue }> | undefined,
  statusFilter: (status: SellingStatus) => boolean,
): number {
  return (
    sales
      ?.filter((s) => statusFilter(s.status as SellingStatus))
      .reduce((sum, sale) => {
        const categoryProductsTotal = sale.products
          ? sale.products
              .filter(
                (product) =>
                  categories?.find((c) => c._id === product.category)?.value === categoryName,
              )
              .reduce((productSum, product) => {
                return productSum + (product.price || 0) * product.quantity
              }, 0)
          : 0
        return sum + categoryProductsTotal
      }, 0) || 0
  )
}
