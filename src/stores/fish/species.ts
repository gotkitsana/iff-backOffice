import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useSpeciesStore = defineStore('species', () => {
  async function onGetSpecies() {
    const { data } = await api.get(`/species`)
    return data.data
  }

  async function onCreateSpecies(payload: ICreateSpeciesPayload) {
    const { data } = await api.post(`/species`, payload)
    return data
  }

  async function onUpdateSpecies(payload: IUpdateSpeciesPayload) {
    const { data } = await api.put(`/species`, payload)
    return data
  }

  async function onDeleteProduct(id: string) {
    const { data } = await api.delete(`/species?id=${id}`)
    return data
  }

  return {
    onGetSpecies,

    onCreateSpecies,
    onUpdateSpecies,
    onDeleteProduct,
  }
})

export interface ISpecies {
  _id: string
  name: string
  detail: string
  active: boolean
  cat: number
  uat: number
}

export interface ICreateSpeciesPayload {
  name: string
  detail: string
}

export interface IUpdateSpeciesPayload extends ISpecies {
  _id: string
  active: boolean
}
