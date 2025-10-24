import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useSpeciesStore = defineStore('species', () => {
  async function onGetSpecies() {
    const { data } = await api.get(`/species`)
    return data.data
  }

  async function onGetSpeciesByID(id: string) {
    const { data } = await api.get(`/species?id=${id}`)
    return data.data
  }

  async function onCreateSpecies(payload: any) {
    const { data } = await api.post(`/species`, payload)
    return data
  }

  async function onUpdateSpecies(payload: any) {
    const { data } = await api.put(`/species`, payload)
    return data
  }

  async function onDeleteProduct(id: string) {
    const { data } = await api.delete(`/species?id=${id}`)
    return data
  }

  return {
    onGetSpecies,
    onGetSpeciesByID,

    onCreateSpecies,
    onUpdateSpecies,
    onDeleteProduct,
  }
})


