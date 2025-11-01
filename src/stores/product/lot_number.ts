import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useLotNumberStore = defineStore('lotNumber', () => {
  async function onGetLotNumbers() {
    const { data } = await api.get(`/lot/number`)
    return data.data
  }

  async function onCreateLotNumber(payload: ICreateLotNumberPayload) {
    const { data } = await api.post(`/lot/number`, payload)
    return data
  }

  async function onUpdateLotNumber(payload: IUpdateLotNumberPayload) {
    const { data } = await api.put(`/lot/number`, payload)
    return data
  }

  async function onDeleteLotNumber(id: string) {
    const { data } = await api.delete(`/lot/number?id=${id}`)
    return data
  }

  return {
    onGetLotNumbers,
    onCreateLotNumber,
    onUpdateLotNumber,
    onDeleteLotNumber,
  }
})

export interface ILotNumber {
  _id: string
  name: string
  note: string
  active: boolean
  cat: number
  uat: number
}

export interface ICreateLotNumberPayload {
  name: string
  note: string
}

export interface IUpdateLotNumberPayload extends ILotNumber {
  _id: string
  active: boolean
}
