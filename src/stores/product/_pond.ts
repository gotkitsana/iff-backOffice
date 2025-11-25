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
  name: string,
  greenhouse: string // ชื่อกรีนเฮ้า
  code: string // รหัสบ่อ
  images: { filename: string; type: string }[]
  width: number // กว้าง (เมตร)
  length: number // ยาว (เมตร)
  depth: number // ลึก (เมตร)
  note: string // หมายเหตุ
}

export interface IUpdatePondPayload extends ICreatePondPayload {
  _id: string
  active: boolean
}

export interface IPond {
  _id: string
  name: string,
  greenhouse: {
    _id: string
    name: string
    active: boolean
    note: string
    cat: number
    uat: number
  } // ชื่อกรีนเฮ้า
  code: string // รหัสบ่อ
  images: { filename: string; type: string }[]
  width: number // กว้าง (เมตร)
  length: number // ยาว (เมตร)
  depth: number // ลึก (เมตร)
  note: string // หมายเหตุ
  active: boolean
  cat: string
  uat: string
}
