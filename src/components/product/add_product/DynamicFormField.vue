<script setup lang="ts">
import type { ICategory } from '@/stores/product/category'
import { useFarmStore, type IFarm } from '@/stores/product/farm'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'
import { useFoodTypeStore, type IFoodType } from '@/stores/product/food_type'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/product/greenhouse'
import { useLotNumberStore, type ILotNumber } from '@/stores/product/lot_number'
import { useProductStore, type IFields, type IFieldsKey } from '@/stores/product/product'
import { useQualityStore, type IQuality } from '@/stores/product/quality'
import { useSeedSizeStore, type ISeedSize } from '@/stores/product/seed_size'
import { useSpeciesStore, type ISpecies } from '@/stores/product/species'
import { useQuery } from '@tanstack/vue-query'
import { InputText, InputNumber, Select, Textarea, DatePicker, Checkbox } from 'primevue'
import { computed } from 'vue'

const props = defineProps<{
  fields: IFields[]
  formData: Record<IFieldsKey, string | number | Date | null>
  isSubmitting: boolean
  pondOptions: { label: string; value: string; group?: string }[]
  categoryId: ICategory | null
}>()

const emit = defineEmits<{
  'update-field': [key: IFieldsKey, value: string | number | Date | null]
}>()

const updateField = (key: IFieldsKey, value: string | number | Date | null) => {
  emit('update-field', key, value)
}

const productStore = useProductStore()

const greenhouseStore = useGreenhouseStore()
const { data: greenhousesData } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})
const greenhouseOptions = computed(() => {
  if (!greenhousesData.value) return []
  return greenhousesData.value.map((greenhouse) => ({
    label: greenhouse.name,
    value: greenhouse._id,
  }))
})

const speciesStore = useSpeciesStore()
const { data: speciesData } = useQuery<ISpecies[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})
const speciesOptions = computed(() => {
  if (!speciesData.value) return []

  return speciesData.value.map((specie) => ({
    label: specie.name, // ชื่อที่แสดงใน dropdown
    value: specie._id, // ค่าที่จะเก็บใน form
  }))
})

const farmStore = useFarmStore()
const { data: farmsData } = useQuery<IFarm[]>({
  queryKey: ['get_farms'],
  queryFn: () => farmStore.onGetFarms(),
})
const farmOptions = computed(() => {
  if (!farmsData.value) return []
  return farmsData.value.map((farm) => ({
    label: farm.name,
    value: farm._id,
  }))
})

const lotNumberStore = useLotNumberStore()
const { data: lotNumberData } = useQuery<ILotNumber[]>({
  queryKey: ['get_lot_numbers'],
  queryFn: () => lotNumberStore.onGetLotNumbers(),
})
const lotNumberOptions = computed(() => {
  if (!lotNumberData.value || !props.categoryId) return []
  return lotNumberData.value
    .filter((lotNumber) => lotNumber.category._id === props.categoryId?._id)
    .map((lotNumber) => ({
      label: lotNumber.name,
      value: lotNumber._id,
    }))
})

const qualityStore = useQualityStore()
const { data: qualityData } = useQuery<IQuality[]>({
  queryKey: ['get_quality'],
  queryFn: () => qualityStore.onGetQuality(),
})
const qualityOptions = computed(() => {
  if (!qualityData.value) return []
  return qualityData.value.map((quality) => ({
    label: quality.name,
    value: quality._id,
  }))
})

const foodTypeStore = useFoodTypeStore()
const { data: foodTypeData } = useQuery<IFoodType[]>({
  queryKey: ['get_food_types'],
  queryFn: () => foodTypeStore.onGetFoodTypes(),
})
const foodTypeOptions = computed(() => {
  if (!foodTypeData.value) return []
  return foodTypeData.value.map((foodType) => ({
    label: foodType.name,
    value: foodType._id,
  }))
})

const brandStore = useFoodBrandStore()
const { data: brandData } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => brandStore.onGetFoodBrands(),
})
const getImageUrl = (image: string) => {
  return `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image}`
}
const foodBrandOptions = computed(() => {
  if (!brandData.value || !props.categoryId) return []
  return brandData.value
    .filter((brand) => brand.category._id === props.categoryId?._id)
    .map((brand) => ({
      label: brand.name,
      value: brand._id,
      image: brand.image ? getImageUrl(brand.image) : null,
    }))
})

const seedSizeStore = useSeedSizeStore()
const { data: seedSizeData } = useQuery<ISeedSize[]>({
  queryKey: ['get_seed_sizes'],
  queryFn: () => seedSizeStore.onGetSeedSizes(),
})
const seedSizeOptions = computed(() => {
  if (!seedSizeData.value) return []
  return seedSizeData.value.map((seedSize) => ({
    label: seedSize.name,
    value: seedSize._id,
  }))
})

const getSelectOptions = (fieldKey: IFieldsKey) => {
  if (fieldKey === 'gender') {
    return productStore.genderOptions
  }

  if (fieldKey === 'age') {
    return productStore.ageOptions
  }

  if (fieldKey === 'seedType') {
    return productStore.seedTypeOptions
  }

  if (fieldKey === 'greenhouse') {
    return greenhouseOptions.value
  }

  if (fieldKey === 'fishpond') {
    const options = props.pondOptions || []
    if (options.length === 0) return []

    const hasGroup = options.some((opt) => opt?.group)

    if (hasGroup) {
      // Group options by group (name) field
      const grouped = options.reduce((acc, opt) => {
        const groupName = opt?.group || 'อื่นๆ'
        if (!acc[groupName]) {
          acc[groupName] = []
        }
        acc[groupName].push({
          label: opt.label, // code
          value: opt.value, // _id
        })
        return acc
      }, {} as Record<string, { label: string; value: string }[]>)

      // Convert to array format for PrimeVue Select
      return Object.keys(grouped).map((groupName) => ({
        label: groupName,
        items: grouped[groupName],
      }))
    }

    return options
  }

  if (fieldKey === 'species') {
    return speciesOptions.value
  }

  if (fieldKey === 'farm') {
    return farmOptions.value
  }

  if (fieldKey === 'lotNumber') {
    return lotNumberOptions.value
  }

  if (fieldKey === 'quality') {
    return qualityOptions.value
  }

  if (fieldKey === 'foodtype') {
    return foodTypeOptions.value
  }

  if (fieldKey === 'brand') {
    return foodBrandOptions.value
  }

  if (fieldKey === 'seedSize') {
    return seedSizeOptions.value
  }

  return []
}

const isGroupedSelect = (fieldKey: IFieldsKey) => {
  if (fieldKey === 'fishpond') {
    const options = props.pondOptions || []
    return options.some((opt) => opt.group)
  }
  return false
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="field in fields"
        :key="field.key"
        :class="field.type === 'textarea' ? 'md:col-span-2' : ''"
      >
        <label class="text-sm font-medium text-gray-700 mb-1 block">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500 ml-1">*</span>
        </label>

        <!-- Text Input -->
        <InputText
          v-if="field.type === 'text'"
          :model-value="(formData[field.key] as string | null)"
          @update:model-value="updateField(field.key, $event as string | number | Date | null)"
          :placeholder="`กรอก${field.label}`"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Number Input -->
        <InputNumber
          v-else-if="field.type === 'number'"
          :model-value="(formData[field.key] as number | null)"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          :min="field.key === 'balance' || field.key === 'weight' ? 0 : 1"
          :minFractionDigits="1"
          :maxFractionDigits="5"
          fluid
          size="small"
          :invalid="field.required && formData[field.key] == null && isSubmitting"
        />

        <Select
          v-else-if="field.key === 'brand' && field.type === 'select'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :options="foodBrandOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="เลือกชื่อแบรนด์"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
          filter
        >
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <img v-if="slotProps.option.image"
                :src="slotProps.option.image"
                alt="Brand Image"
                class="w-auto h-8 rounded"
              />
              <i v-else class="pi pi-image text-gray-400 text-lg"></i>
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
        </Select>

        <!-- Select Input -->
        <Select
          v-else-if="field.type === 'select'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :options="getSelectOptions(field.key)"
          optionLabel="label"
          optionValue="value"
          :optionGroupLabel="isGroupedSelect(field.key) ? 'label' : undefined"
          :optionGroupChildren="isGroupedSelect(field.key) ? 'items' : undefined"
          :placeholder="`เลือก${field.label}`"
          :disabled="field.key === 'fishpond' && !formData['greenhouse']"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
          filter
        />

        <Checkbox
          v-else-if="field.type === 'boolean'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`เลือก${field.label}`"
          fluid
          binary
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Textarea -->
        <Textarea
          v-else-if="field.type === 'textarea'"
          :model-value="(formData[field.key] as string | null)"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          rows="3"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Date Input -->
        <DatePicker
          v-else-if="field.type === 'date'"
          :model-value="(formData[field.key] as Date | null)"
          @update:model-value="updateField(field.key, $event as string | number | Date | null)"
          showIcon
          iconDisplay="input"
          placeholder="เลือกวันที่"
          dateFormat="dd/mm/yy"
          size="small"
          fluid
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <small
          v-if="field.required && !formData[field.key] && isSubmitting && field.key != 'balance'"
          class="text-red-500 text-xs mt-1"
        >
          กรุณากรอก{{ field.label }}
        </small>
      </div>
    </div>
  </div>
</template>


