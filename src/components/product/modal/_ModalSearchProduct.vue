<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import CategorySelectionStep from '@/components/product/add_product/CategorySelectionStep.vue'
import { orderBy } from 'lodash-es'

// Props
defineProps<{
  visible: boolean
  selectedCategory: ICategory | null
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select-category': [category: ICategory]
}>()

// Stores
const categoryStore = useCategoryStore()

// Queries
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

// Computed
const categoryOptionsUI = computed(() => {
  if (!categories.value) return []
  return categories.value.map((category) => ({
    ...category,
    fields: [], // ไม่ต้องมี fields สำหรับ search modal
  }))
})

// Methods
const selectCategory = (category: ICategory) => {
  emit('select-category', category)
  handleClose()
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '65rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <i class="pi pi-search text-blue-600 text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-800">ค้นหาสินค้า</h3>
          <p class="text-sm text-gray-600">เลือกหมวดหมู่สินค้าที่ต้องการค้นหา</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <CategorySelectionStep
        :category-options="orderBy(categoryOptionsUI, 'cat')"
        :selected-category="selectedCategory"
        @select-category="selectCategory"
        show-count
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
        />
      </div>
    </template>
  </Dialog>
</template>
