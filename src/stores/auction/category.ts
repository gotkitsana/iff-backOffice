import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useCategoryStore = defineStore('category', () => {
  async function onGetCategory({ type }: { type: number }) {
    const { data } = await api.get(`/category?type=${type}`)
    return data.data
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

  return {
    onGetCategory,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
  }
})

export type ICategory = {
  _id: string
  type: number
  name: string
  cat: number
  uat: number
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
