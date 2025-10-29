import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useFarmStore = defineStore('farm', () => {
  async function onGetFarms() {
    const { data } = await api.get(`/farm`)
    return data.data
  }

  async function onCreateFarm(payload: ICreateFarmPayload) {
    const { data } = await api.post(`/farm`, payload)
    return data
  }

  async function onUpdateFarm(payload: IUpdateFarmPayload) {
    const { data } = await api.put(`/farm`, payload)
    return data
  }

  async function onDeleteFarm(id: string) {
    const { data } = await api.delete(`/farm?id=${id}`)
    return data
  }

  return {
    onGetFarms,
    onCreateFarm,
    onUpdateFarm,
    onDeleteFarm,
  }
})

export interface IFarm {
  _id: string
  name: string
  active: boolean
  note: string
  cat: number
  uat: number
}

export interface ICreateFarmPayload {
  name: string
  note: string
}

export interface IUpdateFarmPayload extends ICreateFarmPayload {
  _id: string
}
