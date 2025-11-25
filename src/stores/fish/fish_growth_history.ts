import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useFishGrowthHistoryStore = defineStore('fishGrowthHistory', () => {
  async function onGetAllFishGrowthHistory() {
    const { data } = await api.get(`/growth/history`)
    return data.data
  }

  async function onGetFishGrowthHistoryProduct(id: string) {
    const { data } = await api.get(`/growth/history?product=${id}`)
    return data.data
  }

  async function onGetFishGrowthHistoryID(id: string) {
    const { data } = await api.get(`/growth/history?id=${id}`)
    return data.data
  }

  async function onAddFishGrowthHistory(payload: IFishGrowthHistoryPayload) {
    const { data } = await api.post(`/growth/history`, payload)
    return data
  }

  async function onUpdateFishGrowthHistory(payload: IUpdateFishGrowthHistoryPayload) {
    const { data } = await api.put(`/growth/history`, payload)
    return data
  }

  async function onDeleteFishGrowthHistory(id: string) {
    const { data } = await api.delete(`/growth/history?id=${id}`)
    return data
  }

  return {
    onGetAllFishGrowthHistory,
    onGetFishGrowthHistoryProduct,
    onGetFishGrowthHistoryID,
    onAddFishGrowthHistory,
    onUpdateFishGrowthHistory,
    onDeleteFishGrowthHistory,
  }
})

export interface IFishGrowthHistory {
  _id: string
  product: string
  date: number
  size: number
  weight: number
  gender: string
  price: number
  note: string
  cat: number
  uat: number
  __v: number
}

export interface IFishGrowthHistoryPayload {
  product: string // id of product
  date: number // timestamp
  size: number // size of fish
  weight: number // weight of fish
  gender: string // gender of fish
  price: number // price of fish
  note: string // note of fish
}

export interface IUpdateFishGrowthHistoryPayload extends IFishGrowthHistoryPayload {
  _id: string
}
