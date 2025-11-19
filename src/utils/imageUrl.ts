// Map สำหรับ cache URL
const imageUrlCache = new Map<string, string>()

/**
 * ดึง URL ของรูปภาพพร้อม cache
 * @param filename - ชื่อไฟล์รูปภาพ
 * @param type - ประเภทการดาวน์โหลด (default: 'product')
 * @returns URL ของรูปภาพ
 */
export const getImageUrl = (filename: string | undefined, type: string = 'product'): string => {
  if (!filename) return ''

  const cacheKey = `${type}-${filename}`

  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!
  }

  const url = `${(import.meta as any).env.VITE_API_URL}/erp/download/${type}?name=${filename}`
  imageUrlCache.set(cacheKey, url)
  return url
}

/**
 * ดึง URL ของรูปภาพสินค้า
 * @param filename - ชื่อไฟล์รูปภาพ
 * @returns URL ของรูปภาพสินค้า
 */
export const getProductImageUrl = (filename: string | undefined): string => {
  return getImageUrl(filename, 'product')
}

/**
 * ดึง URL ของใบเซอร์ / เอกสาร
 * @param filename - ชื่อไฟล์
 * @returns URL ของเอกสาร
 */
export const getCertificateUrl = (filename: string | undefined): string => {
  return getImageUrl(filename, 'certificate')
}

/**
 * ดึง URL ของวิดีโอ
 * @param filename - ชื่อไฟล์วิดีโอ
 * @returns URL ของวิดีโอ
 */
export const getVideoUrl = (filename: string | undefined): string => {
  return getImageUrl(filename, 'video')
}

/**
 * ดึง URL ของใบเสร็จส่งของ (shipping slip)
 * @param saleId - ID ของรายการขาย
 * @param extension - extension ของไฟล์ (optional, เช่น 'jpg', 'jpeg', 'png')
 * @returns URL ของใบเสร็จส่งของ
 */
export const getShippingSlipUrl = (
  saleId: string | undefined,
  extension?: string | undefined,
): string => {
  if (!saleId) return ''
  const filename = extension ? `express-slip-${saleId}.${extension}` : `express-slip-${saleId}`
  return getImageUrl(filename, 'product')
}

/**
 * ดึง URL ของสลิปการชำระเงิน
 * @param saleId - ID ของรายการขาย
 * @returns URL ของสลิปการชำระเงิน
 */
export const getSlipUrl = (saleId: string | undefined): string => {
  if (!saleId) return ''
  const apiUrl = (import.meta as any).env.VITE_API_URL as string
  return `${apiUrl}/erp/download/slip?saleId=${saleId}`
}

/**
 * ล้าง cache ทั้งหมด
 */
export const clearImageCache = (): void => {
  imageUrlCache.clear()
}

/**
 * ล้าง cache ของไฟล์เฉพาะ
 * @param filename - ชื่อไฟล์ที่ต้องการลบ cache
 * @param type - ประเภทการดาวน์โหลด
 */
export const clearImageCacheByFilename = (filename: string, type: string = 'product'): void => {
  const cacheKey = `${type}-${filename}`
  imageUrlCache.delete(cacheKey)
}

/**
 * ดูขนาด cache ปัจจุบัน
 * @returns จำนวน URLs ใน cache
 */
export const getCacheSize = (): number => {
  return imageUrlCache.size
}

// Export cache สำหรับใช้งานขั้นสูง (ถ้าต้องการ)
export { imageUrlCache }
