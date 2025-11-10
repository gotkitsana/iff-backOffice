// src/composables/useProductQuery.ts
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ICategory } from '@/stores/product/category'
import type { ProductQueryParams, SaleFoodType } from '@/types/query'

export function useProductQuery() {
  const route = useRoute()
  const router = useRouter()

  // อ่านค่าจาก query string
  const categoryFromQuery = computed(() => route.query.category as string | undefined)
  const saleTypeFromQuery = computed(
    () => route.query.saleType as 'wholesale' | 'retail' | undefined,
  )
  const statusFromQuery = computed(() => route.query.status as string | undefined)

  const queryParams = computed<ProductQueryParams>(() => ({
    category: route.query.category as ProductQueryParams['category'],
    saleType: route.query.saleType as ProductQueryParams['saleType'],
    status: route.query.status as ProductQueryParams['status'],
    sku: route.query.sku as string,
    brand: route.query.brand as string,
    priceMin: route.query.priceMin ? Number(route.query.priceMin) : undefined,
    priceMax: route.query.priceMax ? Number(route.query.priceMax) : undefined,
  }))

  // ฟังก์ชันอัปเดต query
  const updateQuery = (updates: Record<string, any>) => {
    const newQuery = { ...route.query }

    console.log('updateQuery', updates)

    Object.keys(updates).forEach((key) => {
      if (updates[key] === null || updates[key] === undefined || updates[key] === '') {
        delete newQuery[key]
      } else {
        newQuery[key] = updates[key]
      }
    })

    router.replace({ query: newQuery })
  }

  // Navigate ไปหมวดหมู่ (เคลียร์ query อื่นๆ ทิ้ง)
  const navigateToCategory = (categoryValue: string) => {
    router.push({
      path: route.path,
      query: { category: categoryValue },
    })
  }

  // Navigate ไปหมวดหมู่พร้อม sale type
  const navigateToCategoryWithSaleType = (categoryValue: string, saleType: SaleFoodType) => {
    router.push({
      path: route.path,
      query: {
        category: categoryValue,
        saleType,
      },
    })
  }

  // Navigate ไปหน้าอื่น พร้อมเก็บ query ปัจจุบัน
  const navigateWithQuery = (path: string, additionalQuery: Record<string, any> = {}) => {
    router.push({
      path,
      query: { ...route.query, ...additionalQuery },
    })
  }

  // Navigate ไปหน้าอื่น โดยใช้ query ใหม่ทั้งหมด
  const navigateTo = (path: string, query: Record<string, any> = {}) => {
    router.push({ path, query })
  }

  // Navigate กลับหน้าหลัก (เคลียร์ query ทั้งหมด)
  const navigateToHome = () => {
    router.push({ path: route.path, query: {} })
  }

  // เปลี่ยนหมวดหมู่โดยรักษา query อื่นๆ
  // const switchCategory = (categoryValue: string | null) => {
  //   const { category, ...restQuery } = route.query
  //   if (categoryValue) {
  //     router.push({ query: { category: categoryValue, ...restQuery } })
  //   } else {
  //     router.push({ query: restQuery })
  //   }
  // }

  // ฟังก์ชันเซ็ต category
  const setCategory = (category: ICategory | null) => {
    updateQuery({ category: category?.value })
  }

  // ฟังก์ชันเซ็ต sale type
  const setSaleType = (saleType: SaleFoodType) => {
    console.log('setSaleType', saleType)
    updateQuery({ saleType })
  }

  // ฟังก์ชันเคลียร์ query ทั้งหมด
  const clearAllQuery = () => {
    router.push({ query: {} })
  }

  // ฟังก์ชันเคลียร์ query บางตัว
  const clearQuery = (keys: string[]) => {
    const newQuery = { ...route.query }
    keys.forEach((key) => delete newQuery[key])
    router.push({ query: newQuery })
  }

  return {
    // Values
    categoryFromQuery,
    saleTypeFromQuery,
    statusFromQuery,

    // Functions
    updateQuery,
    setCategory,
    setSaleType,
    clearAllQuery,
    clearQuery,

    // 🆕 Navigation Functions
    navigateToCategory,
    navigateToCategoryWithSaleType,
    navigateWithQuery,
    navigateTo,
    navigateToHome,
  }
}
