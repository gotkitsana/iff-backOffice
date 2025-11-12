import type { IFoodSale } from '@/stores/product/food_sale'
import type {
  IFishFilters,
  IFoodFilters,
  IMicroorganismFilters,
  IProduct,
} from '@/stores/product/product'
import { computed, ref } from 'vue'

// src/composables/useProductFilters.ts
export function useProductFilters() {
  const foodFilters = ref<IFoodFilters>({
    sku: '',
    brandName: '',
    lotNumber: '',
    foodtype: '',
    seedType: '',
    seedSize: '',
    priceMin: 0,
    priceMax: 50000,
  })

  const foodRetailFilters = ref<IFoodFilters>({
    sku: '',
    brandName: '',
    lotNumber: '',
    foodtype: '',
    seedType: '',
    seedSize: '',
    priceMin: 0,
    priceMax: 1000,
  })

  const microorganismFilters = ref<IMicroorganismFilters>({
    sku: '',
    brandName: '',
    priceMin: 0,
    priceMax: 50000,
    lotNumber: '',
  })

  const fishFilters = ref<IFishFilters>({
    sku: '',
    lotNumber: '',
    species: '',
    age: '',
    farm: '',
    gender: '',
    size: null,
    price: null,
    priceMin: 0,
    priceMax: 500000,
    sizeMin: 0,
    sizeMax: 200,
  })

  const applyFoodFilters = (products: IProduct[]) => {
    let filtered = [...products]
    if (foodFilters.value.sku) {
      filtered = filtered.filter((p) =>
        p.sku?.toLowerCase().includes(foodFilters.value.sku.toLowerCase()),
      )
    }
    if (foodFilters.value.lotNumber) {
      filtered = filtered.filter((p) => p.lotNumber?._id === foodFilters.value.lotNumber)
    }
    if (foodFilters.value.brandName) {
      filtered = filtered.filter((p) => p.brand?._id === foodFilters.value.brandName)
    }
    if (foodFilters.value.foodtype) {
      filtered = filtered.filter((p) => p.foodtype?._id === foodFilters.value.foodtype)
    }
    if (foodFilters.value.seedType) {
      filtered = filtered.filter((p) => p.seedType === foodFilters.value.seedType)
    }
    if (foodFilters.value.seedSize) {
      filtered = filtered.filter((p) => p.seedSize?._id === foodFilters.value.seedSize)
    }
    return filtered
  }

  const applyFishFilters = (products: IProduct[]) => {
    let filtered = [...products]
    if (fishFilters.value.sku) {
      filtered = filtered.filter((p) =>
        p.sku?.toLowerCase().includes(fishFilters.value.sku.toLowerCase()),
      )
    }
    if (fishFilters.value.lotNumber) {
      filtered = filtered.filter((p) => p.lotNumber?._id === fishFilters.value.lotNumber)
    }
    if (fishFilters.value.species) {
      filtered = filtered.filter((p) => p.species?._id === fishFilters.value.species)
    }
    if (fishFilters.value.age) {
      filtered = filtered.filter((p) => p.age?.includes(fishFilters.value.age))
    }
    if (fishFilters.value.farm) {
      filtered = filtered.filter((p) => p.farm?._id === fishFilters.value.farm)
    }
    if (fishFilters.value.gender) {
      filtered = filtered.filter((p) => p.gender === fishFilters.value.gender)
    }
    if (fishFilters.value.sizeMin && fishFilters.value.sizeMax) {
      filtered = filtered.filter(
        (p) => p.size && p.size >= fishFilters.value.sizeMin && p.size <= fishFilters.value.sizeMax,
      )
    }
    if (fishFilters.value.priceMin && fishFilters.value.priceMax) {
      filtered = filtered.filter(
        (p) => p.price >= fishFilters.value.priceMin && p.price <= fishFilters.value.priceMax,
      )
    }
    return filtered
  }

  const applyMicroorganismFilters = (products: IProduct[]) => {
    let filtered = [...products]

    if (microorganismFilters.value.sku) {
      filtered = filtered.filter((product) =>
        product.sku?.toLowerCase().includes(microorganismFilters.value.sku.toLowerCase()),
      )
    }

    if (microorganismFilters.value.lotNumber) {
      filtered = filtered.filter(
        (product) => product.lotNumber?._id === microorganismFilters.value.lotNumber,
      )
    }

    if (microorganismFilters.value.brandName) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(microorganismFilters.value.brandName.toLowerCase()),
      )
    }

    if (microorganismFilters.value.priceMin && microorganismFilters.value.priceMax) {
      filtered = filtered.filter(
        (product) =>
          product.food &&
          product.food?.marketPrice >= microorganismFilters.value.priceMin &&
          product.food?.marketPrice <= microorganismFilters.value.priceMax,
      )
    }

    return filtered
  }

  const applyFoodRetailFilters = (products: IFoodSale[]) => {
    let filtered = [...products]
    if (foodRetailFilters.value.sku) {
      filtered = filtered.filter((p) => p.product.sku?.toLowerCase().includes(foodRetailFilters.value.sku.toLowerCase()),
      )
    }
    if (foodRetailFilters.value.lotNumber) {
      filtered = filtered.filter((p) => p.product.lotNumber === foodRetailFilters.value.lotNumber)
    }
    if (foodRetailFilters.value.brandName) {
      filtered = filtered.filter((p) => p.product.brand === foodRetailFilters.value.brandName)
    }
    if (foodRetailFilters.value.foodtype) {
      filtered = filtered.filter((p) => p.product.foodtype === foodRetailFilters.value.foodtype)
    }
    if (foodRetailFilters.value.seedType) {
      filtered = filtered.filter((p) => p.product.seedType === foodRetailFilters.value.seedType)
    }
    if (foodRetailFilters.value.seedSize) {
      filtered = filtered.filter((p) => p.product.seedSize === foodRetailFilters.value.seedSize)
    }
    if (foodRetailFilters.value.priceMin && foodRetailFilters.value.priceMax) {
      filtered = filtered.filter(
        (p) =>
          p.priceKilo &&
          p.priceKilo >= foodRetailFilters.value.priceMin &&
          p.priceKilo <= foodRetailFilters.value.priceMax,
      )
    }
    return filtered
  }

  return {
    foodFilters,
    fishFilters,
    foodRetailFilters,
    microorganismFilters,
    applyFoodFilters,
    applyFishFilters,
    applyMicroorganismFilters,
    applyFoodRetailFilters,
  }
}
