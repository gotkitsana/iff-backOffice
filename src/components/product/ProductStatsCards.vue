<script setup lang="ts">
import { Card, Button, Dialog, DataTable, Column, Select } from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import type { ICategory } from '@/stores/product/category'
import { computed, ref } from 'vue'
import { useSupplierStore, type ISupplier } from '@/stores/product/supplier'
import { getProductImageUrl } from '@/utils/imageUrl'
import { uniqBy } from 'lodash-es'

const props = defineProps<{
  selectedCategory: ICategory | null
}>()

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const getProductsByCategory = computed<{ price: number; count: number }>(() => {
  if (!products.value) return { price: 0, count: 0 }
  if (props.selectedCategory == null) {
    // คำนวณรวมทั้งหมด แยก logic ตาม category
    const totalPrice = products.value.reduce((sum, p) => {
      if (p.category?.name === 'ปลา') {
        return sum + p.price || 0
      } else {
        return sum + (p.food?.costPrice || 0) * (p.balance || 0)
      }
    }, 0)

    return {
      price: totalPrice,
      count: products.value.reduce((sum, p) => sum + (p.balance || 0), 0),
    }
  }

  const filteredProducts = products.value.filter(
    (p) => p.category?._id === props.selectedCategory?._id
  )
  const balance =
    props.selectedCategory?.value === 'fish'
      ? filteredProducts.length
      : filteredProducts.reduce((sum, p) => sum + (p.balance || 0), 0)
  const price =
    props.selectedCategory?.value === 'fish'
      ? filteredProducts.reduce((sum, p) => sum + (p.price || 0), 0)
      : filteredProducts.reduce((sum, p) => sum + (p.food?.costPrice || 0) * (p.balance || 0), 0)

  return {
    price,
    count: balance,
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const totalLabel = computed(() => {
  if (props.selectedCategory == null) {
    return 'มูลค่าคลังทั้งหมด'
  }
  return `มูลค่า${props.selectedCategory?.name}ทั้งหมด`
})

const countLabel = computed(() => {
  if (props.selectedCategory == null) {
    return 'จำนวนสินค้าทั้งหมด'
  }
  return `จำนวน${props.selectedCategory?.name}ทั้งหมด`
})

const getCategoryStats = (category: ICategory) => {
  const filteredProducts = products.value?.filter(
    (p) => p.category?._id === props.selectedCategory?._id
  )

  let ageStats: Record<string, number> = {}
  const seedSizeStats: Record<string, number> = {}

  if (category.value === 'fish' && filteredProducts) {
    // Age statistics
    ageStats = {
      'Tosai (6เดือน-1ปี)': filteredProducts.filter((p) => p.age?.includes('tosai')).length || 0,
      'Nisai (1-2ปี)': filteredProducts.filter((p) => p.age?.includes('nisai')).length || 0,
      'Sansai (2-3ปี)': filteredProducts.filter((p) => p.age?.includes('sansai')).length || 0,
      'Yonsai (3-4ปี)': filteredProducts.filter((p) => p.age?.includes('yonsai')).length || 0,
      'Rokusai (4-5ปี)': filteredProducts.filter((p) => p.age?.includes('rokusai')).length || 0,
    }
  }

  return {
    ageStats,
    seedSizeStats,
  }
}

const supplierStore = useSupplierStore()
const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery<ISupplier[]>({
  queryKey: ['get_suppliers'],
  queryFn: () => supplierStore.onGetSuppliers(),
})

const brandsWithCount = computed(() => {
  if (!suppliers.value) return []

  // สร้าง Map เพื่อนับจำนวนโดยใช้ brand._id เป็น key
  const brandCountMap = new Map<string, { brandName: string; count: number; brandImage: string }>()

  suppliers.value.forEach((supplier) => {
    const brandId = supplier.brand?._id
    const brandName = supplier.brand?.name || 'ไม่ระบุแบรนด์'
    const brandImage = supplier.brand?.image || ''

    if (brandId) {
      if (brandCountMap.has(brandId)) {
        const existing = brandCountMap.get(brandId)!
        existing.count++
      } else {
        brandCountMap.set(brandId, { brandName, count: 1, brandImage })
      }
    }
  })

  // แปลง Map เป็น Array และเรียงตามจำนวน (มากไปน้อย)
  return Array.from(brandCountMap.values()).sort((a, b) => b.count - a.count)
})

const showSupplierModal = ref(false)
const openSupplierModal = () => {
  showSupplierModal.value = true
}
const closeSupplierModal = () => {
  showSupplierModal.value = false
}
const brandFilters = ref('')
const handleBrandFilter = computed(() => {
  if (brandFilters.value === '' || brandFilters.value === null) {
    return suppliers.value
  }
  return suppliers.value?.filter((supplier) => supplier.brand?._id === brandFilters.value)
})
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    <Card
      :pt="{ body: 'p-3 md:p-4' }"
      class="hover:shadow-lg transition-shadow duration-200 justify-start h-max"
    >
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">{{ totalLabel }}</p>
            <p class="text-lg md:text-xl text-green-600">
              {{ formatCurrency(getProductsByCategory?.price || 0) }}
            </p>
            <!-- <p class="text-xs text-gray-500">บาท</p> -->
          </div>
          <div
            class="hidden md:flex w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-shopping-cart text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card
      :pt="{ body: 'p-3 md:p-4' }"
      class="hover:shadow-lg transition-shadow duration-200 justify-start h-max"
    >
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">{{ countLabel }}</p>
            <p class="text-lg md:text-xl text-blue-600">
              {{ getProductsByCategory?.count || 0 }}
            </p>
            <!-- <p class="text-xs text-gray-500">บาท</p> -->
          </div>
          <div
            class="hidden md:flex w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-box text-white text-xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card
      v-if="props.selectedCategory?.value === 'fish'"
      :pt="{ body: 'p-3 md:p-4' }"
      class="hover:shadow-lg transition-shadow duration-200 justify-center col-span-2"
    >
      <template #content>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="(count, age) in getCategoryStats(props.selectedCategory).ageStats"
            :key="age"
            class="text-sm text-gray-600"
          >
            {{ age }} : {{ count }} ตัว
          </div>
        </div>
      </template>
    </Card>

    <Card
      v-if="
        props.selectedCategory?.value === 'food' ||
        props.selectedCategory?.value === 'microorganism'
      "
      :pt="{ body: 'p-3 md:p-4 w-full' }"
      class="hover:shadow-lg transition-shadow duration-200 items-start col-span-2 lg:col-span-4"
    >
      <template #content>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div class="col-span-2 md:col-span-3 flex justify-between">
            <p class="font-[600]! text-gray-700">ข้อมูลซัพพลายเออร์</p>
            <Button
              icon="pi pi-truck"
              severity="info"
              size="small"
              label="ซัพพลายเออร์"
              @click="openSupplierModal"
            />
          </div>

          <div v-for="(item, index) in brandsWithCount" :key="index" class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <img
                v-if="item.brandImage"
                :src="getProductImageUrl(item.brandImage)"
                alt="brand image"
                class="w-auto h-6 rounded object-contain"
                loading="lazy"
                fetchpriority="low"
                crossorigin="anonymous"
              />
              <i v-else class="pi pi-image text-gray-500"></i>
              <p class="truncate font-[600]! text-gray-900 text-sm">{{ item.brandName }}</p>
            </div>

            <div class="flex items-center gap-1">
              <p class="text-sm text-gray-500">จำนวนซัพพลายเออร์: {{ item.count }}</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">พร้อมขาย</p>
            <p class="text-xl md:text-2xl text-green-600">0</p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-check-circle text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">สินค้าสำหรับประมูล</p>
            <p class="text-xl md:text-2xl text-purple-600">0</p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-gavel text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card>

    <Card :pt="{ body: 'p-3 md:p-4' }" class="hover:shadow-lg transition-shadow duration-200">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-[600]! text-gray-600 mb-1">ขายแล้ว</p>
            <p class="text-xl md:text-2xl text-orange-600">0</p>
            <p class="text-xs text-gray-500">รายการ</p>
          </div>
          <div
            class="hidden md:flex w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl items-center justify-center shadow-lg"
          >
            <i class="pi pi-tag text-white text-2xl"></i>
          </div>
        </div>
      </template>
    </Card> -->
  </div>

  <Dialog
    v-model:visible="showSupplierModal"
    @update:visible="closeSupplierModal"
    modal
    :style="{ width: '60rem' }"
    :pt="{
      header: { class: '!p-3' },
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <p class="font-[600]! text-gray-700">ข้อมูลซัพพลายเออร์</p>
      </div>
    </template>

    <div class="flex items-center justify-between w-full">
      <DataTable
        :value="handleBrandFilter"
        :loading="isLoadingSuppliers"
        :paginator="true"
        :rows="25"
        :rowsPerPageOptions="[25, 50, 100]"
        class="!w-full"
        :pt="{
          header: { class: '!px-0 pt-0' },
        }"
      >
        <template #header>
          <div class="flex justify-end">
            <Select
              v-model="brandFilters"
              :options="
                uniqBy(suppliers?.map((supplier) => supplier.brand), '_id').map((brand) => ({
                  label: brand?.name,
                  value: brand?._id,
                }))
              "
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกแบรนด์"
              size="small"
              class="!w-60"
              showClear
            />
          </div>
        </template>

        <Column field="name" header="ชื่อซัพพลายเออร์">
          <template #body="{ data }">
            <p class="text-sm text-gray-500">{{ data.name }}</p>
          </template>
        </Column>
        <Column field="phoneNo" header="หมายเลขโทรศัพท์">
          <template #body="{ data }">
            <p class="text-sm text-gray-500">{{ data.phoneNo }}</p>
          </template>
        </Column>
        <Column field="contact" header="ผู้ติดต่อ">
          <template #body="{ data }">
            <p class="text-sm text-gray-500">
              {{
                supplierStore.supplierContactOptions.find((option) => option.value === data.contact)
                  ?.label
              }}
            </p>
          </template>
        </Column>
        <Column field="brand" header="ยี่ห้อ">
          <template #body="{ data }">
            <div class="flex items-center gap-1.5">
              <img
                v-if="data.brand?.image"
                :src="getProductImageUrl(data.brand.image)"
                alt="brand image"
                class="w-auto h-6 rounded object-contain"
                loading="lazy"
                fetchpriority="low"
                crossorigin="anonymous"
              />
              <i v-else class="pi pi-image text-gray-500"></i>
              <p class="text-sm text-gray-500">{{ data.brand?.name }}</p>
            </div>
          </template>
        </Column>

        <Column field="note" header="หมายเหตุ">
          <template #body="{ data }">
            <p class="text-sm text-gray-500">{{ data.note }}</p>
          </template>
        </Column>
      </DataTable>
    </div>
  </Dialog>
</template>
