<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Card,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
  Badge,
  DataTable,
  Column,
  Tag,
  Button,
  Dialog,
  InputText,
  Textarea,
  Select,
  InputNumber,
} from 'primevue'
import {
  useProductStore,
  type IProduct,
  type ICreateProductPayload,
} from '@/stores/auction/product'
import { useSpeciesStore } from '@/stores/auction/species'
import { useCategoryStore, type ICategory } from '@/stores/auction/category'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

// Stores
const productStore = useProductStore()
const speciesStore = useSpeciesStore()
const categoryStore = useCategoryStore()

// Data
const activeTab = ref('all')
const showAddModal = ref(false)
const showEditModal = ref(false)
const selectedProduct = ref<IProduct | null>(null)

// Form data
const form = ref<ICreateProductPayload>({
  name: '',
  cateId: '',
  detail: '',
  cat: 1,
  price: 0,
})

// Queries
const {
  data: products,
  isLoading: productsLoading,
  refetch: refetchProducts,
} = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: species, isLoading: speciesLoading } = useQuery<unknown[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})

const { data: categories, isLoading: categoriesLoading } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory({ type: 1 }), // type 1 for fish categories
})

// Computed
const speciesOptions = computed(() => {
  if (!species.value) return []
  return species.value.map((item: unknown) => {
    const speciesItem = item as { name: string; _id: string }
    return {
      label: speciesItem.name,
      value: speciesItem._id,
    }
  })
})

const categoryOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map((item: ICategory) => ({
    label: item.name,
    value: item._id,
  }))
})

// Filtered products
const filteredProducts = computed(() => {
  if (!products.value) return []

  switch (activeTab.value) {
    case 'auction':
      return products.value.filter((p) => p.auctionOnly === 1)
    case 'sold':
      return products.value.filter((p) => p.sold === true)
    default:
      return products.value
  }
})

// Modal functions
const openAddModal = () => {
  resetForm()
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  resetForm()
}

const openEditModal = (product: IProduct) => {
  selectedProduct.value = product
  form.value = {
    name: product.name,
    cateId: product.category || '',
    detail: product.detail,
    cat: product.cat,
    price: product.price || 0,
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedProduct.value = null
  resetForm()
}

const resetForm = () => {
  form.value = {
    name: '',
    cateId: '',
    detail: '',
    cat: 1,
    price: 0,
  }
}

// Mutations
const { mutate: createProduct, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreateProductPayload) => productStore.onCreateProduct(payload),
  onSuccess: () => {
    toast.success('เพิ่มปลาคาร์ฟสำเร็จ')
    closeAddModal()
    refetchProducts()
  },
  onError: (error: unknown) => {
    const errorResponse = error as { message?: string }
    toast.error(errorResponse.message || 'เพิ่มปลาคาร์ฟไม่สำเร็จ')
  },
})

const { mutate: updateProduct, isPending: isUpdating } = useMutation({
  mutationFn: (payload: ICreateProductPayload & { _id: string }) =>
    productStore.onUpdateProduct(payload),
  onSuccess: () => {
    toast.success('แก้ไขปลาคาร์ฟสำเร็จ')
    closeEditModal()
    refetchProducts()
  },
  onError: (error: unknown) => {
    const errorResponse = error as { message?: string }
    toast.error(errorResponse.message || 'แก้ไขปลาคาร์ฟไม่สำเร็จ')
  },
})

const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
  mutationFn: (id: string) => productStore.onDeleteProduct(id),
  onSuccess: () => {
    toast.success('ลบปลาคาร์ฟสำเร็จ')
    refetchProducts()
  },
  onError: (error: unknown) => {
    const errorResponse = error as { message?: string }
    toast.error(errorResponse.message || 'ลบปลาคาร์ฟไม่สำเร็จ')
  },
})

// Handlers
const handleCreateProduct = () => {
  if (!form.value.name || !form.value.cateId || !form.value.detail) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }
  createProduct(form.value)
}

const handleUpdateProduct = () => {
  if (!selectedProduct.value) return
  if (!form.value.name || !form.value.cateId || !form.value.detail) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }
  updateProduct({
    ...form.value,
    _id: selectedProduct.value._id,
  })
}

const handleDeleteProduct = (product: IProduct) => {
  if (confirm(`คุณต้องการลบปลาคาร์ฟ "${product.name}" หรือไม่?`)) {
    deleteProduct(product._id)
  }
}

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value)
}

const getStatusTag = (product: IProduct) => {
  if (product.sold) return { label: 'ขายแล้ว', severity: 'info' }
  if (product.auctionOnly === 1) return { label: 'ประมูลเท่านั้น', severity: 'warning' }
  return { label: 'ทั้งหมด', severity: 'success' }
}

const filterAuction = computed(() => {
  return products.value?.filter((p) => p.auctionOnly === 1).length || 0
})

const filterAuctionSold = computed(() => {
  return products.value?.filter((p) => p.sold).length || 0
})
</script>

<template>
  <div class="md:space-y-4 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">จัดการปลาคาร์ฟ</h1>
        <p class="text-gray-600">เพิ่ม แก้ไข และจัดการข้อมูลปลาคาร์ฟสำหรับการประมูล</p>
      </div>
      <div class="flex space-x-3">
        <Button
          label="เพิ่มปลาคาร์ฟ"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openAddModal"
        />

        <Button
          label="กลับ"
          icon="pi pi-chevron-left"
          severity="contrast"
          size="small"
          @click="$router.back()"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      <Card :pt="{ body: 'p-3 lg:p-5' }">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium! text-gray-600">ทั้งหมด</p>
              <p class="text-lg lg:text-xl font-[600]! text-gray-900">
                {{ products?.length || 0 }}
              </p>
            </div>
            <div
              class="md:w-12 md:h-12 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-hashtag text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-3 lg:p-5' }">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium! text-gray-600">ประมูลเท่านั้น</p>
              <p class="text-lg lg:text-xl font-[600]! text-gray-900">
                {{ products?.filter((p) => p.auctionOnly === 1).length || 0 }}
              </p>
            </div>
            <div
              class="md:w-12 md:h-12 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-star text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card :pt="{ body: 'p-3 lg:p-5' }">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium! text-gray-600">ขายแล้ว</p>
              <p class="text-lg lg:text-xl font-[600]! text-gray-900">
                {{ products?.filter((p) => p.sold).length || 0 }}
              </p>
            </div>
            <div
              class="md:w-12 md:h-12 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-shopping-cart text-purple-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Products Table -->
    <Card :pt="{ body: 'p-3' }">
      <template #content>
        <Tabs v-model:value="activeTab" :pt="{ tablist: 'p-3' }">
          <TabList size="small">
            <Tab value="all" as="div" class="flex items-center gap-2">
              <i class="pi pi-hashtag" />
              <span class="font-[500]! whitespace-nowrap">ทั้งหมด</span>
              <Badge :value="products?.length || 0" severity="info" size="small" />
            </Tab>

            <Tab value="auction" as="div" class="flex items-center gap-2">
              <i class="pi pi-gavel" />
              <span class="font-[500]! whitespace-nowrap">ประมูลเท่านั้น</span>
              <Badge :value="filterAuction" severity="warning" size="small" />
            </Tab>

            <Tab value="sold" as="div" class="flex items-center gap-2">
              <i class="pi pi-shopping-cart" />
              <span class="font-[500]! whitespace-nowrap">ขายแล้ว</span>
              <Badge :value="filterAuctionSold" severity="info" size="small" />
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel
              v-for="tab in ['all', 'auction', 'sold']"
              :key="tab"
              :value="tab"
              as="div"
              class="m-0"
            >
              <DataTable
                :value="filteredProducts"
                :loading="productsLoading"
                :paginator="true"
                :rows="10"
                class="p-datatable-sm"
              >
                <Column field="name" header="ชื่อปลา">
                  <template #body="slotProps">
                    <div class="flex items-center gap-2">
                      <div
                        v-if="slotProps.data.filename"
                        class="w-auto h-10 bg-gray-100 rounded-lg flex items-center justify-center"
                      >
                        <img
                          :src="slotProps.data.filename"
                          alt="product image"
                          class="w-full h-full object-cover rounded-lg aspect-video"
                        />
                      </div>
                      <div
                        v-else
                        class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
                      >
                        <i class="pi pi-fish text-gray-400 text-lg"></i>
                      </div>
                      <div>
                        <p class="font-medium text-sm text-gray-900">{{ slotProps.data.name }}</p>
                        <p class="text-xs text-gray-500">SKU: {{ slotProps.data.sku }}</p>
                      </div>
                    </div>
                  </template>
                </Column>

                <Column field="size" header="ขนาด (ซม.)">
                  <template #body="slotProps">
                    <span class="text-sm">{{ slotProps.data.size }} ซม.</span>
                  </template>
                </Column>

                <Column
                  field="farm"
                  header="ฟาร์ม"
                  :pt="{ columnHeaderContent: 'justify-center', bodyCell: 'text-center' }"
                >
                  <template #body="slotProps">
                    <template v-if="slotProps.data.farm">
                      <Tag :value="slotProps.data.farm" severity="info" size="small" />
                    </template>
                    <template v-else>
                      <span class="text-gray-500 text-sm">ไม่ระบุ</span>
                    </template>
                  </template>
                </Column>

                <Column
                  field="status"
                  header="สถานะ"
                  :pt="{ columnHeaderContent: 'justify-center', bodyCell: 'text-center' }"
                >
                  <template #body="slotProps">
                    <Tag
                      :value="slotProps.data.auctionOnly == 1 ? 'ประมูลเท่านั้น' : 'ไม่ประมูล'"
                      :severity="slotProps.data.auctionOnly == 1 ? 'success' : 'danger'"
                      size="small"
                    />
                  </template>
                </Column>

                <Column field="solid" header="สถานะขาย" :pt="{ columnHeaderContent: 'justify-center', bodyCell: 'text-center' }">
                  <template #body="slotProps">
                    <span
                      class="font-semibold text-sm"
                      :class="slotProps.data.solid ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ slotProps.data.solid ? 'ขายแล้ว' : 'ยังไม่ขาย' }}
                    </span>
                  </template>
                </Column>

                <Column header="การจัดการ" :exportable="false" :pt="{ columnHeaderContent: 'justify-end' }">
                  <template #body="slotProps">
                    <div class="flex justify-end gap-2">
                      <Button
                        icon="pi pi-pencil"
                        severity="info"
                        size="small"
                        @click="openEditModal(slotProps.data)"
                        :disabled="isUpdating"
                      />
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        @click="handleDeleteProduct(slotProps.data)"
                        :disabled="isDeleting"
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

  <!-- Add Product Modal -->
  <Dialog
    v-model:visible="showAddModal"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มปลาคาร์ฟใหม่</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลปลาคาร์ฟให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Basic Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลพื้นฐาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tag mr-1.5 !text-sm"></i>
              ชื่อปลาคาร์ฟ *
            </label>
            <InputText v-model="form.name" placeholder="กรอกชื่อปลาคาร์ฟ" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-dollar mr-1.5 !text-sm"></i>
              ราคา (บาท) *
            </label>
            <InputNumber
              v-model="form.price"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
            <i class="pi pi-file-edit mr-1.5 !text-sm"></i>
            รายละเอียด *
          </label>
          <Textarea
            v-model="form.detail"
            placeholder="กรอกรายละเอียดปลาคาร์ฟ"
            rows="3"
            fluid
            size="small"
          />
        </div>
      </div>

      <!-- Category and Species -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-sitemap text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">หมวดหมู่และสายพันธุ์</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tags mr-1.5 !text-sm"></i>
              หมวดหมู่ *
            </label>
            <Select
              v-model="form.cateId"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกหมวดหมู่"
              :loading="categoriesLoading"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-fish mr-1.5 !text-sm"></i>
              สายพันธุ์
            </label>
            <Select
              :options="speciesOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสายพันธุ์ (ถ้ามี)"
              :loading="speciesLoading"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="closeAddModal"
          :disabled="isCreating"
          size="small"
        />
        <Button
          label="เพิ่มปลาคาร์ฟ"
          icon="pi pi-plus"
          @click="handleCreateProduct"
          :loading="isCreating"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Edit Product Modal -->
  <Dialog
    v-model:visible="showEditModal"
    modal
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-pencil text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">แก้ไขปลาคาร์ฟ</h3>
          <p class="text-sm text-gray-600">แก้ไขข้อมูลปลาคาร์ฟ</p>
        </div>
      </div>
    </template>

    <!-- Same form as Add Modal -->
    <div class="space-y-4">
      <!-- Basic Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-info-circle text-blue-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">ข้อมูลพื้นฐาน</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tag mr-1.5 !text-sm"></i>
              ชื่อปลาคาร์ฟ *
            </label>
            <InputText v-model="form.name" placeholder="กรอกชื่อปลาคาร์ฟ" fluid size="small" />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-dollar mr-1.5 !text-sm"></i>
              ราคา (บาท) *
            </label>
            <InputNumber
              v-model="form.price"
              :min="0"
              :max="999999999"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
            <i class="pi pi-file-edit mr-1.5 !text-sm"></i>
            รายละเอียด *
          </label>
          <Textarea
            v-model="form.detail"
            placeholder="กรอกรายละเอียดปลาคาร์ฟ"
            rows="3"
            fluid
            size="small"
          />
        </div>
      </div>

      <!-- Category and Species -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-sitemap text-green-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">หมวดหมู่และสายพันธุ์</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-tags mr-1.5 !text-sm"></i>
              หมวดหมู่ *
            </label>
            <Select
              v-model="form.cateId"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกหมวดหมู่"
              :loading="categoriesLoading"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              <i class="pi pi-fish mr-1.5 !text-sm"></i>
              สายพันธุ์
            </label>
            <Select
              :options="speciesOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสายพันธุ์ (ถ้ามี)"
              :loading="speciesLoading"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="closeEditModal"
          :disabled="isUpdating"
          size="small"
        />
        <Button
          label="บันทึกการแก้ไข"
          icon="pi pi-check"
          @click="handleUpdateProduct"
          :loading="isUpdating"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
