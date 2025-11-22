<script setup lang="ts">
import { Image as PrimeImage } from 'primevue'
import { Tag } from 'primevue'
import { getProductImageUrl } from '@/utils/imageUrl'
import formatCurrency from '@/utils/formatCurrency'
import type { IProduct } from '@/stores/product/product'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import { useQuery } from '@tanstack/vue-query'

// Props
const props = defineProps<{
  products: {
    id: string
    name?: string
    quantity: number
    unit?: string
    price?: number | null
    category?: string
  }[]
  customProducts?: Array<{
    name: string
    quantity: number
    description?: string
  }>
  productsData?: IProduct[]
}>()

const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

// Function to get product image URL
const getProductImage = (productId: string): string | undefined => {
  if (!productId || !props.productsData) return undefined
  const product = props.productsData.find((p) => p._id === productId)
  if (!product || !product.images || product.images.length === 0) return undefined
  return getProductImageUrl(product.images[0].filename)
}

// Function to find category
const handleFindCategory = (categoryId: string | null | undefined): ICategory | undefined => {
  if (!categoryId || !categories.value) return undefined
  return categories.value.find((category) => category._id === categoryId)
}

// Function to get product category
const getProductCategory = (productId: string, categoryId?: string): ICategory | undefined => {
  if (!productId || !props.productsData) return undefined
  const product = props.productsData.find((p) => p._id === productId)
  if (!product) return undefined

  if (categoryId) {
    return handleFindCategory(categoryId)
  }

  return handleFindCategory(product.category?._id)
}

// Function to get card classes based on category
const getCardClasses = (productId: string, categoryId?: string): string => {
  const category = getProductCategory(productId, categoryId)
  if (!category) {
    return 'bg-gray-50 border border-gray-200'
  }

  // ใช้สีอ่อนกว่า bgColor สำหรับ card background
  const bgColor = category.bgColor?.replace('-100', '-50') || 'bg-gray-50'

  // สร้าง border color จาก category value
  let borderColor = 'border-gray-200'
  if (category.value === 'fish') {
    borderColor = 'border-blue-200'
  } else if (category.value === 'food') {
    borderColor = 'border-red-200'
  } else if (category.value === 'microorganism') {
    borderColor = 'border-purple-200'
  }

  return `${bgColor} border ${borderColor}`
}

// Function to get product detail/description
const getProductDetail = (productId: string, categoryId?: string): string => {
  if (!productId || !props.productsData) return ''

  const product = props.productsData.find((p) => p._id === productId)
  if (!product) return ''

  const category = categoryId
    ? handleFindCategory(categoryId)
    : handleFindCategory(product.category?._id)
  if (!category) return ''

  const isFish = category.value === 'fish'
  const isFood = category.value === 'food'
  const isMicroorganism = category.value === 'microorganism'

  const details: string[] = []

  // เลขล็อต (ทุกหมวดหมู่)
  if (product.lotNumber?.name) {
    details.push(`เลขล็อต: ${product.lotNumber.name}`)
  }

  if (isFish && product) {
    if (product.species?.name) {
      details.push(`สายพันธุ์: ${product.species.name}`)
    }
    if (product.weight) {
      details.push(`น้ำหนัก: ${product.weight} กก.`)
    }
    if (product.size) {
      details.push(`ขนาด: ${product.size} ซม.`)
    }
    if (product.age) {
      details.push(`อายุ: ${product.age.toUpperCase()}`)
    }
  }

  if (isFood && product) {
    if (product.foodtype?.name) {
      details.push(`ประเภทอาหาร: ${product.foodtype.name}`)
    }
    if (product.seedType) {
      details.push(`ชนิดเม็ด: ${product.seedType}`)
    }
    if (product.seedSize?.name) {
      details.push(`ขนาดเม็ด: ${product.seedSize.name}`)
    }
    if (product.brand?.name) {
      details.push(`ยี่ห้อ: ${product.brand.name}`)
    }
  }

  if (isMicroorganism && product) {
    // น้ำหนัก (กรัม) สำหรับ สารปรับสภาพน้ำ
    if (product.weight) {
      // แปลงจากกก. เป็นกรัม (ถ้า weight เป็นกก.)
      const weightInGrams = product.weight * 1000
      details.push(`น้ำหนัก: ${weightInGrams} กรัม`)
    }
    if (product.sku) {
      details.push(`รหัส: ${product.sku}`)
    }
  }

  return details.join(' • ')
}

const unitLabel = (unit?: string) => {
  if (!unit) return '-'
  if (unit === 'kg') return 'กก.'
  if (unit === 'packet') return 'กระสอบ'
  if (unit === 'piece') return 'ชิ้น'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Products -->
    <div v-if="products && products.length > 0" class="border border-gray-200 rounded-xl p-4">
      <h4 class="font-medium text-gray-800 flex items-center gap-2 mb-3">
        <i class="pi pi-box text-blue-600"></i>
        สินค้าที่เพิ่มแล้ว
      </h4>

      <!-- Header Row -->
      <div class="md:grid grid-cols-12 rounded-lg gap-1.5 p-2 pt-0 hidden">
        <div class="col-span-6">
          <div class="text-sm font-semibold! text-gray-900">รายการ</div>
        </div>
        <div class="col-span-2 text-center">
          <div class="text-sm font-semibold! text-gray-900">จำนวน</div>
        </div>
        <div class="col-span-2 text-right">
          <div class="text-sm font-semibold! text-gray-900">ราคา</div>
        </div>
        <div class="col-span-2 text-right">
          <div class="text-sm font-semibold! text-gray-900">ยอดรวม</div>
        </div>
      </div>

      <!-- Product Items -->
      <div class="flex flex-col gap-3">
        <div
          v-for="(product, index) in products"
          :key="index"
          :class="[
            'grid grid-cols-6 md:grid-cols-12 gap-2 md:gap-1.5 items-center rounded-xl p-2 shadow-sm transition-all hover:shadow-md',
            getCardClasses(product.id, product.category),
          ]"
        >
          <!-- Product Info (Item) -->
          <div class="col-span-6 flex items-center gap-2 md:gap-3">
            <!-- Product Image -->
            <div class="flex-shrink-0">
              <div v-if="getProductImage(product.id)" class="w-auto h-15 md:h-17">
                <PrimeImage
                  :src="getProductImage(product.id)"
                  :alt="product.name || `สินค้า ${index + 1}`"
                  :preview="true"
                  class="w-full h-full object-contain rounded overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                />
              </div>
              <div v-else class="w-15 md:w-17 h-15 md:h-17 bg-gray-200 rounded-lg flex items-center justify-center">
                <i class="pi pi-image text-gray-100 text-base"></i>
              </div>
            </div>
            <!-- Product Name & Description -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <div class="text-base font-semibold! text-gray-900">
                  {{ product.name || `-` }}
                </div>
              </div>
              <Tag
                  v-if="getProductCategory(product.id, product.category)"
                  :value="getProductCategory(product.id, product.category)?.name || ''"
                  :severity="
                    getProductCategory(product.id, product.category)?.value === 'fish'
                      ? 'info'
                      : getProductCategory(product.id, product.category)?.value === 'food'
                      ? 'success'
                      : getProductCategory(product.id, product.category)?.value === 'microorganism'
                      ? 'warn'
                      : 'info'
                  "
                  size="small"
                  class="text-xs"
                />
              <div
                v-if="getProductDetail(product.id, product.category)"
                class="text-xs text-gray-600 mt-0.5"
              >
                {{ getProductDetail(product.id, product.category) }}
              </div>
            </div>
          </div>

          <!-- Quantity -->
          <div class="col-span-2 text-center">
            <p class="text-sm text-gray-600 md:hidden">จำนวน:</p>
            <div class="text-sm font-semibold text-gray-900">
              {{ product.quantity }} {{ unitLabel(product.unit) }}
            </div>
          </div>

          <!-- Price -->
          <div class="col-span-2 text-right">
            <p class="text-sm text-gray-600 md:hidden">ราคา:</p>
            <div class="text-sm font-semibold text-gray-900">
              {{ formatCurrency(product.price || 0) }}
            </div>
          </div>

          <!-- Amount -->
          <div class="col-span-2 text-right">
            <p class="text-sm text-gray-600 md:hidden">ยอดรวม:</p>
            <div class="text-sm font-semibold text-gray-900">
              {{ formatCurrency((product.price || 0) * product.quantity) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Products -->
    <div v-if="customProducts && customProducts.length > 0" class="flex flex-col gap-4">
      <h4 class="text-base font-medium text-gray-800 flex items-center gap-2">
        <i class="pi pi-shopping-cart text-orange-600 text-base"></i>
        สินค้านอกเหนือรายการ
      </h4>

      <!-- Header Row -->
      <div class="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg">
        <div class="col-span-5">
          <div class="text-sm font-semibold text-gray-900">รายการ</div>
        </div>
        <div class="col-span-2 text-center">
          <div class="text-sm font-semibold text-gray-900">จำนวน</div>
        </div>
        <div class="col-span-2 text-right">
          <div class="text-sm font-semibold text-gray-900">ราคา</div>
        </div>
        <div class="col-span-3 text-right">
          <div class="text-sm font-semibold text-gray-900">ยอดรวม</div>
        </div>
      </div>

      <!-- Custom Product Items -->
      <div class="flex flex-col gap-3">
        <div
          v-for="(product, index) in customProducts"
          :key="index"
          class="grid grid-cols-12 gap-4 items-center bg-white border border-gray-200 rounded-lg p-4"
        >
          <!-- Product Info (Item) -->
          <div class="col-span-5 flex items-center gap-3">
            <!-- Product Image Placeholder -->
            <div class="flex-shrink-0">
              <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-shopping-cart text-gray-400 text-base"></i>
              </div>
            </div>
            <!-- Product Name & Description -->
            <div class="flex-1 min-w-0">
              <div class="text-base font-semibold text-gray-900 mb-1">{{ product.name }}</div>
              <div v-if="product.description" class="text-xs text-gray-600">
                {{ product.description }}
              </div>
            </div>
          </div>

          <!-- Quantity -->
          <div class="col-span-2 text-center">
            <div class="text-sm font-semibold text-gray-900">{{ product.quantity }} ชิ้น</div>
          </div>

          <!-- Price -->
          <div class="col-span-2 text-right">
            <div class="text-sm font-semibold text-gray-900">-</div>
          </div>

          <!-- Amount -->
          <div class="col-span-3 text-right">
            <div class="text-base font-semibold text-gray-900">-</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

