import type { ICategory } from "@/stores/product/category"
import type { ICategoryOption } from "@/stores/product/product"
import { computed, type Ref } from "vue"

// src/composables/useCategoryFields.ts
export function useCategoryFields(categories: Ref<ICategory[] | undefined>) {
  const categoryOptionsUI = computed(() => {
    if (!categories.value) return []

    const fieldsData = {
      fish: [
        { key: 'lotNumber', label: 'เลขล็อต', type: 'select', required: true },
        { key: 'greenhouse', label: 'กรีนเฮ้า', type: 'select', required: true },
        { key: 'fishpond', label: 'บ่อ', type: 'select', required: true },
        { key: 'sku', label: 'รหัสปลา', type: 'text', required: true },
        { key: 'species', label: 'สายพันธุ์', type: 'select', required: true },
        { key: 'breeders', label: 'แม่พันธุ์', type: 'text', required: true },
        { key: 'birth', label: 'วันเกิด', type: 'date', required: true },
        { key: 'age', label: 'อายุ (6 เดือนขึ้นไป)', type: 'select', required: true },
        { key: 'quality', label: 'คุณภาพปลา', type: 'select', required: true },
        { key: 'farm', label: 'ฟาร์ม', type: 'select', required: true , closeInEdit: true },
        { key: 'size', label: 'ไซต์', type: 'number', required: true , closeInEdit: true },
        { key: 'weight', label: 'น้ำหนัก (กก.)', type: 'number', required: true , closeInEdit: true },
        { key: 'gender', label: 'เพศ', type: 'select', required: true , closeInEdit: true },
        { key: 'price', label: 'ราคา', type: 'number', required: true , closeInEdit: true },
        { key: 'fishStatus', label: 'สถานะปลา', type: 'select', required: false },
        { key: 'sold', label: 'ขายแล้ว', type: 'boolean', required: false },
      ],
      food: [
        { key: 'sku', label: 'รหัสอาหาร', type: 'text', required: true },
        { key: 'lotNumber', label: 'เลขล็อต', type: 'select', required: true },
        { key: 'brand', label: 'ชื่อแบรนด์', type: 'select', required: true },
        { key: 'foodtype', label: 'ประเภทอาหาร', type: 'select', required: true },
        { key: 'seedType', label: 'ชนิดเม็ด', type: 'select', required: true },
        { key: 'seedSize', label: 'ขนาดเม็ด', type: 'select', required: true },
        { key: 'weight', label: 'น้ำหนัก ต่อกระสอบ (กก.)', type: 'number', required: true },
        { key: 'produceDate', label: 'วันที่ผลิต', type: 'date', required: true },
        { key: 'expireDate', label: 'วันหมดอายุ', type: 'date', required: true },
        { key: 'marketPrice', label: 'ราคาท้องตลาด', type: 'number', required: true },
        { key: 'costPrice', label: 'ราคาทุน', type: 'number', required: true },
        { key: 'customerPrice', label: 'ราคาลูกค้า', type: 'number', required: true },
        { key: 'dealerPrice', label: 'ราคาพ่อค้า', type: 'number', required: true },
        { key: 'balance', label: 'สินค้าคงเหลือ', type: 'number', required: false },
      ],
      microorganism: [
        { key: 'sku', label: 'รหัสสารปรับสภาพน้ำ', type: 'text', required: true },
        { key: 'lotNumber', label: 'เลขล็อต', type: 'select', required: true },
        { key: 'brand', label: 'ชื่อแบรนด์', type: 'select', required: true },
        { key: 'weight', label: 'น้ำหนัก (กก.)', type: 'number', required: true },
        { key: 'produceDate', label: 'วันที่ผลิต', type: 'date', required: true },
        { key: 'expireDate', label: 'วันหมดอายุ', type: 'date', required: true },
        { key: 'marketPrice', label: 'ราคาท้องตลาด', type: 'number', required: true },
        { key: 'costPrice', label: 'ราคาทุน', type: 'number', required: true },
        { key: 'customerPrice', label: 'ราคาลูกค้า', type: 'number', required: true },
        { key: 'dealerPrice', label: 'ราคาพ่อค้า', type: 'number', required: true },
        { key: 'balance', label: 'สินค้าคงเหลือ', type: 'number', required: false },
      ],
    }

    return categories.value.map((category) => ({
      ...category,
      fields: fieldsData[category.value as keyof typeof fieldsData] || [],
    })) as ICategoryOption[]
  })

  return { categoryOptionsUI }
}
