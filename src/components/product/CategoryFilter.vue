<script setup lang="ts">
import { computed } from 'vue'
import { Button, Select } from 'primevue'
import { useProductStore, type ICategoryOption, type IProduct } from '@/stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import type { ISalesProduct, ISalesProductLabel } from '@/types/sales';

// Props
const props = defineProps<{
  selectedCategory: string | null
  selectedQualityGrade: string | null
}>()

// Emits
defineEmits<{
  'select-category': [category: string]
  'select-quality-grade': [grade: string]
  'open-add-modal': []
}>()

const productStore = useProductStore()

// Query
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['products'],
  queryFn: () => productStore.onGetProducts(),
})

const categoryOptions: { value: ISalesProduct; label: ISalesProductLabel; icon: string; color: string; bgColor: string; iconColor: string }[] = [
  {
    value: 'fish',
    label: 'ปลา',
    icon: 'pi pi-star',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    value: 'food',
    label: 'อาหาร',
    icon: 'pi pi-heart',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    value: 'microorganism',
    label: 'สารปรับสภาพน้ำ',
    icon: 'pi pi-sparkles',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    value: 'equipment',
    label: 'อุปกรณ์',
    icon: 'pi pi-wrench',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    value: 'medicine',
    label: 'เวชภัณฑ์',
    icon: 'pi pi-plus-circle',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    value: 'construction',
    label: 'คอนสทรัคชั่น',
    icon: 'pi pi-building',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  {
    value: 'service',
    label: 'บริการ',
    icon: 'pi pi-cog',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
]

const qualityGradeOptions = [
  { label: 'Tategoi', value: 'tategoi' },
  { label: 'J.Tosai', value: 'j_tosai' },
]

// Computed
const isFishSelected = computed(() => {
  return props.selectedCategory === 'fish'
})

const categorySelectOptions = computed(() => {
  return categoryOptions.map((category) => ({
    label: `${category.label} (${getCategoryCount(category.value)} รายการ)`,
    value: category.value,
    icon: category.icon,
    iconColor: category.iconColor,
  }))
})

const getCategoryCount = (category: string) => {
  if (!products.value) return 0
  if (category === 'all') return products.value.length
  return products.value.filter((product) => product.category === category).length
}

const getCategoryStats = (category: string) => {
  if (!products.value) {
    return {
      quantity: 0,
      value: 0,
      ageStats: {} as Record<string, number>,
      qualityStats: {} as Record<string, number>,
    }
  }

  const categoryProducts = products.value.filter((p) => p.category === category)

  const quantity = categoryProducts.length
  const value = categoryProducts.reduce((sum, p) => sum + (p.price || 0), 0)

  let ageStats: Record<string, number> = {}
  let qualityStats: Record<string, number> = {}

  if (category === 'fish') {
    // Age statistics
    ageStats = {
      'Tosai (6เดือน-1ปี)': categoryProducts.filter((p) => p.age?.includes('Tosai')).length,
      'Nisai (1-2ปี)': categoryProducts.filter((p) => p.age?.includes('Nisai')).length,
      'Sansai (2-3ปี)': categoryProducts.filter((p) => p.age?.includes('Sansai')).length,
      'Yonsai (3-4ปี)': categoryProducts.filter((p) => p.age?.includes('Yonsai')).length,
      'Rokusai (4-5ปี)': categoryProducts.filter((p) => p.age?.includes('Rokusai')).length,
    }

    // Quality statistics
    qualityStats = {
      Tategoi: categoryProducts.filter((p) => p.rate && p.rate >= 8).length,
      'J.Tosai': categoryProducts.filter((p) => p.rate && p.rate >= 6 && p.rate < 8).length,
    }
  } else if (category === 'food') {
    // Food type statistics
    ageStats = {
      เม็ดเล็ก: categoryProducts.filter((p) => p.detail?.includes('เม็ดเล็ก')).length,
      เม็ดใหญ่: categoryProducts.filter((p) => p.detail?.includes('เม็ดใหญ่')).length,
    }
  }

  return {
    quantity,
    value,
    ageStats,
    qualityStats,
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Main Filter Section -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-center flex-wrap justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <i class="pi pi-filter text-blue-600"></i>
          <h3 class="text-lg font-semibold text-gray-800">กรองสินค้าตามหมวดหมู่</h3>
        </div>

        <div class="flex items-center gap-2">
          <Button label="ตั้งค่าบ่อ" icon="pi pi-cog" severity="info" size="small" />

          <Button
            label="เพิ่มสินค้า"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="$emit('open-add-modal')"
          />
        </div>
      </div>

      <!-- Category Select -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">เลือกหมวดหมู่สินค้า</label>
          <Select
            :model-value="selectedCategory"
            @update:model-value="$emit('select-category', $event)"
            :options="categorySelectOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกหมวดหมู่สินค้า"
            class="w-full"
            :pt="{
              root: 'w-full',
              input: 'w-full',
            }"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-3">
                <div
                  :class="`w-8 h-8 rounded-lg flex items-center justify-center ${option.iconColor
                    .replace('text-', 'bg-')
                    .replace('-600', '-100')}`"
                >
                  <i :class="`${option.icon} ${option.iconColor}`"></i>
                </div>
                <span>{{ option.label }}</span>
              </div>
            </template>
          </Select>
        </div>

        <!-- Quality Grade Filter (for Fish only) -->
        <div v-if="isFishSelected">
          <label class="text-sm font-medium text-gray-700 mb-1 block">เกรดคุณภาพ</label>
          <Select
            :model-value="selectedQualityGrade"
            @update:model-value="$emit('select-quality-grade', $event)"
            :options="qualityGradeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="เลือกเกรดคุณภาพ"
            class="w-full"
          />
        </div>
      </div>

      <div v-if="selectedCategory">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-chart-bar text-green-600"></i>
          <h3 class="text-lg font-semibold text-gray-800">สถิติตามหมวดหมู่สินค้า</h3>
        </div>

        <div
          v-if="selectedCategory === 'fish'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <!-- Quantity -->
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <i class="pi pi-box text-white"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">จำนวน</p>
                <p class="text-xl font-semibold text-blue-600">
                  {{ getCategoryStats(selectedCategory).quantity }} ตัว
                </p>
              </div>
            </div>
          </div>

          <!-- Value -->
          <div class="bg-green-50 rounded-lg p-4">
            <div class="flex gap-3">
              <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <i class="pi pi-dollar text-white"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">มูลค่า</p>
                <p class="text-xl font-semibold text-green-600">
                  {{ getCategoryStats(selectedCategory).value.toLocaleString() }} บาท
                </p>
              </div>
            </div>
          </div>

          <!-- Age Stats (for Fish) -->
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

          <!-- Quality Stats (for Fish) -->
          <!-- <div v-if="selectedCategory === 'fish'" class="bg-orange-50 rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <i class="pi pi-star text-white"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">เกรดคุณภาพ</p>
                <div class="text-xs text-gray-500 space-y-1">
                  <div
                    v-for="(count, grade) in getCategoryStats(selectedCategory).qualityStats"
                    :key="grade"
                  >
                    {{ grade }}: {{ count }} ตัว
                  </div>
                </div>
              </div>
            </div>
          </div> -->
        </div>

        <div
          v-if="selectedCategory === 'food'"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <!-- Food specific stats -->
          <div class="bg-red-50 rounded-lg p-4">
            <div class="flex gap-3">
              <div>
                <p class="text-sm text-gray-600">ประเภทอาหาร</p>
                <div class="text-xs text-gray-500 space-y-1">
                  <div>
                    เม็ดเล็ก:
                    {{ getCategoryStats(selectedCategory).ageStats['เม็ดเล็ก'] || 0 }} รายการ
                  </div>
                  <div>
                    เม็ดใหญ่:
                    {{ getCategoryStats(selectedCategory).ageStats['เม็ดใหญ่'] || 0 }} รายการ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
