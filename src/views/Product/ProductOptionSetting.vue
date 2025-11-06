<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Card } from 'primevue'
import SpeciesSetting from '@/components/product/settings/SpeciesSetting.vue'
import PondSetting from '@/components/product/settings/PondSetting.vue'
import GreenhouseSetting from '@/components/product/settings/GreenhouseSetting.vue'
import FarmSetting from '@/components/product/settings/FarmSetting.vue'
import QualitySetting from '@/components/product/settings/QualitySetting.vue'
import LotNumberSetting from '@/components/product/settings/LotNumberSetting.vue'
import { useCategoryStore, type ICategory, type ICategoryValue } from '@/stores/product/category'
import FoodTypeSetting from '@/components/product/settings/FoodTypeSetting.vue'
import BrandSetting from '@/components/product/settings/BrandSetting.vue'
import SeedSizeSetting from '@/components/product/settings/SeedSizeSetting.vue'
import FishStatusSetting from '@/components/product/settings/FishStatus.vue'
import { useQuery } from '@tanstack/vue-query'

interface ISettingCategory {
  id: string
  name: string
  icon: string
  color: string
  description: string
  type: ICategoryValue[]
}

const router = useRouter()
const route = useRoute()

const activeCategory = ref<string>('lotNumber')

const settingCategories = ref<ISettingCategory[]>([
  {
    id: 'lotNumber',
    name: 'เลขล็อต',
    icon: 'pi pi-hashtag',
    color: 'from-indigo-500 to-blue-600',
    description: 'จัดการหมายเลขล็อต',
    type: ['fish', 'food', 'microorganism'],
  },
  {
    id: 'species',
    name: 'สายพันธุ์ปลา',
    icon: 'pi pi-star',
    color: 'from-blue-500 to-cyan-600',
    description: 'จัดการสายพันธุ์ปลาคาร์ฟ',
    type: ['fish'],
  },
  {
    id: 'greenhouse',
    name: 'กรีนเฮ้า',
    icon: 'pi pi-sun',
    color: 'from-yellow-500 to-orange-600',
    description: 'จัดการกรีนเฮ้า',
    type: ['fish'],
  },
  {
    id: 'pond',
    name: 'บ่อปลา',
    icon: 'pi pi-inbox',
    color: 'from-green-500 to-emerald-600',
    description: 'จัดการบ่อปลาและกรีนเฮ้า',
    type: ['fish'],
  },
  {
    id: 'farm',
    name: 'ฟาร์ม',
    icon: 'pi pi-home',
    color: 'from-orange-500 to-red-600',
    description: 'จัดการข้อมูลฟาร์ม',
    type: ['fish'],
  },
  {
    id: 'quality',
    name: 'คุณภาพปลา',
    icon: 'pi pi-star-fill',
    color: 'from-purple-500 to-pink-600',
    description: 'จัดการคุณภาพสินค้า',
    type: ['fish'],
  },
  {
    id: 'fishStatus',
    name: 'สถานะปลา',
    icon: 'pi pi-gauge',
    color: 'from-blue-500 to-indigo-600',
    description: 'จัดการสถานะปลา',
    type: ['fish'],
  },
  {
    id: 'foodType',
    name: 'ประเภทอาหาร',
    icon: 'pi pi-heart',
    color: 'from-red-500 to-pink-600',
    description: 'จัดการประเภทอาหาร',
    type: ['food'],
  },
  {
    id: 'brand',
    name: 'ชื่อแบรนด์',
    icon: 'pi pi-building',
    color: 'from-gray-500 to-gray-600',
    description: 'จัดการชื่อแบรนด์',
    type: ['food', 'microorganism'],
  },
  {
    id: 'seedSize',
    name: 'ขนาดเม็ด',
    icon: 'pi pi-circle',
    color: 'from-teal-500 to-cyan-600',
    description: 'จัดการขนาดเม็ด',
    type: ['food'],
  },
])

const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const selectedType = computed(() => (route.query.type as ICategoryValue) || null)
const filteredSettingCategories = computed(() => {
  if (!selectedType.value) return settingCategories.value
  return settingCategories.value.filter((category) => category.type.includes(selectedType.value))
})

watch(
  filteredSettingCategories,
  (list) => {
    if (!list.some((cat) => cat.id === activeCategory.value)) {
      activeCategory.value = list[0]?.id || ''
    }
  },
  { immediate: true }
)

const goBack = () => {
  router.push('/product')
}

const selectedCategory = computed(() => {
  return categories.value?.find((category) => category.value === selectedType.value)
})

const setActiveCategory = (categoryId: string) => {
  activeCategory.value = categoryId
}

const categoryOptions = computed(() => {
  if (!categories.value) return []
  return categories.value?.map((category) => ({
    label: category.name,
    value: category._id,
  }))
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ตั้งค่าคลังสินค้า</h1>
        <p class="text-gray-600">จัดการการตั้งค่าต่างๆ ของระบบคลังสินค้า</p>
      </div>
      <Button
        label="กลับ"
        icon="pi pi-angle-left"
        severity="contrast"
        size="small"
        @click="goBack"
      />
    </div>

    <!-- Category Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
      <Card
        v-for="category in filteredSettingCategories"
        :key="category.id"
        :class="[
          'cursor-pointer transition-all duration-200 hover:shadow-lg ',
          activeCategory === category.id ? 'ring-2 ring-blue-400 shadow-lg' : 'hover:shadow-md',
        ]"
        @click="setActiveCategory(category.id)"
      >
        <template #content>
          <div class="text-center">
            <div
              :class="[
                'w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center bg-gradient-to-r',
                category.color,
              ]"
            >
              <i :class="[category.icon, 'text-white text-xl']"></i>
            </div>
            <h3 class="font-semibold! text-sm text-gray-900">{{ category.name }}</h3>
            <p class="text-xs text-gray-600">{{ category.description }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Content Area -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <!-- Species Setting -->
      <SpeciesSetting v-if="activeCategory === 'species'" />

      <!-- Pond Setting -->
      <PondSetting v-if="activeCategory === 'pond'" />

      <!-- Greenhouse Setting -->
      <GreenhouseSetting v-if="activeCategory === 'greenhouse'" />

      <!-- Farm Setting -->
      <FarmSetting v-if="activeCategory === 'farm'" />

      <!-- Quality Setting -->
      <QualitySetting v-if="activeCategory === 'quality'" />

      <!-- Lot Number Setting -->
      <LotNumberSetting
        v-if="activeCategory === 'lotNumber' && selectedCategory"
        :selectedCategory="selectedCategory"
        :categoryOptions="categoryOptions"
      />

      <!-- Food Type Setting -->
      <FoodTypeSetting v-if="activeCategory === 'foodType'" />

      <!-- Brand Setting -->
      <BrandSetting
        v-if="activeCategory === 'brand' && selectedCategory"
        :selectedCategory="selectedCategory"
        :categoryOptions="categoryOptions"
      />

      <!-- Seed Size Setting -->
      <SeedSizeSetting v-if="activeCategory === 'seedSize'" />

      <!-- Fish Status Setting -->
      <FishStatusSetting v-if="activeCategory === 'fishStatus'" />
    </div>
  </div>
</template>
