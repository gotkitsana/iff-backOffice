<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Button, Card, Tag, Divider } from 'primevue'
import { useSalesStore, type ISales } from '@/stores/sales/sales'
import formatCurrency from '@/utils/formatCurrency'

// Props
const props = defineProps<{
  visible: boolean
  saleData: ISales | null
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const salesStore = useSalesStore()

// Computed
const products = computed(() => props.saleData?.products || [])

const totalAmount = computed(() => {
  if (!props.saleData) return 0
  const productTotal = products.value.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
  return productTotal - props.saleData.discount + props.saleData.deposit
})

const productTotal = computed(() => {
  return products.value.reduce((sum, product) => {
    return sum + (product.price || 0) * product.quantity
  }, 0)
})

const getCategoryIcon = (category: string | null) => {
  const iconMap: Record<string, string> = {
    fish: 'pi-fish',
    equipment: 'pi-box',
    service: 'pi-wrench',
    construction: 'pi-building',
    medicine: 'pi-plus-circle',
    food: 'pi-heart',
    microorganism: 'pi-circle',
    water: 'pi-droplet',
  }
  return iconMap[category || ''] || 'pi-box'
}

const getCategoryColor = (category: string | null) => {
  const colorMap: Record<string, string> = {
    fish: 'text-gray-600',
    equipment: 'text-green-600',
    service: 'text-purple-600',
    construction: 'text-orange-600',
    medicine: 'text-red-600',
    food: 'text-pink-600',
    microorganism: 'text-teal-600',
    water: 'text-blue-600',
  }
  return colorMap[category || ''] || 'text-gray-600'
}

const getCategoryBgColor = (category: string | null) => {
  const bgColorMap: Record<string, string> = {
    fish: 'bg-gray-50',
    equipment: 'bg-green-50',
    service: 'bg-purple-50',
    construction: 'bg-orange-50',
    medicine: 'bg-red-50',
    food: 'bg-pink-50',
    microorganism: 'bg-teal-50',
    water: 'bg-blue-50',
  }
  return bgColorMap[category || ''] || 'bg-gray-50'
}

const getCategoryBorderColor = (category: string | null) => {
  const borderColorMap: Record<string, string> = {
    fish: 'border-gray-200',
    equipment: 'border-green-200',
    service: 'border-purple-200',
    construction: 'border-orange-200',
    medicine: 'border-red-200',
    food: 'border-pink-200',
    microorganism: 'border-teal-200',
    water: 'border-blue-200',
  }
  return borderColorMap[category || ''] || 'border-gray-200'
}

// Handlers
const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '60rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      content: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-box text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-800">รายละเอียดสินค้า</h3>
          <p class="text-sm text-gray-600 uppercase">รายการ: {{ saleData?.item }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card :pt="{ body: 'p-3' }" class="bg-blue-50 border-blue-200">
          <template #content>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ products.length }}</div>
              <div class="text-sm text-blue-700">รายการสินค้า</div>
            </div>
          </template>
        </Card>

        <Card :pt="{ body: 'p-3' }" class="bg-green-50 border-green-200">
          <template #content>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ products.reduce((sum, p) => sum + p.quantity, 0) }}
              </div>
              <div class="text-sm text-green-700">จำนวนชิ้นรวม</div>
            </div>
          </template>
        </Card>

        <Card :pt="{ body: 'p-3' }" class="bg-purple-50 border-purple-200">
          <template #content>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">
                {{ formatCurrency(productTotal) }}
              </div>
              <div class="text-sm text-purple-700">มูลค่ารวม</div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Products List -->
      <div class="space-y-3">
        <h4 class="text-md font-semibold text-gray-800 flex items-center gap-2">
          <i class="pi pi-list text-blue-600"></i>
          รายการสินค้าทั้งหมด
        </h4>

        <div class="space-y-2">
          <Card
            v-for="(product, index) in products"
            :key="index"
            :pt="{ body: 'p-3' }"
            :class="`${getCategoryBgColor(product.category)} border ${getCategoryBorderColor(
              product.category
            )}`"
          >
            <template #content>
              <div class="flex items-center justify-between">
                <!-- Product Info -->
                <div class="flex items-center gap-3 flex-1">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    :class="getCategoryBgColor(product.category)"
                  >
                    <i
                      :class="`pi ${getCategoryIcon(product.category)} text-lg ${getCategoryColor(
                        product.category
                      )}`"
                    ></i>
                  </div>

                  <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-gray-900 text-sm mb-1">{{ product.name }}</h5>
                    <div class="flex items-center gap-2">
                      <Tag
                        :value="
                          salesStore.categoryTypes.find((t) => t.value === product.category)
                            ?.label ||
                          product.category ||
                          'ไม่ระบุ'
                        "
                        severity="secondary"
                        size="small"
                        class="text-xs"
                      />
                      <span class="text-xs text-gray-500">ID: {{ product.id }}</span>
                    </div>
                  </div>
                </div>

                <!-- Quantity & Price -->
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900">{{ product.quantity }} ชิ้น</div>
                  <div class="text-xs text-gray-500">
                    ราคา: {{ formatCurrency(product.price || 0) }} / ชิ้น
                  </div>
                  <div class="text-sm font-bold text-green-600 mt-1">
                    {{ formatCurrency((product.price || 0) * product.quantity) }}
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Summary -->
      <Divider />

      <Card :pt="{ body: 'p-3' }" class="bg-gray-50 border-gray-200">
        <template #content>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">มูลค่าสินค้ารวม:</span>
              <span class="text-sm font-semibold text-gray-900">{{
                formatCurrency(productTotal)
              }}</span>
            </div>

            <div v-if="saleData?.discount > 0" class="flex justify-between items-center">
              <span class="text-sm text-gray-600">ส่วนลด:</span>
              <span class="text-sm font-semibold text-red-600"
                >-{{ formatCurrency(saleData.discount) }}</span
              >
            </div>

            <div v-if="saleData?.deposit > 0" class="flex justify-between items-center">
              <span class="text-sm text-gray-600">มัดจำ:</span>
              <span class="text-sm font-semibold text-blue-600"
                >+{{ formatCurrency(saleData.deposit) }}</span
              >
            </div>

            <Divider class="my-2" />

            <div class="flex justify-between items-center">
              <span class="text-base font-semibold text-gray-800">ยอดสุทธิ:</span>
              <span class="text-lg font-bold text-green-600">{{
                formatCurrency(totalAmount)
              }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ปิด"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
