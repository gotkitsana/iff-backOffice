<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Select, InputText, InputNumber } from 'primevue'
import {
  useProductStore,
  type IFishFilters,
  type IFoodFilters,
  type IProduct,
} from '../../stores/product/product'
import { type ICategory } from '../../stores/product/category'
import { useSpeciesStore, type ISpecies } from '@/stores/product/species';
import { useQuery } from '@tanstack/vue-query';

// Props
const props = defineProps<{
  selectedCategory: ICategory | null
  productsCategory: IProduct[]

  foodFilters?: IFoodFilters
  fishFilters?: IFishFilters
}>()

// Emits
const emit = defineEmits<{
  'select-category': [category: ICategory]
  'open-add-modal': []
  'open-search-modal': []
  'open-export-modal': []

  'update-food-filters': [filters: IFoodFilters]
  'update-fish-filters': [filters: IFishFilters]
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

// Computed
const isFishSelected = computed(() => {
  return props.selectedCategory?.value === 'fish'
})
const isFoodSelected = computed(() => {
  return props.selectedCategory?.value === 'food'
})

const getCategoryStats = (category: ICategory) => {
  const productsCategory = props.productsCategory

  let ageStats: Record<string, number> = {}
  let seedSizeStats: Record<string, number> = {}

  if (category.value === 'fish') {
    // Age statistics
    ageStats = {
      'Tosai (6เดือน-1ปี)': productsCategory.filter((p) => p.age?.includes('tosai')).length,
      'Nisai (1-2ปี)': productsCategory.filter((p) => p.age?.includes('nisai')).length,
      'Sansai (2-3ปี)': productsCategory.filter((p) => p.age?.includes('sansai')).length,
      'Yonsai (3-4ปี)': productsCategory.filter((p) => p.age?.includes('yonsai')).length,
      'Rokusai (4-5ปี)': productsCategory.filter((p) => p.age?.includes('rokusai')).length,
    }
  }
  if (category.value === 'food') {
    // Food type statistics
    seedSizeStats = {
      ss: productsCategory.filter((p) => p.seedSize === 1).length,
      s: productsCategory.filter((p) => p.seedSize === 2).length,
      m: productsCategory.filter((p) => p.seedSize === 3).length,
      l: productsCategory.filter((p) => p.seedSize === 4).length,
      xl: productsCategory.filter((p) => p.seedSize === 5).length,
    }
  }

  return {
    ageStats,
    seedSizeStats,
  }
}

const updateFoodFilter = (key: string, value: any) => {
  localFoodFilters.value[key as keyof typeof localFoodFilters.value] = value as never
  emit('update-food-filters', { ...localFoodFilters.value })
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
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
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
</script>

<template>
  <div class="space-y-4">
    <!-- Main Filter Section -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center flex-wrap justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-filter text-blue-600"></i>
          <h3 class="text-base font-[500]! text-gray-800">กรองสินค้าตามหมวดหมู่</h3>
        </div>

        <div class="flex items-center gap-2">
          <Button
            label="ค้นหา"
            icon="pi pi-search"
            severity="info"
            size="small"
            @click="$emit('open-search-modal')"
          />

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
        </div>
      </div>

      <div class="mb-4 space-y-3">
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
            <InputText
              :model-value="localFishFilters.farm"
              @update:model-value="updateFishFilter('farm', $event)"
              placeholder="ระบุชื่อฟาร์ม"
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
            <label class="text-sm font-medium text-gray-700 mb-1 block">ขนาด (ซม.)</label>
            <InputNumber
              :model-value="localFishFilters.size"
              @update:model-value="updateFishFilter('size', $event)"
              placeholder="ระบุขนาด"
              size="small"
              fluid
              :min="0"
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

        <Button
          v-if="selectedCategory"
          label="ล้างกรอง"
          icon="pi pi-times"
          variant="text"
          severity="danger"
          size="small"
          @click="clearFilters"
        />
      </div>

      <div v-if="selectedCategory">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-chart-bar text-green-600"></i>
          <h3 class="text-lg font-semibold text-gray-800">สถิติตามหมวดหมู่สินค้า</h3>
        </div>

        <div
          v-if="selectedCategory.value === 'fish'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <i class="pi pi-box text-white"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">จำนวน</p>
                <p class="text-xl font-semibold text-blue-600">
                  {{ props.productsCategory.length }} ตัว
                </p>
              </div>
            </div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="flex gap-3">
              <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <i class="pi pi-dollar text-white"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">มูลค่า</p>
                <p class="text-xl font-semibold text-green-600">
                  {{ formatCurrency(props.productsCategory.reduce((sum, p) => sum + (p.price || 0), 0)) }} บาท
                </p>
              </div>
            </div>
          </div>
          <div class="md:col-span-2 bg-purple-50 rounded-lg p-4">
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="(count, age) in getCategoryStats(selectedCategory).ageStats"
                :key="age"
                class="text-sm text-gray-600"
              >
                {{ age }} : {{ count }} ตัว
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>
