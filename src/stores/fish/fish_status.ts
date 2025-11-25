import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useFishStatusStore = defineStore('fishStatus', () => {
  async function onGetFishStatus() {
    const { data } = await api.get(`/fish/status`)
    return data.data
  }

  async function onCreateFishStatus(payload: ICreateFishStatusPayload) {
    const { data } = await api.post(`/fish/status`, payload)
    return data
  }

  async function onUpdateFishStatus(payload: IUpdateFishStatusPayload) {
    const { data } = await api.put(`/fish/status`, payload)
    return data
  }

  async function onDeleteFishStatus(id: string) {
    const { data } = await api.delete(`/fish/status?id=${id}`)
    return data
  }

  return {
    onGetFishStatus,
    onCreateFishStatus,
    onUpdateFishStatus,
    onDeleteFishStatus,
  }
})

export interface IFishStatus {
  _id: string
  name: string
  active: boolean
  note: string
  cat: number
  uat: number
}

export interface ICreateFishStatusPayload {
  name: string
  note: string
}

export interface IUpdateFishStatusPayload extends ICreateFishStatusPayload {
  _id: string
}
