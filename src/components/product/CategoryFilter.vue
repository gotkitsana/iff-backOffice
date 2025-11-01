<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Select, InputText, InputNumber } from 'primevue'
import {
  useProductStore,
  type IFishFilters,
  type IFoodFilters,
  type IMicroorganismFilters,
  type IProduct,
} from '../../stores/product/product'
import { type ICategory } from '../../stores/product/category'
import { useSpeciesStore, type ISpecies } from '@/stores/product/species'
import { useQuery } from '@tanstack/vue-query'
import { useFarmStore, type IFarm } from '@/stores/product/farm'

// Props
const props = defineProps<{
  selectedCategory: ICategory | null
  productsCategory: IProduct[]

  foodFilters?: IFoodFilters
  fishFilters?: IFishFilters
  microorganismFilters?: IMicroorganismFilters
}>()

// Emits
const emit = defineEmits<{
  'open-add-modal': []
  'open-export-modal': []

  'update-food-filters': [filters: IFoodFilters]
  'update-fish-filters': [filters: IFishFilters]
  'update-microorganism-filters': [filters: IMicroorganismFilters]
  'update-category-selector': []
}>()

const foodSeedTypeOptions = [
  { label: 'ลอย', value: 'ลอย' },
  { label: 'จม', value: 'จม' },
]

const genderOptions = [
  { label: 'ตัวผู้', value: 1 },
  { label: 'ตัวเมีย', value: 2 },
]

const ageOptions = [
  { label: 'Tosai (6เดือน-1ปี)', value: 'tosai' },
  { label: 'Nisai (1-2ปี)', value: 'nisai' },
  { label: 'Sansai (2-3ปี)', value: 'sansai' },
  { label: 'Yonsai (3-4ปี)', value: 'yonsai' },
  { label: 'Rokusai (4-5ปี)', value: 'rokusai' },
]

const foodSeedSizeOptions = [
  { label: 'SS', value: 0 },
  { label: 'S', value: 1 },
  { label: 'M', value: 2 },
  { label: 'L', value: 3 },
  { label: 'XL', value: 4 },
]

const localFoodFilters = ref<IFoodFilters>({
  sku: props.foodFilters?.sku || '',
  brandName: props.foodFilters?.brandName || '',
  foodType: props.foodFilters?.foodType || '',
  seedType: props.foodFilters?.seedType || '',
  seedSize: props.foodFilters?.seedSize || null,
})

const localFishFilters = ref<IFishFilters>({
  sku: props.fishFilters?.sku || '',
  species: props.fishFilters?.species || '',
  age: props.fishFilters?.age || '',
  farm: props.fishFilters?.farm || '',
  gender: props.fishFilters?.gender || '',
  size: props.fishFilters?.size || null,
  price: props.fishFilters?.price || null,
})

const localMicroorganismFilters = ref<IMicroorganismFilters>({
  sku: props.microorganismFilters?.sku || '',
  brandName: props.microorganismFilters?.brandName || '',
})

// Computed
const isFishSelected = computed(() => {
  return props.selectedCategory?.value === 'fish'
})
const isFoodSelected = computed(() => {
  return props.selectedCategory?.value === 'food'
})

const isMicroorganismSelected = computed(() => {
  return props.selectedCategory?.value === 'microorganism'
})

const updateFoodFilter = (key: string, value: any) => {
  localFoodFilters.value[key as keyof typeof localFoodFilters.value] = value as never
  emit('update-food-filters', { ...localFoodFilters.value })
}

const updateMicroorganismFilter = (key: string, value: any) => {
  localMicroorganismFilters.value[key as keyof typeof localMicroorganismFilters.value] =
    value as never
  emit('update-microorganism-filters', { ...localMicroorganismFilters.value })
}

const updateFishFilter = (key: string, value: any) => {
  localFishFilters.value[key as keyof typeof localFishFilters.value] = value as never
  emit('update-fish-filters', { ...localFishFilters.value })
}

const clearFilters = () => {
  if (props.selectedCategory?.value === 'food') {
    localFoodFilters.value = {
      sku: '',
      brandName: '',
      foodType: '',
      seedType: '',
      seedSize: null,
    }
    emit('update-food-filters', { ...localFoodFilters.value })
  } else if (props.selectedCategory?.value === 'fish') {
    localFishFilters.value = {
      sku: '',
      species: '',
      age: '',
      farm: '',
      gender: '',
      size: null,
      price: null,
    }
    emit('update-fish-filters', { ...localFishFilters.value })
  } else if (props.selectedCategory?.value === 'microorganism') {
    localMicroorganismFilters.value = {
      sku: '',
      brandName: '',
    }
    emit('update-microorganism-filters', { ...localMicroorganismFilters.value })
  }
}


const productStore = useProductStore()
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
</script>

<template>
  <div class="space-y-4">

    <!-- Main Filter Section -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center flex-wrap justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-[600]! text-gray-800">หมวดหมู่: {{ props.selectedCategory?.name }}</h3>
        </div>

        <div class="flex items-center flex-wrap gap-2">
          <Button
            label="นำเข้า"
            icon="pi pi-file-import"
            severity="success"
            size="small"
            @click="$emit('open-add-modal')"
          />

          <Button
            label="เบิกออก"
            icon="pi pi-file-export"
            severity="success"
            size="small"
            @click="$emit('open-export-modal')"
          />

          <Button
            label="ตั้งค่า"
            icon="pi pi-cog"
            severity="info"
            size="small"
            @click="$router.push('/product/options-settings')"
          />

          <Button
            label="เปลี่ยนหมวดหมู่"
            icon="pi pi-sync"
            severity="secondary"
            size="small"
            @click="$emit('update-category-selector')"
          />
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-if="isFishSelected"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 items-end"
        >
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">รหัสปลา</label>
            <InputText
              :model-value="localFishFilters.sku"
              @update:model-value="updateFishFilter('sku', $event)"
              placeholder="ระบุรหัสปลา"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">สายพันธุ์</label>
            <Select
              :model-value="localFishFilters.species"
              @update:model-value="updateFishFilter('species', $event)"
              :options="speciesOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสายพันธุ์"
              size="small"
              fluid
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">อายุ</label>
            <Select
              :model-value="localFishFilters.age"
              @update:model-value="updateFishFilter('age', $event)"
              :options="ageOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกอายุ"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ฟาร์ม</label>
            <Select
              :model-value="localFishFilters.farm"
              @update:model-value="updateFishFilter('farm', $event)"
              :options="farmOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกฟาร์ม"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เพศ</label>
            <Select
              :model-value="localFishFilters.gender"
              @update:model-value="updateFishFilter('gender', $event)"
              :options="productStore.genderOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกเพศ"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ไซด์ (ซม.)</label>
            <InputNumber
              :model-value="localFishFilters.size"
              @update:model-value="updateFishFilter('size', $event)"
              placeholder="ระบุไซด์"
              size="small"
              fluid
              :min="0"
              :min-fraction-digits="2"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ราคา</label>
            <InputNumber
              :model-value="localFishFilters.price"
              @update:model-value="updateFishFilter('price', $event)"
              placeholder="ระบุราคา"
              size="small"
              fluid
              :min="0"
            />
          </div>
        </div>

        <div
          v-if="isFoodSelected"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 items-end"
        >
          <!-- รหัสอาหาร -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">รหัสอาหาร</label>
            <InputText
              :model-value="localFoodFilters.sku"
              @update:model-value="updateFoodFilter('sku', $event)"
              placeholder="ระบุรหัสอาหาร"
              size="small"
              fluid
              showClear
            />
          </div>

          <!-- ชื่อแบรนด์ -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อแบรนด์</label>
            <InputText
              :model-value="localFoodFilters.brandName"
              @update:model-value="updateFoodFilter('brandName', $event)"
              placeholder="ระบุชื่อแบรนด์"
              size="small"
              fluid
            />
          </div>

          <!-- ประเภทอาหาร -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภทอาหาร</label>
            <InputText
              :model-value="localFoodFilters.foodType"
              @update:model-value="updateFoodFilter('foodType', $event)"
              placeholder="ระบุประเภทอาหาร"
              size="small"
              fluid
            />
          </div>

          <!-- ชนิดเม็ด -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชนิดเม็ด</label>
            <Select
              :model-value="localFoodFilters.seedType"
              @update:model-value="updateFoodFilter('seedType', $event)"
              :options="foodSeedTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกชนิดเม็ด"
              size="small"
              fluid
            />
          </div>

          <!-- ขนาดเม็ด -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ขนาดเม็ด</label>
            <Select
              :model-value="localFoodFilters.seedSize"
              @update:model-value="updateFoodFilter('seedSize', $event)"
              :options="foodSeedSizeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกขนาดเม็ด"
              size="small"
              fluid
            />
          </div>
        </div>

        <div
          v-if="isMicroorganismSelected"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 items-end"
        >
          <!-- รหัสสารปรับสภาพน้ำ -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">รหัสสารปรับสภาพน้ำ</label>
            <InputText
              :model-value="localMicroorganismFilters.sku"
              @update:model-value="updateMicroorganismFilter('sku', $event)"
              placeholder="รหัสสารปรับสภาพน้ำ"
              size="small"
              fluid
              showClear
            />
          </div>

          <!-- ชื่อแบรนด์ -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชื่อแบรนด์</label>
            <InputText
              :model-value="localMicroorganismFilters.brandName"
              @update:model-value="updateMicroorganismFilter('brandName', $event)"
              placeholder="ระบุชื่อแบรนด์"
              size="small"
              fluid
            />
          </div>
        </div>

        <Button
          label="ล้างกรอง"
          icon="pi pi-times"
          variant="text"
          severity="danger"
          size="small"
          @click="clearFilters"
        />
      </div>
    </div>
  </div>
</template>
