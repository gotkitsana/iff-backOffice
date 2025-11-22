<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Card, Button } from 'primevue'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/product/greenhouse'
import { usePondStore, type IPond } from '@/stores/product/pond'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useCategoryStore } from '@/stores/product/category'
import { useRouter } from 'vue-router'

const router = useRouter()
const greenhouseStore = useGreenhouseStore()
const pondStore = usePondStore()
const productStore = useProductStore()
const categoryStore = useCategoryStore()

// Get fish category
const { data: categories } = useQuery({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const fishCategory = computed(() => {
  return categories.value?.find((c) => c.value === 'fish')
})

// Get all greenhouses
const { data: greenhouses, isLoading: isLoadingGreenhouses } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})

// Get all ponds
const { data: ponds, isLoading: isLoadingPonds } = useQuery<IPond[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})

// Get all fish products
const { data: products, isLoading: isLoadingProducts } = useQuery<IProduct[]>({
  queryKey: ['get_products_by_category', fishCategory.value?._id],
  queryFn: () => productStore.onGetProductsByCategory(fishCategory.value?._id || ''),
  enabled: computed(() => !!fishCategory.value?._id),
})

// Group ponds by greenhouse
const pondsByGreenhouse = computed(() => {
  if (!ponds.value || !greenhouses.value) return []

  return greenhouses.value.map((greenhouse) => {
    const greenhousePonds =
      ponds.value?.filter((pond) => pond.greenhouse?._id === greenhouse._id) || []

    return {
      greenhouse,
      ponds: greenhousePonds.map((pond) => {
        // Count fish in this pond
        const fishInPond =
          products.value?.filter(
            (product) => product.fishpond?._id === pond._id && !product.sold
          ) || []

        // Calculate pond volume
        const volumeInCubicMeters = pond.width * pond.length * pond.depth
        const volumeInLiters = volumeInCubicMeters * 1000

        return {
          ...pond,
          fishCount: fishInPond.length,
          volume: volumeInLiters,
        }
      }),
    }
  })
})

const formatVolume = (liters: number) => {
  if (liters >= 1000000) {
    return `${(liters / 1000000).toFixed(2)} ล้านลิตร`
  } else if (liters >= 1000) {
    return `${(liters / 1000).toFixed(2)} พันลิตร`
  }
  return `${liters.toLocaleString()} ลิตร`
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600"
          >
            <i class="pi pi-map text-white text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">แผนผังกรีนเฮาส์</h2>
            <p class="text-sm text-gray-600">ดูตำแหน่งกรีนเฮาส์และบ่อปลา</p>
          </div>
        </div>
        <Button
          label="กลับ"
          icon="pi pi-arrow-left"
          severity="secondary"
          size="small"
          @click="goBack"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoadingGreenhouses || isLoadingPonds || isLoadingProducts"
      class="flex items-center justify-center py-12"
    >
      <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <!-- Greenhouse Map -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="item in pondsByGreenhouse"
        :key="item.greenhouse._id"
        :pt="{ body: 'p-4' }"
        class="hover:shadow-lg transition-shadow duration-200"
      >
        <template #content>
          <!-- Greenhouse Header -->
          <div class="mb-4 pb-4 border-b border-gray-200">
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-600"
              >
                <i class="pi pi-sun text-white text-lg"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ item.greenhouse.name }}</h3>
                <p v-if="item.greenhouse.note" class="text-xs text-gray-500">
                  {{ item.greenhouse.note }}
                </p>
              </div>
            </div>
          </div>

          <!-- Ponds List -->
          <div v-if="item.ponds.length > 0" class="space-y-3">
            <div
              v-for="pond in item.ponds"
              :key="pond._id"
              class="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <i class="pi pi-inbox text-blue-600"></i>
                  <span class="font-medium text-gray-900">บ่อ {{ pond.code }}</span>
                </div>
                <span
                  v-if="pond.fishCount > 0"
                  class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                >
                  {{ pond.fishCount }} ตัว
                </span>
              </div>

              <div class="space-y-1 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <i class="pi pi-ruler text-gray-400 text-xs"></i>
                  <span> ขนาด: {{ pond.width }} x {{ pond.length }} x {{ pond.depth }} เมตร </span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-tint text-gray-400 text-xs"></i>
                  <span>ปริมาตร: {{ formatVolume(pond.volume) }}</span>
                </div>
                <div v-if="pond.note" class="flex items-start gap-2 mt-2">
                  <i class="pi pi-info-circle text-gray-400 text-xs mt-0.5"></i>
                  <span class="text-xs text-gray-500">{{ pond.note }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-6 text-gray-400">
            <i class="pi pi-inbox text-3xl mb-2"></i>
            <p class="text-sm">ยังไม่มีบ่อปลา</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div
      v-if="!isLoadingGreenhouses && !isLoadingPonds && pondsByGreenhouse.length === 0"
      class="bg-white border border-gray-200 rounded-xl p-12 text-center"
    >
      <i class="pi pi-sun text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500">ยังไม่มีกรีนเฮาส์</p>
    </div>
  </div>
</template>

