<script setup lang="ts">
import { computed } from 'vue'
import { Select, InputText, Slider, Button } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import { useProductStore } from '@/stores/product/product'
import type { IFishFilters } from '@/stores/fish/fish_filters'
import { useSpeciesStore, type ISpecies } from '@/stores/fish/species'
import { useFarmStore, type IFarm } from '@/stores/fish/farm'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/fish/greenhouse'
import { usePondStore, type IPond } from '@/stores/fish/pond'
import { useLotNumberStore, type ILotNumber } from '@/stores/product/lot_number'
import { useFishStatusStore, type IFishStatus } from '@/stores/fish/fish_status'
import { type ICategory } from '@/stores/product/category'
import { useProductQuery } from '@/composables/useProductQuery'
import FilterHeader from '@/components/product/UI/FilterHeader.vue'
import { useFilterState } from '@/composables/useFilterState'

const props = defineProps<{
  filters: IFishFilters
  category: ICategory
}>()

const emit = defineEmits<{
  'update-filters': [filters: IFishFilters]
  'open-add-modal': []
  'open-export-modal': []
}>()

const productStore = useProductStore()
const { navigateWithQuery } = useProductQuery()

const ageOptions = [
  { label: 'Tosai (6เดือน-1ปี)', value: 'tosai' },
  { label: 'Nisai (1-2ปี)', value: 'nisai' },
  { label: 'Sansai (2-3ปี)', value: 'sansai' },
  { label: 'Yonsai (3-4ปี)', value: 'yonsai' },
  { label: 'Rokusai (4-5ปี)', value: 'rokusai' },
]

const maxFishPrice = 500000
const maxSize = 200

const defaultFilters: IFishFilters = {
  sku: '',
  lotNumber: '',
  species: '',
  age: '',
  farm: '',
  gender: '',
  greenhouse: '',
  fishpond: '',
  saleStatus: '',
  size: null,
  price: null,
  priceMin: 0,
  priceMax: maxFishPrice,
  sizeMin: 0,
  sizeMax: maxSize,
}

const { localFilters, updateFilter, clearFilters, formatCurrency } = useFilterState<IFishFilters>(
  props.filters,
  emit,
  defaultFilters
)

const fishSizeRange = computed({
  get: () => [localFilters.value.sizeMin || 0, localFilters.value.sizeMax || maxSize],
  set: (value: number[]) => {
    localFilters.value.sizeMin = value[0]
    localFilters.value.sizeMax = value[1]
  },
})

const fishPriceRange = computed({
  get: () => [
    localFilters.value.priceMin || 0,
    localFilters.value.priceMax || maxFishPrice,
  ],
  set: (value: number[]) => {
    localFilters.value.priceMin = value[0]
    localFilters.value.priceMax = value[1]
  },
})

const formatSize = (value: number) => {
  return `${value.toFixed(1)} ซม.`
}

// Stores & Queries
const speciesStore = useSpeciesStore()
const { data: species } = useQuery<ISpecies[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})
const speciesOptions = computed(() => {
  return species.value?.map((p) => ({
    label: p.name,
    value: p._id,
  }))
})

const farmStore = useFarmStore()
const { data: farms } = useQuery<IFarm[]>({
  queryKey: ['get_farms'],
  queryFn: () => farmStore.onGetFarms(),
})
const farmOptions = computed(() => {
  return farms.value?.map((p) => ({
    label: p.name,
    value: p._id,
  }))
})

const greenhouseStore = useGreenhouseStore()
const { data: greenhouses } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})
const greenhouseOptions = computed(() => {
  return greenhouses.value?.map((p) => ({
    label: p.name,
    value: p._id,
  }))
})

const pondStore = usePondStore()
const { data: ponds } = useQuery<IPond[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})
const pondOptions = computed(() => {
  if (!ponds.value) return []
  const ghId = localFilters.value.greenhouse || ''
  if (!ghId) {
    return ponds.value.map((p) => ({
      label: p.code,
      value: p._id,
    }))
  }
  return ponds.value
    .filter((p) => p.greenhouse?._id === ghId)
    .map((p) => ({
      label: p.code,
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

const fishStatusStore = useFishStatusStore()
const { data: fishStatuses } = useQuery<IFishStatus[]>({
  queryKey: ['get_fish_statuses'],
  queryFn: () => fishStatusStore.onGetFishStatus(),
})

const saleStatusOptions = computed(() => {
  const defaultOptions = [
    { label: 'รอประเมินราคา', value: 'wait-qc' },
    { label: 'พร้อมขาย', value: 'ready' },
    { label: 'ขายแล้ว', value: 'sold' },
  ]

  if (fishStatuses.value) {
    const statusOptions = fishStatuses.value.map((status) => ({
      label: status.name,
      value: status._id,
    }))
    return [...defaultOptions, ...statusOptions]
  }

  return defaultOptions
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <FilterHeader :category-name="props.category.name" @open-add-modal="$emit('open-add-modal')"
      @open-export-modal="$emit('open-export-modal')">
      <template #extra-actions>
        <Button label="แผนผัง" icon="pi pi-map" severity="secondary" size="small"
          @click="navigateWithQuery('/product/greenhouse-map')" />
      </template>
    </FilterHeader>

    <div class="space-y-3">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">เลขล็อต</label>
          <Select :model-value="localFilters.lotNumber" @update:model-value="updateFilter('lotNumber', $event)"
            :options="lotNumberOptions" optionLabel="label" optionValue="value" placeholder="เลือกเลขล็อต" size="small"
            fluid filter />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">ฟาร์ม</label>
          <Select :model-value="localFilters.farm" @update:model-value="updateFilter('farm', $event)"
            :options="farmOptions" optionLabel="label" optionValue="value" placeholder="เลือกฟาร์ม" size="small" fluid
            filter />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">รหัสปลา</label>
          <InputText :model-value="localFilters.sku" @update:model-value="updateFilter('sku', $event)"
            placeholder="ระบุรหัสปลา" size="small" fluid />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">เพศ</label>
          <Select :model-value="localFilters.gender" @update:model-value="updateFilter('gender', $event)"
            :options="productStore.genderOptions" optionLabel="label" optionValue="value" placeholder="เลือกเพศ"
            size="small" fluid filter />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">สายพันธุ์</label>
          <Select :model-value="localFilters.species" @update:model-value="updateFilter('species', $event)"
            :options="speciesOptions" optionLabel="label" optionValue="value" placeholder="เลือกสายพันธุ์" size="small"
            fluid filter />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">กรีนเฮาส์</label>
          <Select :model-value="localFilters.greenhouse" @update:model-value="updateFilter('greenhouse', $event)"
            :options="greenhouseOptions" optionLabel="label" optionValue="value" placeholder="เลือกกรีนเฮาส์"
            size="small" fluid filter />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">อายุ</label>
          <Select :model-value="localFilters.age" @update:model-value="updateFilter('age', $event)"
            :options="ageOptions" optionLabel="label" optionValue="value" placeholder="เลือกอายุ" size="small" fluid
            filter />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">บ่อปลา</label>
          <Select :model-value="localFilters.fishpond" @update:model-value="updateFilter('fishpond', $event)"
            :options="pondOptions" optionLabel="label" optionValue="value" placeholder="เลือกบ่อปลา" size="small" fluid
            filter :disabled="!localFilters.greenhouse" />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">สถานะ</label>
          <Select :model-value="localFilters.saleStatus" @update:model-value="updateFilter('saleStatus', $event)"
            :options="saleStatusOptions" optionLabel="label" optionValue="value" placeholder="เลือกสถานะ" size="small"
            fluid />
        </div>

        <div class="col-span-2">
          <label class="text-sm font-medium text-gray-700 mb-1 block">ไซด์ (ซม.)</label>
          <div class="px-2 py-1.5">
            <Slider v-model="fishSizeRange" @update:model-value="emit('update-filters', { ...localFilters })" :min="0"
              :max="maxSize" :step="0.5" range fluid class="px-2" />
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{{ formatSize(fishSizeRange[0]) }}</span>
            <span>{{ formatSize(fishSizeRange[1]) }}</span>
          </div>
        </div>

        <div class="col-span-2">
          <label class="text-sm font-medium text-gray-700 mb-1 block"> ราคา </label>
          <div class="px-2 py-1.5">
            <Slider v-model="fishPriceRange" @update:model-value="emit('update-filters', { ...localFilters })" :min="0"
              :max="maxFishPrice" :step="1000" range fluid class="px-2" />
          </div>

          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{{ formatCurrency(fishPriceRange[0]) }}</span>
            <span>{{ formatCurrency(fishPriceRange[1]) }}</span>
          </div>
        </div>
      </div>

      <Button label="ล้างกรอง" icon="pi pi-times" variant="text" severity="danger" size="small" @click="clearFilters" />
    </div>
  </div>
</template>
