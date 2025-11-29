<script setup lang="ts">
import { computed } from 'vue'
import { Card } from 'primevue'
import { useQuery } from '@tanstack/vue-query'

import { useProductStore, type IProduct } from '@/stores/product/product'
import type { ICategory } from '@/stores/product/category'
import StatsCardItem from '@/components/product/UI/StatsCardItem.vue'

const props = defineProps<{
  selectedCategory: ICategory | null
  hideActions?: boolean
}>()

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const fishProducts = computed(() => {
  if (!products.value) return []

  const categoryId = props.selectedCategory?._id
  if (categoryId) {
    return products.value.filter((product) => product.category?._id === categoryId)
  }

  // fallback by name in case category not resolved yet
  return products.value.filter((product) => product.category?.name === 'ปลา')
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value)
}

const dataFilter = computed(() => {
  if (props.hideActions) {
    return fishProducts.value.filter((product) => !product.sold && !product.waitQC)
  } else {
    return fishProducts.value.filter((product) => !product.sold)
  }
})

const totalValue = computed(() => {
  return dataFilter.value.reduce((sum, product) => sum + (product.price || 0), 0)
})

const totalCount = computed(() => dataFilter.value.length)

const missingDataCount = computed(
  () =>
    fishProducts.value.filter((product) => {
      const hasImages = !!product.images && product.images.length > 0
      const hasCertificate = !!product.certificate
      return !hasImages || !hasCertificate
    }).length
)

const soldValue = computed(() =>
  fishProducts.value
    .filter((product) => product.sold)
    .reduce((sum, product) => sum + (product.price || 0), 0)
)
const soldCount = computed(() => fishProducts.value.filter((product) => product.sold).length)

const waitQcCount = computed(() => fishProducts.value.filter((product) => product.waitQC).length)

const summaryCards = computed(() => [
  {
    id: 'totalValue',
    label: 'มูลค่าปลาในสต๊อก',
    value: `${formatCurrency(totalValue.value)} / ${totalCount.value} ตัว`,
    iconClass: 'pi pi-wallet text-white ',
    iconBgClass: 'bg-gradient-to-br from-green-500 to-green-600',
    valueClass: 'text-green-600',
    cardClass:  'col-span-2 md:col-span-3 lg:col-span-2',
  },
  {
    id: 'soldValue',
    label: 'มูลค่าปลาขายแล้ว',
    value: `${formatCurrency(soldValue.value)} / ${soldCount.value} ตัว`,
    iconClass: 'pi pi-shopping-bag text-white ',
    iconBgClass: 'bg-gradient-to-br from-purple-500 to-purple-600',
    valueClass: ' text-purple-600',
    cardClass: 'col-span-2 md:col-span-3 lg:col-span-2',
    hidden: props.hideActions,
  },
  {
    id: 'missingData',
    label: 'ข้อมูลไม่ครบ',
    value: `${missingDataCount.value} รายการ`,
    iconClass: 'pi pi-exclamation-triangle text-white ',
    iconBgClass: 'bg-gradient-to-br from-amber-500 to-amber-600',
    valueClass: ' text-amber-600',
    cardClass: props.hideActions ? 'col-span-2 md:col-span-3 lg:col-span-2' : 'md:col-span-2',

  },

  {
    id: 'waitQcCount',
    label: 'รอประเมิน QC',
    value: `${waitQcCount.value} รายการ`,
    iconClass: 'pi pi-hourglass text-white ',
    iconBgClass: 'bg-gradient-to-br from-red-500 to-red-600',
    valueClass: ' text-red-600',
    cardClass: 'md:col-span-2',
    hidden: props.hideActions,
  },
])

const ageStats = computed(() => {
  const stats: Record<string, number> = {
    'Tosai (6เดือน-1ปี)': 0,
    'Nisai (1-2ปี)': 0,
    'Sansai (2-3ปี)': 0,
    'Yonsai (3-4ปี)': 0,
    'Rokusai (4-5ปี)': 0,
  }

  dataFilter.value.forEach((product) => {
    if (!product.age) return

    if (product.age.includes('tosai')) stats['Tosai (6เดือน-1ปี)'] += 1
    if (product.age.includes('nisai')) stats['Nisai (1-2ปี)'] += 1
    if (product.age.includes('sansai')) stats['Sansai (2-3ปี)'] += 1
    if (product.age.includes('yonsai')) stats['Yonsai (3-4ปี)'] += 1
    if (product.age.includes('rokusai')) stats['Rokusai (4-5ปี)'] += 1
  })

  return stats
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
    <StatsCardItem v-for="card in summaryCards.filter((card) => !card.hidden)" :key="card.id" v-bind="card" />

    <Card :pt="{ body: 'p-3 md:p-4 h-full' }"
      class="hover:shadow-lg transition-shadow duration-200 col-span-2 md:col-span-6"
      :class="[hideActions ? ' xl:col-span-4' : 'xl:col-span-5']">
      <template #content>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 xl:gap-3">
          <div v-for="(count, label) in ageStats" :key="label"
            class="text-sm xl:text-sm text-gray-700 flex items-center gap-2">
            <span>{{ label }}:</span>
            <span class="font-semibold text-gray-900">{{ count }} ตัว</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
