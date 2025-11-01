import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useSeedSizeStore = defineStore('seedSize', () => {
  async function onGetSeedSizes() {
    const { data } = await api.get(`/seedsize`)
    return data.data
  }

  async function onCreateSeedSize(payload: ICreateSeedSizePayload) {
    const { data } = await api.post(`/seedsize`, payload)
    return data
  }

  async function onUpdateSeedSize(payload: IUpdateSeedSizePayload) {
    const { data } = await api.put(`/seedsize`, payload)
    return data
  }

  async function onDeleteSeedSize(id: string) {
    const { data } = await api.delete(`/seedsize?id=${id}`)
    return data
  }

  return {
    onGetSeedSizes,
    onCreateSeedSize,
    onUpdateSeedSize,
    onDeleteSeedSize,
  }
})

export interface ISeedSize {
  _id: string
  name: string
  active: boolean
  note: string
  cat: number
  uat: number
  value: number
}

export interface ICreateSeedSizePayload {
  name: string
  note: string
}

export interface IUpdateSeedSizePayload extends ICreateSeedSizePayload {
  _id: string
}
