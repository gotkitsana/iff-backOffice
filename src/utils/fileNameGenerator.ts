/**
 * Utility สำหรับสร้างชื่อไฟล์ที่ไม่ซ้ำกันด้วย timestamp
 */

/**
 * ดึงนามสกุลไฟล์จากชื่อไฟล์
 * @param filename - ชื่อไฟล์เดิม
 * @returns นามสกุลไฟล์ (รวม dot) หรือ empty string
 */
const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.substring(lastDot) : ''
}

/**
 * ดึงชื่อไฟล์โดยไม่มีนามสกุล
 * @param filename - ชื่อไฟล์เดิม
 * @returns ชื่อไฟล์โดยไม่มีนามสกุล
 */
const getFileNameWithoutExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.substring(0, lastDot) : filename
}

/**
 * สร้าง timestamp ในรูปแบบที่เหมาะสมสำหรับชื่อไฟล์
 * @returns timestamp string
 */
const generateTimestamp = (): string => {
  return Date.now().toString()
}

/**
 * สร้างชื่อไฟล์ใหม่ที่มี timestamp
 * @param originalFilename - ชื่อไฟล์เดิม
 * @param prefix - prefix ประเภทไฟล์ (เช่น 'product', 'certificate')
 * @returns ชื่อไฟล์ใหม่ที่มี timestamp
 */
export const generateFileName = (originalFilename: string, prefix?: string): string => {
  const extension = getFileExtension(originalFilename)
  const timestamp = generateTimestamp()
  const cleanName = getFileNameWithoutExtension(originalFilename)
    .replace(/[^a-zA-Z0-9ก-๙]/g, '_') // แทนที่อักขระพิเศษด้วย underscore
    .toLowerCase()

  if (prefix) {
    return `${prefix}_${cleanName}_${timestamp}${extension}`
  }

  return `${cleanName}_${timestamp}${extension}`
}

/**
 * สร้างชื่อไฟล์สำหรับรูปสินค้า
 * @param originalFilename - ชื่อไฟล์เดิม
 * @returns ชื่อไฟล์ใหม่
 */
export const generateProductImageName = (originalFilename: string): string => {
  return generateFileName(originalFilename, 'product')
}

/**
 * สร้างชื่อไฟล์สำหรับใบรับรอง
 * @param originalFilename - ชื่อไฟล์เดิม
 * @returns ชื่อไฟล์ใหม่
 */
export const generateCertificateName = (originalFilename: string): string => {
  return generateFileName(originalFilename, 'certificate')
}

/**
 * สร้างชื่อไฟล์สำหรับวิดีโอ
 * @param originalFilename - ชื่อไฟล์เดิม
 * @returns ชื่อไฟล์ใหม่
 */
export const generateVideoName = (originalFilename: string): string => {
  return generateFileName(originalFilename, 'video')
}

/**
 * สร้างชื่อไฟล์สำหรับสลิปการโอนเงิน
 * @param originalFilename - ชื่อไฟล์เดิม
 * @returns ชื่อไฟล์ใหม่
 */
export const generateSlipName = (originalFilename: string): string => {
  return generateFileName(originalFilename, 'slip')
}

/**
 * สร้างชื่อไฟล์แบบ batch สำหรับหลายไฟล์
 * @param files - array ของ File objects
 * @param prefix - prefix ประเภทไฟล์
 * @returns array ของชื่อไฟล์ใหม่
 */
export const generateBatchFileNames = (files: File[], prefix?: string): string[] => {
  return files.map((file) => generateFileName(file.name, prefix))
}

/**
 * สร้างชื่อไฟล์ที่มีทั้ง prefix และ custom identifier
 * @param originalFilename - ชื่อไฟล์เดิม
 * @param prefix - prefix ประเภทไฟล์
 * @param identifier - custom identifier (เช่น product SKU, user ID)
 * @returns ชื่อไฟล์ใหม่
 */
export const generateFileNameWithIdentifier = (
  originalFilename: string,
  prefix: string,
  identifier: string,
): string => {
  const extension = getFileExtension(originalFilename)
  const timestamp = generateTimestamp()
  const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, '_')

  return `${prefix}_${cleanIdentifier}_${timestamp}${extension}`
}

/**
 * Type definition สำหรับประเภทไฟล์
 */
export type FileType = 'product' | 'certificate' | 'video' | 'slip' | 'avatar' | 'banner'

/**
 * สร้างชื่อไฟล์ตามประเภท
 * @param originalFilename - ชื่อไฟล์เดิม
 * @param type - ประเภทไฟล์
 * @returns ชื่อไฟล์ใหม่
 */
export const generateFileNameByType = (originalFilename: string, type: FileType): string => {
  const generators: Record<FileType, (filename: string) => string> = {
    product: generateProductImageName,
    certificate: generateCertificateName,
    video: generateVideoName,
    slip: generateSlipName,
    avatar: (filename) => generateFileName(filename, 'avatar'),
    banner: (filename) => generateFileName(filename, 'banner'),
  }

  return generators[type](originalFilename)
}

/**
 * Validate ชื่อไฟล์
 * @param filename - ชื่อไฟล์
 * @param allowedExtensions - นามสกุลที่อนุญาต
 * @returns true ถ้าชื่อไฟล์ถูกต้อง
 */
export const validateFileName = (filename: string, allowedExtensions: string[]): boolean => {
  const extension = getFileExtension(filename).toLowerCase()
  return allowedExtensions.some((ext) => extension === ext.toLowerCase())
}

/**
 * นามสกุลไฟล์ที่รองรับ
 */
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm']
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx']
