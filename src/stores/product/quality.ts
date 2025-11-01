import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useQualityStore = defineStore('quality', () => {
  async function onGetQuality() {
    const { data } = await api.get(`/quality`)
    return data.data
  }

  async function onCreateQuality(payload: ICreateQualityPayload) {
    const { data } = await api.post(`/quality`, payload)
    return data
  }

  async function onUpdateQuality(payload: IUpdateQualityPayload) {
    const { data } = await api.put(`/quality`, payload)
    return data
  }

  async function onDeleteQuality(id: string) {
    const { data } = await api.delete(`/quality?id=${id}`)
    return data
  }

  return {
    onGetQuality,
    onCreateQuality,
    onUpdateQuality,
    onDeleteQuality,
  }
})

export interface IQuality {
  _id: string
  name: string
  note: string
  active: boolean
  cat: number
  uat: number
}

export interface ICreateQualityPayload {
  name: string
  note: string
}

export interface IUpdateQualityPayload extends IQuality {
  _id: string
  active: boolean
}
