<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Card,
  DataTable,
  Column,
  Tag,
  Button,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
} from 'primevue'
import { useProductStore, type IProduct } from '@/stores/product/product'
import { useQuery } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import ModalAddProduct from '@/components/product/ModalAddProduct.vue'
import ModalEditProduct from '@/components/product/ModalEditProduct.vue'
import ModalProductDetail from '@/components/product/ModalProductDetail.vue'
import formatCurrency from '@/utils/formatCurrency'

// Stores
const productStore = useProductStore()

// Data
const activeTab = ref('sale')
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const selectedProduct = ref<IProduct | null>(null)

// Queries
const {
  data: products,
  isLoading: isLoadingProducts,
  refetch: refetchProducts,
} = useQuery<IProduct[]>({
  queryKey: ['products'],
  queryFn: () => productStore.onGetProducts(),
})

// Computed
const saleProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => p.auctionOnly === 0)
})

const auctionProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => p.auctionOnly === 1)
})

const currentProducts = computed(() => {
  return activeTab.value === 'sale' ? saleProducts.value : auctionProducts.value
})

// Stats
const totalSaleProducts = computed(() => saleProducts.value.length)
const totalAuctionProducts = computed(() => auctionProducts.value.length)
const availableSaleProducts = computed(() => saleProducts.value.filter((p) => !p.sold).length)
const availableAuctionProducts = computed(() => auctionProducts.value.filter((p) => !p.sold).length)

// Utility functions

const getProductTypeTag = (type: number) => {
  switch (type) {
    case 1:
      return { label: 'ปลาคาร์ฟ', severity: 'info' }
    case 2:
      return { label: 'ปลาทอง', severity: 'warning' }
    case 3:
      return { label: 'ปลาอื่นๆ', severity: 'secondary' }
    default:
      return { label: 'ไม่ระบุ', severity: 'secondary' }
  }
}

const getGenderTag = (gender: number) => {
  switch (gender) {
    case 1:
      return { label: 'ตัวผู้', severity: 'info' }
    case 2:
      return { label: 'ตัวเมีย', severity: 'warning' }
    default:
      return { label: 'ไม่ระบุ', severity: 'secondary' }
  }
}

const getStatusTag = (sold: boolean) => {
  return sold
    ? { label: 'ขายแล้ว', severity: 'danger' }
    : { label: 'พร้อมขาย', severity: 'success' }
}

// Handlers
const openAddModal = () => {
  showAddModal.value = true
}

const openEditModal = (product: IProduct) => {
  selectedProduct.value = product
  showEditModal.value = true
}

const openDetailModal = (product: IProduct) => {
  selectedProduct.value = product
  showDetailModal.value = true
}

const handleProductAdded = () => {
  refetchProducts()
  showAddModal.value = false
  toast.success('เพิ่มสินค้าสำเร็จ')
}

const handleProductUpdated = () => {
  refetchProducts()
  showEditModal.value = false
  toast.success('อัปเดตสินค้าสำเร็จ')
}

const handleProductDeleted = () => {
  refetchProducts()
  toast.success('ลบสินค้าสำเร็จ')
}
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">จัดการสินค้า</h1>
        <p class="text-gray-600">จัดการสินค้าสำหรับขายและประมูล</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="เพิ่มสินค้า"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openAddModal"
        />
      </div>
    </div>

    <!-- Product Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">สินค้าสำหรับขาย</p>
              <p class="text-xl md:text-2xl text-blue-600">{{ totalSaleProducts }}</p>
              <p class="text-xs text-gray-500">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-shopping-cart text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">พร้อมขาย</p>
              <p class="text-xl md:text-2xl text-green-600">{{ availableSaleProducts }}</p>
              <p class="text-xs text-gray-500">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-check text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">สินค้าสำหรับประมูล</p>
              <p class="text-xl md:text-2xl text-purple-600">{{ totalAuctionProducts }}</p>
              <p class="text-xs text-gray-500">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-gavel text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-4' }" class="hover:shadow-lg transition-shadow duration-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-[600]! text-gray-600 mb-1">พร้อมประมูล</p>
              <p class="text-xl md:text-2xl text-orange-600">{{ availableAuctionProducts }}</p>
              <p class="text-xs text-gray-500">รายการ</p>
            </div>
            <div
              class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-star text-white text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Product Tabs -->
    <Card :pt="{ body: 'p-0' }">
      <template #content>
        <Tabs v-model="activeTab" class="w-full" :value="activeTab">
          <TabList class="flex border-b border-gray-200">
            <Tab value="sale" class="flex-1">
              <div class="flex items-center gap-2 py-3 px-4">
                <i class="pi pi-shopping-cart text-blue-600"></i>
                <span class="font-medium">สินค้าสำหรับขาย</span>
                <Tag :value="totalSaleProducts.toString()" severity="info" size="small" />
              </div>
            </Tab>
            <Tab value="auction" class="flex-1">
              <div class="flex items-center gap-2 py-3 px-4">
                <i class="pi pi-gavel text-purple-600"></i>
                <span class="font-medium">สินค้าสำหรับประมูล</span>
                <Tag :value="totalAuctionProducts.toString()" severity="warning" size="small" />
              </div>
            </Tab>
          </TabList>

          <TabPanels class="p-4">
            <TabPanel value="sale">
              <DataTable
                :value="currentProducts"
                :loading="isLoadingProducts"
                :paginator="true"
                :rows="10"
                scrollHeight="600px"
              >
                <Column
                  field="name"
                  header="ชื่อสินค้า"
                  :pt="{ columnHeaderContent: 'min-w-[8rem]' }"
                >
                  <template #body="slotProps">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
                      >
                        <i class="pi pi-fish text-blue-600 text-lg"></i>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ slotProps.data.name }}</p>
                        <p class="text-xs text-gray-500">{{ slotProps.data.sku }}</p>
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="type"
                  header="ประเภท"
                  :pt="{
                    columnHeaderContent: 'min-w-[6rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="getProductTypeTag(slotProps.data.type).label"
                      :severity="getProductTypeTag(slotProps.data.type).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column
                  field="size"
                  header="ขนาด (ซม.)"
                  :pt="{
                    columnHeaderContent: 'min-w-[5rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <span class="text-sm text-gray-900">{{ slotProps.data.size }}</span>
                  </template>
                </Column>

                <Column
                  field="gender"
                  header="เพศ"
                  :pt="{
                    columnHeaderContent: 'min-w-[4rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="getGenderTag(slotProps.data.gender).label"
                      :severity="getGenderTag(slotProps.data.gender).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column
                  field="price"
                  header="ราคา"
                  :pt="{ columnHeaderContent: 'min-w-[6rem] justify-end', bodyCell: 'text-end' }"
                >
                  <template #body="slotProps">
                    <span class="font-medium text-gray-900 text-sm">
                      {{ slotProps.data.price ? formatCurrency(slotProps.data.price) : 'ไม่ระบุ' }}
                    </span>
                  </template>
                </Column>

                <Column
                  field="sold"
                  header="สถานะ"
                  :pt="{
                    columnHeaderContent: 'min-w-[5rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="getStatusTag(slotProps.data.sold).label"
                      :severity="getStatusTag(slotProps.data.sold).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column
                  field="category"
                  header="หมวดหมู่"
                  :pt="{ columnHeaderContent: 'min-w-[6rem]' }"
                >
                  <template #body="slotProps">
                    <span class="text-sm text-gray-900">{{
                      slotProps.data.category || 'ไม่ระบุ'
                    }}</span>
                  </template>
                </Column>

                <Column field="farm" header="ฟาร์ม" :pt="{ columnHeaderContent: 'min-w-[6rem]' }">
                  <template #body="slotProps">
                    <span class="text-sm text-gray-900">{{ slotProps.data.farm }}</span>
                  </template>
                </Column>

                <Column
                  header="การจัดการ"
                  :exportable="false"
                  frozen
                  :pt="{ columnHeaderContent: 'justify-end' }"
                >
                  <template #body="slotProps">
                    <div class="flex gap-2 justify-end">
                      <Button
                        icon="pi pi-eye"
                        severity="info"
                        size="small"
                        outlined
                        @click="openDetailModal(slotProps.data)"
                        v-tooltip.top="'ดูรายละเอียด'"
                      />
                      <Button
                        icon="pi pi-pencil"
                        severity="warning"
                        size="small"
                        outlined
                        @click="openEditModal(slotProps.data)"
                        v-tooltip.top="'แก้ไขข้อมูล'"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <TabPanel value="auction">
              <DataTable
                :value="currentProducts"
                :loading="isLoadingProducts"
                :paginator="true"
                :rows="10"
                scrollHeight="600px"
              >
                <Column
                  field="name"
                  header="ชื่อสินค้า"
                  :pt="{ columnHeaderContent: 'min-w-[8rem]' }"
                >
                  <template #body="slotProps">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"
                      >
                        <i class="pi pi-gavel text-purple-600 text-lg"></i>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ slotProps.data.name }}</p>
                        <p class="text-xs text-gray-500">{{ slotProps.data.sku }}</p>
                      </div>
                    </div>
                  </template>
                </Column>

                <Column
                  field="type"
                  header="ประเภท"
                  :pt="{
                    columnHeaderContent: 'min-w-[6rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="getProductTypeTag(slotProps.data.type).label"
                      :severity="getProductTypeTag(slotProps.data.type).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column
                  field="size"
                  header="ขนาด (ซม.)"
                  :pt="{
                    columnHeaderContent: 'min-w-[5rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <span class="text-sm text-gray-900">{{ slotProps.data.size }}</span>
                  </template>
                </Column>

                <Column
                  field="gender"
                  header="เพศ"
                  :pt="{
                    columnHeaderContent: 'min-w-[4rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="getGenderTag(slotProps.data.gender).label"
                      :severity="getGenderTag(slotProps.data.gender).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column
                  field="rate"
                  header="คะแนน"
                  :pt="{
                    columnHeaderContent: 'min-w-[5rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <div class="flex items-center justify-center gap-1">
                      <i class="pi pi-star-fill text-yellow-500 text-sm"></i>
                      <span class="text-sm text-gray-900">{{ slotProps.data.rate || 0 }}</span>
                    </div>
                  </template>
                </Column>

                <Column
                  field="sold"
                  header="สถานะ"
                  :pt="{
                    columnHeaderContent: 'min-w-[5rem] justify-center',
                    bodyCell: 'text-center',
                  }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="getStatusTag(slotProps.data.sold).label"
                      :severity="getStatusTag(slotProps.data.sold).severity"
                      size="small"
                    />
                  </template>
                </Column>

                <Column
                  field="category"
                  header="หมวดหมู่"
                  :pt="{ columnHeaderContent: 'min-w-[6rem]' }"
                >
                  <template #body="slotProps">
                    <span class="text-sm text-gray-900">{{
                      slotProps.data.category || 'ไม่ระบุ'
                    }}</span>
                  </template>
                </Column>

                <Column field="farm" header="ฟาร์ม" :pt="{ columnHeaderContent: 'min-w-[6rem]' }">
                  <template #body="slotProps">
                    <span class="text-sm text-gray-900">{{ slotProps.data.farm }}</span>
                  </template>
                </Column>

                <Column
                  header="การจัดการ"
                  :exportable="false"
                  frozen
                  :pt="{ columnHeaderContent: 'justify-end' }"
                >
                  <template #body="slotProps">
                    <div class="flex gap-2 justify-end">
                      <Button
                        icon="pi pi-eye"
                        severity="info"
                        size="small"
                        outlined
                        @click="openDetailModal(slotProps.data)"
                        v-tooltip.top="'ดูรายละเอียด'"
                      />
                      <Button
                        icon="pi pi-pencil"
                        severity="warning"
                        size="small"
                        outlined
                        @click="openEditModal(slotProps.data)"
                        v-tooltip.top="'แก้ไขข้อมูล'"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>

  <!-- Modal Components -->
  <ModalAddProduct v-model:visible="showAddModal" @product-added="handleProductAdded" />

  <ModalEditProduct
    v-model:visible="showEditModal"
    :product-data="selectedProduct"
    @product-updated="handleProductUpdated"
  />

  <ModalProductDetail
    v-model:visible="showDetailModal"
    :product-data="selectedProduct"
    @edit-product="openEditModal"
    @product-deleted="handleProductDeleted"
  />
</template>
