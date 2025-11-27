<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, Select } from 'primevue'
import type { IProduct } from '@/stores/product/product'
import { useGreenhouseStore, type IGreenhouse } from '@/stores/fish/greenhouse'
import { usePondStore, type IPond } from '@/stores/fish/pond'
import { useProductStore } from '@/stores/product/product'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'

const props = defineProps<{
  visible: boolean
  selectedProducts: IProduct[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
}>()

const greenhouseStore = useGreenhouseStore()
const pondStore = usePondStore()
const productStore = useProductStore()
const queryClient = useQueryClient()

const selectedGreenhouse = ref<string | null>(null)
const selectedPond = ref<string | null>(null)


// Queries
const { data: greenhouses } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})

const { data: ponds } = useQuery<IPond[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})

// Computed
const greenhouseOptions = computed(() => {
  return greenhouses.value?.map(g => ({
    label: g.name,
    value: g._id
  })) || []
})

const filteredPondOptions = computed(() => {
  if (!selectedGreenhouse.value || !ponds.value) return []
  return ponds.value
    .filter(p => p.greenhouse?._id === selectedGreenhouse.value)
    .map(p => ({
      label: p.code,
      value: p._id
    }))
})

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedGreenhouse.value = null
    selectedPond.value = null
  }
})

watch(selectedGreenhouse, () => {
  selectedPond.value = null
})

// Mutation
const { mutate: updatePonds, isPending: isUpdatingPonds } = useMutation({
  mutationFn: async (products: IProduct[]) => {
    const promises = products.map((product) =>
      productStore.onUpdatePond({
        _id: product._id,
        fishpond: selectedPond.value!
      })
    )
    return await Promise.allSettled(promises)
  },
  onSuccess: (results) => {
    let successCount = 0
    let failCount = 0

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        successCount++
      } else {
        failCount++
        console.error('Failed to update product:', result.reason)
      }
    })

    if (successCount > 0) {
      toast.success(`ย้ายบ่อสำเร็จ ${successCount} รายการ`)
      queryClient.invalidateQueries({ queryKey: ['get_products'] })

      if (props.selectedProducts[0]?.category?._id) {
        queryClient.invalidateQueries({
          queryKey: ['get_products_by_category', props.selectedProducts[0].category._id]
        })
      }
    }

    if (failCount > 0) {
      toast.error(`ย้ายบ่อไม่สำเร็จ ${failCount} รายการ`)
    }

    handleClose()
  },
  onError: (error) => {
    console.error('Critical error in mutation execution', error)
    toast.error('เกิดข้อผิดพลาดในการย้ายบ่อ')
  }
})

const handleSave = () => {
  if (!selectedPond.value) {
    toast.error('กรุณาเลือกบ่อ')
    return
  }

  updatePonds(props.selectedProducts)
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="ย้ายบ่อ"
    :style="{ width: '30rem' }" :pt="{
      header: 'p-4',
      footer: 'p-4',
    }">
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">เลือกกรีนเฮ้าส์</label>
        <Select v-model="selectedGreenhouse" :options="greenhouseOptions" optionLabel="label" optionValue="value"
          placeholder="เลือกกรีนเฮ้าส์" class="w-full" filter size="small" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">เลือกบ่อ</label>
        <Select v-model="selectedPond" :options="filteredPondOptions" optionLabel="label" optionValue="value"
          placeholder="เลือกบ่อ" class="w-full" filter :disabled="!selectedGreenhouse" size="small" />
      </div>

      <div class="text-sm text-gray-500">
        รายการที่เลือก: {{ selectedProducts.length }} รายการ
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="handleClose" size="small" />
        <Button label="บันทึก" icon="pi pi-check" @click="handleSave" severity="success" size="small"
          :loading="isUpdatingPonds" :disabled="!selectedPond" />
      </div>
    </template>
  </Dialog>
</template>
