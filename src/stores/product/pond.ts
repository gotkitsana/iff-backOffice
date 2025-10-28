import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const usePondStore = defineStore('pond', () => {
  async function onGetPonds() {
    const { data } = await api.get(`/fishpond`)
    return data.data
  }

  async function onCreatePond(payload: ICreatePondPayload) {
    const { data } = await api.post(`/fishpond`, payload)
    return data
  }

  async function onUpdatePond(payload: IUpdatePondPayload) {
    const { data } = await api.put(`/fishpond`, payload)
    return data
  }

  async function onDeletePond(id: string) {
    const { data } = await api.delete(`/fishpond?id=${id}`)
    return data
  }

  async function onUploadImage(image: File) {
    const formData = new FormData()
    formData.append('imageFile', image)

    const { data } = await api.post(`/storage/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }


  return {
    onGetPonds,
    onCreatePond,
    onUpdatePond,
    onUploadImage,
    onDeletePond,
  }
})

export interface ICreatePondPayload {
  name: string
  code: string
  images: { filename: string; type: string }[]
}

export interface IUpdatePondPayload extends ICreatePondPayload {
  _id: string
  active: boolean
}

export interface IPond {
  _id: string
  name: string
  code: string
  images: { filename: string; type: string }[]
  active: boolean
  cat: string
  uat: string
}
