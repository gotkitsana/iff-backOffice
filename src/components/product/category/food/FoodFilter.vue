<script setup lang="ts">
import { computed } from 'vue'
import { Select, InputText, Slider, Button } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import type { IFoodFilters } from '@/stores/product/product'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'
import { useFoodTypeStore, type IFoodType } from '@/stores/product/food_type'
import { useSeedSizeStore, type ISeedSize } from '@/stores/product/seed_size'
import { useLotNumberStore, type ILotNumber } from '@/stores/product/lot_number'
import { getProductImageUrl } from '@/utils/imageUrl'
import { type ICategory } from '@/stores/product/category'
import FilterHeader from '@/components/product/UI/FilterHeader.vue'
import { useFilterState } from '@/composables/useFilterState'

const props = defineProps<{
  filters: IFoodFilters
  category: ICategory
}>()

const emit = defineEmits<{
  'update-filters': [filters: IFoodFilters]
  'open-add-modal': []
  'open-export-modal': []
}>()

const foodSeedTypeOptions = [
  { label: 'ลอย', value: 'ลอย' },
  { label: 'จม', value: 'จม' },
]

const maxProductPrice = 50000

const defaultFilters: IFoodFilters = {
  sku: '',
  lotNumber: '',
  brandName: '',
  foodtype: '',
  seedType: '',
  seedSize: '',
  priceMin: 0,
  priceMax: maxProductPrice,
}

const { localFilters, updateFilter, clearFilters, formatCurrency } = useFilterState<IFoodFilters>(
  props.filters,
  emit,
  defaultFilters
)

const foodPriceRange = computed({
  get: () => [
    localFilters.value.priceMin || 0,
    localFilters.value.priceMax || maxProductPrice,
  ],
  set: (value: number[]) => {
    localFilters.value.priceMin = value[0]
    localFilters.value.priceMax = value[1]
  },
})

const getImageUrl = (image: string) => {
  return getProductImageUrl(image)
}

// Stores & Queries
const foodBrandStore = useFoodBrandStore()
const { data: foodBrands } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})
const foodBrandOptions = computed(() => {
  if (!foodBrands.value) return []
  return foodBrands.value
    ?.filter((p) => p.category._id === props.category._id)
    .map((p) => ({
      label: p.name,
      value: p._id,
      image: p.image ? getImageUrl(p.image) : null,
    }))
})

const foodTypeStore = useFoodTypeStore()
const { data: foodTypes } = useQuery<IFoodType[]>({
  queryKey: ['get_food_types'],
  queryFn: () => foodTypeStore.onGetFoodTypes(),
})
const foodTypeOptions = computed(() => {
  return foodTypes.value?.map((p) => ({
    label: p.name,
    value: p._id,
  }))
})

const seedSizeStore = useSeedSizeStore()
const { data: seedSizes } = useQuery<ISeedSize[]>({
  queryKey: ['get_seed_sizes'],
  queryFn: () => seedSizeStore.onGetSeedSizes(),
})
const seedSizeOptions = computed(() => {
  return seedSizes.value?.map((p) => ({
    label: p.name,
    value: p._id,
  }))
})

const lotNumberStore = useLotNumberStore()
const { data: lotNumbers } = useQuery<ILotNumber[]>({
  queryKey: ['get_lot_numbers'],
  queryFn: () => lotNumberStore.onGetLotNumbers(),
})
const lotNumberOptions = computed(() => {
  if (!lotNumbers.value) return []
  return lotNumbers.value
    ?.filter((p) => p.category._id === props.category._id)
    .map((p) => ({
      label: p.name,
      value: p._id,
    }))
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <FilterHeader :category-name="props.category.name" @open-add-modal="$emit('open-add-modal')"
      @open-export-modal="$emit('open-export-modal')" />

    <div class="space-y-3">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        <!-- รหัสอาหาร -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">รหัสอาหาร</label>
          <InputText :model-value="localFilters.sku" @update:model-value="updateFilter('sku', $event)"
            placeholder="ระบุรหัสอาหาร" size="small" fluid showClear />
        </div>

        <!-- ชื่อแบรนด์ -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อแบรนด์</label>
          <Select :model-value="localFilters.brandName" @update:model-value="updateFilter('brandName', $event)"
            :options="foodBrandOptions" optionLabel="label" optionValue="value" placeholder="เลือกชื่อแบรนด์"
            size="small" fluid filter>
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <img v-if="slotProps.option.image" :src="slotProps.option.image" alt="Brand Image"
                  class="w-auto h-8 rounded" />
                <i v-else class="pi pi-image text-gray-400 text-lg"></i>
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Select>
        </div>

        <!-- ประเภทอาหาร -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภทอาหาร</label>
          <Select :model-value="localFilters.foodtype" @update:model-value="updateFilter('foodtype', $event)"
            placeholder="เลือกประเภทอาหาร" :options="foodTypeOptions" optionLabel="label" optionValue="value"
            size="small" fluid filter />
        </div>

        <!-- ชนิดเม็ด -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">ชนิดเม็ด</label>
          <Select :model-value="localFilters.seedType" @update:model-value="updateFilter('seedType', $event)"
            :options="foodSeedTypeOptions" optionLabel="label" optionValue="value" placeholder="เลือกชนิดเม็ด"
            size="small" fluid filter />
        </div>

        <!-- ขนาดเม็ด -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">ขนาดเม็ด</label>
          <Select :model-value="localFilters.seedSize" @update:model-value="updateFilter('seedSize', $event)"
            :options="seedSizeOptions" optionLabel="label" optionValue="value" placeholder="เลือกขนาดเม็ด" size="small"
            fluid filter />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">เลขล็อต</label>
          <Select :model-value="localFilters.lotNumber" @update:model-value="updateFilter('lotNumber', $event)"
            :options="lotNumberOptions" optionLabel="label" optionValue="value" placeholder="เลือกเลขล็อต" size="small"
            fluid filter />
        </div>

        <div class="col-span-2">
          <label class="text-sm font-medium text-gray-700 mb-1 block"> ราคาท้องตลาด </label>
          <div class="px-2 py-1.5">
            <Slider v-model="foodPriceRange" @update:model-value="emit('update-filters', { ...localFilters })" :min="0"
              :max="maxProductPrice" :step="500" range fluid class="px-2" />
          </div>

          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{{ formatCurrency(foodPriceRange[0]) }}</span>
            <span>{{ formatCurrency(foodPriceRange[1]) }}</span>
          </div>
        </div>
      </div>

      <Button label="ล้างกรอง" icon="pi pi-times" variant="text" severity="danger" size="small" @click="clearFilters" />
    </div>
  </div>
</template>
