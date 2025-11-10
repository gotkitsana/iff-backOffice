import api from '@/utils/axios'
import { defineStore } from 'pinia'

export const useUploadFileStore = defineStore('uploadFile', () => {
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

  async function onDeleteImage(filename: string) {
    const { data } = await api.delete(`/storage?name=${filename}`)
    return data
  }

  async function onUploadVideo(video: File) {
    const formData = new FormData()
    formData.append('file', video)

    const { data } = await api.post(`/storage/upload/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }

  async function onGetVideoStorage() {
    const { data } = await api.get(`/storage/firebase`)
    return data.data
  }

  async function onDeleteVideo(filename: string) {
    const { data } = await api.delete(`/storage/video?name=${filename}`)
    return data
  }

  return {
    onUploadImage,
    onDeleteImage,

    onUploadVideo,
    onGetVideoStorage,
    onDeleteVideo,
  }
})

export interface IGetFirebaseStorageResponse {
  _id: string
  name: string
  url: string
  cat: number
}
