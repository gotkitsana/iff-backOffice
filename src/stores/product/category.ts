import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useCategoryStore = defineStore('category', () => {
  async function onGetCategory(type: number) {
    const { data } = await api.get(`/category?type=${type}`)
    const categories = handleCleanCategory(data.data)
    return categories
  }

  async function onCreateCategory(payload: ICategoryPayload) {
    const { data } = await api.post(`/category`, payload)
    return data
  }

  async function onUpdateCategory(payload: ICategoryUpdatePayload) {
    const { data } = await api.put(`/category`, payload)
    return data
  }

  async function onDeleteCategory(id: string) {
    const { data } = await api.delete(`/category?id=${id}`)
    return data
  }

  const handleCleanCategory = (categories: ICategoryNotUse[]): ICategory[] => {
    const categoryMapping: {
      name: ICategoryLabel
      value: ICategoryValue
      icon: string
      iconColor: string
      bgColor: string
      borderColor: string
    }[] = [
      { name: 'ปลา', value: 'fish', icon: 'pi pi-star', iconColor: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' },
      { name: 'อาหาร', value: 'food', icon: 'pi pi-heart', iconColor: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
      {
        name: 'สารปรับสภาพน้ำ',
        value: 'microorganism',
        icon: 'pi pi-sparkles',
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200'
      },
      { name: 'อุปกรณ์', value: 'equipment', icon: 'pi pi-wrench', iconColor: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
      { name: 'เวชภัณฑ์', value: 'medicine', icon: 'pi pi-plus-circle', iconColor: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200' },
      {
        name: 'คอนสทรัคชั่น',
        value: 'construction',
        icon: 'pi pi-building',
        iconColor: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
      },
      { name: 'บริการ', value: 'service', icon: 'pi pi-cog', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-200' },
    ]

    const cleanedCategories = categories.map((category) => {
      const mapping = categoryMapping.find((c) => c.name === category.name)
      if (!mapping) {
        return null
      }
      return {
        _id: category._id,
        type: category.type,
        cat: category.cat,
        uat: category.uat,
        name: category.name,
        icon: mapping.icon,
        iconColor: mapping.iconColor,
        bgColor: mapping.bgColor,
        value: mapping.value,
      }
    })
    return cleanedCategories.filter((c) => c !== null) as ICategory[]
  }

  return {
    onGetCategory,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
  }
})

export type ICategoryNotUse = {
  _id: string
  type: number
  name: string
  cat: number
  uat: number
}

export type ICategory = {
  _id: string
  type: number
  cat: number
  uat: number
  name: ICategoryLabel
  value: ICategoryValue
  icon: string
  iconColor: string
  bgColor: string
}

export type ICategoryPayload = {
  name: string
  type: number
}

export type ICategoryUpdatePayload = {
  _id: string
  name: string
  cat: number
  type: number
}

export type ICategoryLabel =
  | 'ปลา'
  | 'อุปกรณ์'
  | 'บริการ'
  | 'คอนสทรัคชั่น'
  | 'อาหาร'
  | 'เวชภัณฑ์'
  | 'สารปรับสภาพน้ำ'

export type ICategoryValue =
  | 'fish'
  | 'equipment'
  | 'service'
  | 'construction'
  | 'food'
  | 'medicine'
  | 'microorganism'
