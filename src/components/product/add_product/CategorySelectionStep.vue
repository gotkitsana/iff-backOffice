<script setup lang="ts">
import type { ICategory } from '@/stores/product/category'
import { useProductStore, type ICategoryOption, type IProduct } from '@/stores/product/product'
import { Card } from 'primevue'
import { orderBy } from 'lodash-es'
import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'
import { useFoodSaleStore, type IFoodSale } from '@/stores/product/food_sale'
import type { SaleFoodType } from '@/types/query'

const props = defineProps<{
  categoryOptions: ICategoryOption[]
  showCount?: boolean
}>()

const emit = defineEmits<{
  'select-category': [value: ICategory, type: SaleFoodType]
}>()

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['products'],
  queryFn: () => productStore.onGetProducts(),
})

const getCategoryCount = (category: ICategoryOption) => {
  if (!products.value) return 0
  const count = products.value.filter((product) => product?.category?._id === category._id).length

  if (category.value === 'food') {
    return count + (foodSales.value?.length || 0)
  }

  return count
}

const foodSaleStore = useFoodSaleStore()
const { data: foodSales } = useQuery<IFoodSale[]>({
  queryKey: ['get_food_sales'],
  queryFn: () => foodSaleStore.onGetFoodSales(),
})

const getFoodSaleCount = (categoryId: string, type: SaleFoodType) => {
  if (type === 'wholesale') {
    return products.value?.filter((product) => product?.category?._id === categoryId).length || 0
  }
  if (type === 'retail') {
    return foodSales.value?.length || 0
  }
}

const saleFoodType: {
  name: string
  icon: string
  iconColor: string
  bgColor: string
  textColor: string
  borderColor: string
  value: SaleFoodType
}[] = [
  {
    name: 'อาหารกระสอบ',
    icon: 'pi pi-box',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'hover:border-blue-200',
    value: 'wholesale',
  },
  {
    name: 'อาหารแบ่งขาย',
    icon: 'pi pi-shopping-cart',
    iconColor: 'text-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'hover:border-green-200',
    value: 'retail',
  },
]

const saleFoodCategoryId = ref<string>('')
const handleSelectCategory = (category: ICategory) => {
  if (category.value === 'food') {
    saleFoodCategoryId.value = category._id
  } else {
    emit('select-category', category, null)
  }
}

const handleSelectSaleFood = (id: string, type: SaleFoodType) => {
  const category = props.categoryOptions.find((category) => category._id === id)
  if (!category) return
  emit('select-category', category, type)
}

const handleCancelSaleFood = () => {
  saleFoodCategoryId.value = ''
}
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
    <template v-if="!saleFoodCategoryId">
      <Card
        v-for="category in orderBy(categoryOptions, 'cat')"
        :key="category._id"
        :pt="{ body: 'p-2.5' }"
        :class="`cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-200`"
        @click="handleSelectCategory(category)"
      >
        <template #content>
          <div class="text-center">
            <div
              :class="`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${category.bgColor}`"
            >
              <i :class="`${category.icon} text-lg ${category.iconColor}`"></i>
            </div>
            <h3 :class="`font-[500]! text-sm ${category.iconColor}`">
              {{ category.name }}
            </h3>
            <p v-if="showCount" class="text-xs text-gray-500">
              ({{ getCategoryCount(category) }} รายการ)
            </p>
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <Card
        v-for="(type,index) in saleFoodType"
        :key="index"
        :pt="{ body: 'p-2.5' }"
        :class="`cursor-pointer transition-all duration-200 border border-gray-200 ${type.borderColor}`"
        @click="handleSelectSaleFood(saleFoodCategoryId, type.value)"
      >
        <template #content>
          <div class="text-center">
            <div
              :class="`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${type.bgColor}`"
            >
              <i :class="`${type.icon} text-lg ${type.iconColor}`"></i>
            </div>
            <h3 :class="`font-[500]! text-sm ${type.textColor}`">
              {{ type.name }}
            </h3>
            <p v-if="showCount" class="text-xs text-gray-500">
              ({{ getFoodSaleCount(saleFoodCategoryId, type.value) }} รายการ)
            </p>
          </div>
        </template>
      </Card>

      <Card
        :pt="{ body: 'p-2.5' }"
        :class="`cursor-pointer transition-all justify-center duration-200 border border-gray-200 hover:border-red-200`"
        @click="handleCancelSaleFood"
      >
        <template #content>
          <div class="text-center">
            <div
              :class="`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center bg-red-100`"
            >
              <i :class="`pi pi-times text-lg text-red-500`"></i>
            </div>
            <h3 :class="`font-[500]! text-sm text-red-600 `">ยกเลิก</h3>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

