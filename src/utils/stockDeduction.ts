import type { IProduct, IUpdateProductPayload } from '@/stores/product/product'
import type { IUpdateSalesPayload } from '@/types/sales'

/**
 * Utility function for deducting product stock
 * แยก logic การตัดสต็อกออกมาเพื่อให้เรียกใช้ได้ง่ายและปรับปรุงในอนาคต
 */
export interface StockDeductionResult {
  product: IUpdateProductPayload
  success: boolean
  warning?: string
}

/**
 * Calculate stock deduction for a single product
 * คำนวณการตัดสต็อกสำหรับสินค้าแต่ละรายการ
 */
export function calculateStockDeduction(
  product: IProduct,
  purchasedItem: { id: string; quantity: number },
): StockDeductionResult {
  const quantity = purchasedItem.quantity
  const isFish = product.category?.name === 'ปลา'

  let newSoldStatus = product.sold
  let newBalance = product.balance || 0
  let warning: string | undefined

  if (isFish) {
    // === กรณีปลา: ไม่ใช้ balance แค่เปลี่ยน sold ===
    newSoldStatus = true
    newBalance = product.balance || 0 // Balance remains unchanged for fish
  } else {
    // === กรณีสินค้าทั่วไป: ใช้ทั้ง balance และ sold ===
    const balance = product.balance || 0

    if (balance >= quantity) {
      // กรณีมีสต็อกเพียงพอ
      newBalance = balance - quantity
      newSoldStatus = newBalance === 0 // sold = true ถ้าสินค้าหมด
    } else {
      // กรณีสต็อกไม่พอ (ไม่ควรเกิด แต่เผื่อ)
      newBalance = 0
      newSoldStatus = true
      warning = `สินค้า ${product.sku} มีสต็อกไม่เพียงพอ (มี: ${balance}, ขาย: ${quantity})`
      console.warn(warning)
    }
  }

  return {
    product: {
      ...product,
      fishpond: product.fishpond?._id || undefined,
      species: product.species?._id || undefined,
      farm: product.farm?._id || undefined,
      quality: product.quality?._id || undefined,
      lotNumber: product.lotNumber?._id || undefined,
      seedSize: product.seedSize?._id || undefined,
      foodtype: product.foodtype?._id || undefined,
      brand: product.brand?._id || undefined,
      fishStatus: product.fishStatus?._id || undefined,
      sold: newSoldStatus,
      balance: newBalance,
    },
    success: !warning,
    warning,
  }
}

/**
 * Process stock deduction for all products in a sale
 * ประมวลผลการตัดสต็อกสำหรับสินค้าทั้งหมดในรายการขาย
 */
export function processStockDeduction(
  salePayload: IUpdateSalesPayload,
  allProducts: IProduct[],
): StockDeductionResult[] {
  const products = allProducts.filter((p) =>
    salePayload.products.some((product) => product.id === p._id),
  )

  const results: StockDeductionResult[] = []

  if (products && products.length > 0) {
    products.forEach((product) => {
      const purchasedItem = salePayload.products.find((p) => p.id === product._id)
      if (!purchasedItem) return

      const result = calculateStockDeduction(product, purchasedItem)
      results.push(result)
    })
  }

  return results
}

/**
 * Execute stock deduction and update products
 * ตัดสต็อกและอัปเดตสินค้าทั้งหมดในรายการขาย
 *
 * @param salePayload - ข้อมูลรายการขาย
 * @param allProducts - รายการสินค้าทั้งหมด
 * @param updateProductFn - ฟังก์ชันสำหรับอัปเดตสินค้า (optional)
 * @param onWarning - ฟังก์ชันสำหรับจัดการ warning (optional)
 * @returns ผลลัพธ์การตัดสต็อก
 */
export function executeStockDeduction(
  salePayload: IUpdateSalesPayload,
  allProducts: IProduct[],
  updateProductFn?: (product: IUpdateProductPayload) => void | Promise<void>,
  onWarning?: (warning: string) => void,
): StockDeductionResult[] {
  const results = processStockDeduction(salePayload, allProducts)

  // อัปเดตสินค้าทั้งหมด
  if (updateProductFn) {
    results.forEach((result) => {
      if (result.warning && onWarning) {
        onWarning(result.warning)
      }
      updateProductFn(result.product)
    })
  }

  return results
}
