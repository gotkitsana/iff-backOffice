<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Select, InputText, Slider } from 'primevue'
import {
  type IFoodFilters,
} from '@/stores/product/product'
import { type ICategory } from '@/stores/product/category'
import { useQuery } from '@tanstack/vue-query'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'
import { useFoodTypeStore, type IFoodType } from '@/stores/product/food_type'
import { useSeedSizeStore, type ISeedSize } from '@/stores/product/seed_size'
import { useLotNumberStore, type ILotNumber } from '@/stores/product/lot_number'
import { getProductImageUrl } from '@/utils/imageUrl'
import { useProductQuery } from '@/composables/useProductQuery'
import { useProductFilters } from '@/composables/useProductFilters'

// Props
const props = defineProps<{
  selectedCategory: ICategory | null
}>()

// Emits
const emit = defineEmits<{
  'open-add-modal': []
  'open-export-modal': []
  'update-category-selector': []
}>()

const foodSeedTypeOptions = [
  { label: 'ลอย', value: 'ลอย' },
  { label: 'จม', value: 'จม' },
]

const { foodRetailFilters } = useProductFilters()

const maxProductPrice = 5000

const localFoodRetailFilters = ref<IFoodFilters>({
  sku: foodRetailFilters.value.sku || '',
  lotNumber: foodRetailFilters.value.lotNumber || '',
  brandName: foodRetailFilters.value.brandName || '',
  foodtype: foodRetailFilters.value.foodtype || '',
  seedType: foodRetailFilters.value.seedType || '',
  seedSize: foodRetailFilters.value.seedSize || '',
  priceMin: foodRetailFilters.value.priceMin || 0,
  priceMax: foodRetailFilters.value.priceMax || maxProductPrice,
})

const foodPriceRange = computed({
  get: () => [
    localFoodRetailFilters.value.priceMin || 0,
    localFoodRetailFilters.value.priceMax || maxProductPrice,
  ],
  set: (value: number[]) => {
    localFoodRetailFilters.value.priceMin = value[0]
    localFoodRetailFilters.value.priceMax = value[1]
  },
})

const updateFoodFilter = (key: string, value: any) => {
  localFoodRetailFilters.value[key as keyof typeof localFoodRetailFilters.value] = value as never
  foodRetailFilters.value[key as keyof typeof foodRetailFilters.value] = value as never
}

const clearFilters = () => {
    localFoodRetailFilters.value = {
      sku: '',
      lotNumber: '',
      brandName: '',
      foodtype: '',
      seedType: '',
      seedSize: '',
      priceMin: 0,
      priceMax: maxProductPrice,
    }
    foodRetailFilters.value = {
      sku: '',
      lotNumber: '',
      brandName: '',
      foodtype: '',
      seedType: '',
      seedSize: '',
      priceMin: 0,
      priceMax: maxProductPrice,
    }
}

const getImageUrl = (image: string) => {
  return getProductImageUrl(image)
}
const foodBrandStore = useFoodBrandStore()
const { data: foodBrands } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})
const foodBrandOptions = computed(() => {
  if (!foodBrands.value || !props.selectedCategory) return []
  return foodBrands.value
    ?.filter((p) => p.category._id === props.selectedCategory?._id)
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
    ?.filter((p) => p.category._id === props.selectedCategory?._id)
    .map((p) => ({
      label: p.name,
      value: p._id,
    }))
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}


const { navigateWithQuery } = useProductQuery()

</script>

<template>
  <div class="space-y-4">
    <!-- Main Filter Section -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center flex-wrap justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-[600]! text-gray-800">
            หมวดหมู่: อาหารแบ่งขาย
          </h3>
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
            @click="navigateWithQuery('/product/options-settings')"
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
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end"
        >
          <!-- รหัสอาหาร -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">รหัสอาหาร</label>
            <InputText
              :model-value="localFoodRetailFilters.sku"
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
            <Select
              :model-value="localFoodRetailFilters.brandName"
              @update:model-value="updateFoodFilter('brandName', $event)"
              :options="foodBrandOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกชื่อแบรนด์"
              size="small"
              fluid
              filter
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <img
                    v-if="slotProps.option.image"
                    :src="slotProps.option.image"
                    alt="Brand Image"
                    class="w-auto h-8 rounded"
                  />
                  <i v-else class="pi pi-image text-gray-400 text-lg"></i>
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <!-- ประเภทอาหาร -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภทอาหาร</label>
            <Select
              :model-value="localFoodRetailFilters.foodtype"
              @update:model-value="updateFoodFilter('foodtype', $event)"
              placeholder="เลือกประเภทอาหาร"
              :options="foodTypeOptions"
              optionLabel="label"
              optionValue="value"
              size="small"
              fluid
              filter
            />
          </div>

          <!-- ชนิดเม็ด -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ชนิดเม็ด</label>
            <Select
              :model-value="localFoodRetailFilters.seedType"
              @update:model-value="updateFoodFilter('seedType', $event)"
              :options="foodSeedTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกชนิดเม็ด"
              size="small"
              fluid
              filter
            />
          </div>

          <!-- ขนาดเม็ด -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">ขนาดเม็ด</label>
            <Select
              :model-value="localFoodRetailFilters.seedSize"
              @update:model-value="updateFoodFilter('seedSize', $event)"
              :options="seedSizeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกขนาดเม็ด"
              size="small"
              fluid
              filter
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">เลขล็อต</label>
            <Select
              :model-value="localFoodRetailFilters.lotNumber"
              @update:model-value="updateFoodFilter('lotNumber', $event)"
              :options="lotNumberOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกเลขล็อต"
              size="small"
              fluid
              filter
            />
          </div>

          <div class="col-span-2">
            <label class="text-sm font-medium text-gray-700 mb-1 block"> ราคาท้องตลาด </label>
            <div class="px-2 py-1.5">
              <Slider
                v-model="foodPriceRange"
                @update:model-value="foodRetailFilters = { ...localFoodRetailFilters }"
                :min="0"
                :max="maxProductPrice"
                :step="500"
                range
                fluid
                class="px-2"
              />
            </div>

            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>{{ formatCurrency(foodPriceRange[0]) }}</span>
              <span>{{ formatCurrency(foodPriceRange[1]) }}</span>
            </div>
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
