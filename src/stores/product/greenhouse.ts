import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useGreenhouseStore = defineStore('greenhouse', () => {
  async function onGetGreenhouses() {
    const { data } = await api.get(`/greenhouse`)
    return data.data
  }

  async function onCreateGreenhouse(payload: ICreateGreenhousePayload) {
    const { data } = await api.post(`/greenhouse`, payload)
    return data
  }

  async function onUpdateGreenhouse(payload: IUpdateGreenhousePayload) {
    const { data } = await api.put(`/greenhouse`, payload)
    return data
  }

  async function onDeleteGreenhouse(id: string) {
    const { data } = await api.delete(`/greenhouse?id=${id}`)
    return data
  }


  return {
    onGetGreenhouses,
    onCreateGreenhouse,
    onUpdateGreenhouse,
    onDeleteGreenhouse,
  }
})


export interface IGreenhouse {
  _id: string
  name: string
  active: boolean
  note: string
  cat: number
  uat: number
}

export interface ICreateGreenhousePayload {
  name: string,
  note: string
}

export interface IUpdateGreenhousePayload extends ICreateGreenhousePayload {
  _id: string
}
