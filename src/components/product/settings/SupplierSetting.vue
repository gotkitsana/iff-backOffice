<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button, InputText, DataTable, Column, Dialog, Textarea, Select, InputMask } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useSupplierStore,
  type ISupplier,
  type ICreateSupplierPayload,
  type IUpdateSupplierPayload,
} from '../../../stores/product/supplier'
import { useFoodBrandStore, type IFoodBrand } from '@/stores/product/food_brand'
import { getProductImageUrl } from '@/utils/imageUrl'

interface IApiResponse {
  data?: unknown
  error?: {
    message: string
  }
}

interface IErrorResponse {
  response?: {
    data?: {
      message: string
    }
  }
}

const supplierStore = useSupplierStore()
const queryClient = useQueryClient()

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<ISupplier | null>(null)

const form = ref<ICreateSupplierPayload>({
  name: '',
  phoneNo: '',
  contact: '',
  brand: '',
  note: '',
})

const { data: supplierData, isLoading } = useQuery<ISupplier[]>({
  queryKey: ['get_suppliers'],
  queryFn: () => supplierStore.onGetSuppliers(),
})

const suppliers = computed(() => supplierData.value || [])

const { mutate: create, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreateSupplierPayload) => supplierStore.onCreateSupplier(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มซัพพลายเออร์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_suppliers'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มซัพพลายเออร์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create farm error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มซัพพลายเออร์ไม่สำเร็จ')
  },
})

const { mutate: update, isPending: isUpdating } = useMutation({
  mutationFn: (payload: IUpdateSupplierPayload) => supplierStore.onUpdateSupplier(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตซัพพลายเออร์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_suppliers'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตซัพพลายเออร์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update farm error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตซัพพลายเออร์ไม่สำเร็จ')
  },
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: (id: string) => supplierStore.onDeleteSupplier(id),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบซัพพลายเออร์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_suppliers'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบซัพพลายเออร์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete farm error:', error)
    toast.error(error.response?.data?.message || 'ลบซัพพลายเออร์ไม่สำเร็จ')
  },
})

const openModal = (type: 'add' | 'edit' | 'delete', item?: ISupplier) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    form.value = { name: '', phoneNo: '', contact: '', brand: '', note: '' }
  } else if (type === 'edit' && item) {
    form.value = {
      name: item.name,
      phoneNo: item.phoneNo,
      contact: item.contact,
      brand: item.brand?._id,
      note: item.note,
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  form.value = { name: '', phoneNo: '', contact: '', brand: '', note: '' }
}

const handleSubmit = () => {
  if (!form.value.name.trim()) {
    toast.error('กรุณากรอกชื่อซัพพลายเออร์')
    return
  }
  const payload: ICreateSupplierPayload = { ...form.value }
  if (modalType.value === 'add') {
    create(payload)
  } else if (modalType.value === 'edit' && selectedItem.value) {
    update({ _id: selectedItem.value._id, ...payload })
  }
}

const handleDelete = () => {
  if (selectedItem.value) {
    remove(selectedItem.value._id)
  }
}

const isSubmitting = computed(() => isCreating.value || isUpdating.value || isDeleting.value)

const getModalTitle = () => {
  switch (modalType.value) {
    case 'add':
      return 'เพิ่มซัพพลายเออร์สำเร็จ'
    case 'edit':
      return 'แก้ไขซัพพลายเออร์สำเร็จ'
    case 'delete':
      return 'ยืนยันการลบซัพพลายเออร์สำเร็จ'
    default:
      return ''
  }
}

const foodBrandStore = useFoodBrandStore()
const { data: brandData } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})
const getImageUrl = (image: string) => {
  return getProductImageUrl(image)
}
const foodBrandsOptions = computed(
  () =>
    brandData?.value?.map((brand) => ({
      label: brand.name,
      value: brand._id,
      image: brand.image ? getImageUrl(brand.image) : null,
    })) || []
)
</script>

<template>
  <div>
    <!-- Content Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600"
          >
            <i class="pi pi-truck text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">ซัพพลายเออร์</h2>
            <p class="text-gray-600 text-sm">จัดการข้อมูลซัพพลายเออร์</p>
          </div>
        </div>
        <Button
          label="เพิ่มซัพพลายเออร์"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openModal('add')"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div>
      <DataTable
        :value="suppliers"
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
      >
        <Column field="name" header="ชื่อซัพพลายเออร์">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="phoneNo" header="เบอร์ติดต่อ">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{ data.phoneNo }}</span>
          </template>
        </Column>

        <Column field="contact" header="ช่องทางการสั่งซื้อ">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{
              supplierStore.supplierContactOptions.find((option) => option.value === data.contact)
                ?.label
            }}</span>
          </template>
        </Column>

        <Column field="brand" header="แบรนด์">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <img
                v-if="data.brand?.image"
                :src="getImageUrl(data.brand.image)"
                alt="Brand Image"
                class="w-auto h-6 rounded"
              />
              <i v-else class="pi pi-image text-gray-400 text-lg"></i>
              <span class="text-gray-700 text-sm">{{ data.brand?.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="note" header="หมายเหตุ">
          <template #body="{ data }">
            <span class="text-gray-700 text-sm">{{ data.note || '-' }}</span>
          </template>
        </Column>

        <Column header="จัดการ" :pt="{ columnHeaderContent: 'justify-end' }">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Button
                icon="pi pi-pencil"
                size="small"
                severity="info"
                text
                rounded
                @click="openModal('edit', data)"
                v-tooltip.top="'แก้ไข'"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                rounded
                @click="openModal('delete', data)"
                v-tooltip.top="'ลบ'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Modal -->
    <Dialog
      :visible="showModal"
      @update:visible="closeModal"
      modal
      :style="{ width: modalType === 'delete' ? '32rem' : '35rem' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600"
          >
            <i class="pi pi-truck text-white"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-800">{{ getModalTitle() }}</h3>
          </div>
        </div>
      </template>

      <!-- Add/Edit Form -->
      <div v-if="modalType !== 'delete'" class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ชื่อซัพพลายเออร์ <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="form.name"
              placeholder="กรุณากรอกชื่อซัพพลายเออร์"
              fluid
              autocomplete="off"
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              เบอร์ติดต่อ <span class="text-red-500">*</span>
            </label>
            <InputMask
              id="phoneNo"
              v-model="form.phoneNo"
              fluid
              mask="9999999999"
              placeholder="กรุณากรอกเบอร์ติดต่อ"
              size="small"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ช่องทางการสั่งซื้อ <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="form.contact"
              :options="supplierStore.supplierContactOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกช่องทางการสั่งซื้อ"
              autocomplete="off"
              size="small"
              fluid
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >แบรนด์ <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="form.brand"
              :options="foodBrandsOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกแบรนด์"
              size="small"
              fluid
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <img
                    v-if="slotProps.option.image"
                    :src="slotProps.option.image"
                    alt="Brand Image"
                    class="w-auto h-6 rounded"
                  />
                  <i v-else class="pi pi-image text-gray-400 text-lg"></i>
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea
              v-model="form.note"
              rows="3"
              fluid
              placeholder="หมายเหตุเพิ่มเติม"
              autocomplete="off"
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div v-if="modalType === 'delete' && selectedItem" class="space-y-3">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
          <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">ชื่อซัพพลายเออร์:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
          </div>
          <div v-if="selectedItem.note" class="flex justify-between">
            <span class="text-gray-600">หมายเหตุ:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.note }}</span>
          </div>
        </div>
        <p class="text-sm text-red-600">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button
            label="ยกเลิก"
            severity="secondary"
            @click="closeModal"
            size="small"
            :disabled="isSubmitting"
          />
          <Button
            v-if="modalType === 'delete'"
            label="ลบ"
            icon="pi pi-trash"
            @click="handleDelete"
            severity="danger"
            size="small"
            :loading="isSubmitting"
          />
          <Button
            v-else
            :label="modalType === 'add' ? 'เพิ่ม' : 'บันทึก'"
            :loading="isSubmitting"
            @click="handleSubmit"
            size="small"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

