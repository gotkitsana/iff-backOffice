import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useSalePercentStore = defineStore('salePercent', () => {
  async function onGetSalePercents() {
    const { data } = await api.get(`/sale/percent`)
    return data.data
  }

  async function onCreateSalePercent(payload: ICreateSalePercentPayload) {
    const { data } = await api.post(`/sale/percent`, payload)
    return data
  }

  async function onUpdateSalePercent(payload: IUpdateSalePercentPayload) {
    const { data } = await api.put(`/sale/percent`, payload)
    return data
  }

  async function onDeleteSalePercent(id: string) {
    const { data } = await api.delete(`/sale/percent?id=${id}`)
    return data
  }

  const PercentNameOptions = [
    { label: 'ราคาลูกค้า', value: 'customerPrice' },
    { label: 'ราคาพ่อค้า', value: 'dealerPrice' },
  ]

  return {
    onGetSalePercents,
    onCreateSalePercent,
    onUpdateSalePercent,
    onDeleteSalePercent,

    PercentNameOptions,
  }
})

export interface ISalePercent {
  _id: string
  name: string
  active: boolean
  note: string
  cat: number
  uat: number
  percent: number
  category: {
    _id: string
    name: string
  }
}

export interface ICreateSalePercentPayload {
  name: string
  percent: number
  category: string
  note: string
}

export interface IUpdateSalePercentPayload extends ICreateSalePercentPayload {
  _id: string
}
