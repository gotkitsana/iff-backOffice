// src/composables/useMemberInterests.ts
import type { InterestType } from '@/stores/member/member'

/**
 * Field mapping configuration
 * Maps form field names to InterestType values
 */
const fieldMap: Record<string, InterestType> = {
  breedingBehavior: 'breeding_behavior',
  gosanke: 'gosanke',
  nonGosanke: 'non_gosanke',
  variety: 'variety',
  fishAge: 'fish_age',
  budgetLevel: 'budget_level',
  bacteriaUsage: 'bacteria_usage',
  bacteriaBrand: 'bacteria_brand',
  foodBrand: 'food_brand',
  filterCleaning: 'filter_cleaning',
  filterCleaningCompany: 'filter_cleaning_company',
  pondSize: 'pond_size',
  feedingMethod: 'feeding_method',
  experience: 'experience',
  fishPreference: 'fish_preference',
}

/**
 * Composable สำหรับจัดการการแปลงระหว่าง interests array และ flat object
 */
export function useMemberInterests() {
  /**
   * ดึงค่าจาก interests array ตาม type
   * @param interestsArray - interests array จาก IMember
   * @param type - InterestType ที่ต้องการหา
   * @returns ค่าที่พบ หรือ empty string ถ้าไม่พบ
   */
  const getInterestValue = (
    interestsArray: Array<{ type: InterestType; value: string }> | undefined,
    type: InterestType,
  ): string => {
    if (!interestsArray) return ''
    return interestsArray.find((i) => i.type === type)?.value || ''
  }

  /**
   * แปลง interests array เป็น flat object สำหรับใช้ใน form
   * @param interestsArray - interests array จาก IMember
   * @returns flat object ที่มี field names เป็น keys
   */
  const toFlatObject = (
    interestsArray: Array<{ type: InterestType; value: string }> | undefined,
  ): Record<string, string> => {
    if (!interestsArray || interestsArray.length === 0) return {}

    const flat: Record<string, string> = {}
    interestsArray.forEach((item) => {
      const fieldName = Object.keys(fieldMap).find((key) => fieldMap[key] === item.type)
      if (fieldName) {
        flat[fieldName] = item.value
      }
    })
    return flat
  }

  /**
   * แปลง flat object เป็น interests array สำหรับบันทึก
   * @param flat - flat object จาก form fields
   * @returns interests array พร้อม index
   */
  const toInterestsArray = (
    flat: Record<string, string>,
  ): Array<{
    index: number
    type: InterestType
    value: string
  }> => {
    let index = 0
    const result: Array<{ index: number; type: InterestType; value: string }> = []

    Object.entries(fieldMap).forEach(([fieldName, interestType]) => {
      const value = flat[fieldName]

      // Skip empty values
      if (!value || !value.trim()) return

      // Conditional logic for bacteria_brand: ต้องมี bacteriaUsage === 'yes'
      if (interestType === 'bacteria_brand' && flat.bacteriaUsage !== 'yes') return

      // Conditional logic for filter_cleaning_company: ต้องมี filterCleaning === 'company'
      if (interestType === 'filter_cleaning_company' && flat.filterCleaning !== 'company') return

      result.push({ index: index++, type: interestType, value })
    })

    return result
  }

  return {
    getInterestValue,
    toFlatObject,
    toInterestsArray,
    fieldMap,
  }
}
