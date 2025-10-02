import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useAuctionStore = defineStore('auction', () => {
  async function onGetAuctions() {
    const { data } = await api.get(`/auction`)
    return data.data
  }

  async function onGetAuctionContent() {
    const { data } = await api.get(`/auction/content`)
    return data
  }

  async function onCreateAuctionContent(payload: IContentPayload) {
    const { data } = await api.post(`/auction/content`, payload)
    return data
  }

  async function onCreateAuction(payload: IAuctionPayload) {
    const { data } = await api.post(`/auction`, payload)
    return data
  }

  async function onUpdateAuction(payload: IUpdateAuctionPayload) {
    const { data } = await api.put(`/auction/category`, payload)
    return data
  }

  async function onDeleteAuction(id: string) {
    const { data } = await api.delete(`/category?id=${id}`)
    return data
  }

  return {
    onGetAuctions,
    onGetAuctionContent,

    onCreateAuction,
    onCreateAuctionContent,
    onUpdateAuction,
    onDeleteAuction,
  }
})

export type IContentPayload = {
  content: string
}

export type IAuctionPayload = {
  name: string
  type: number
}

export type IUpdateAuctionPayload = {
  _id: string
  name: string
  cat: number
  type: number
}
