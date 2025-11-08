<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { Dialog, FileUpload, Select } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useFoodBrandStore,
  type IFoodBrand,
  type ICreateFoodBrandPayload,
  type IUpdateFoodBrandPayload,
} from '../../../stores/product/food_brand'
import type { ICategory } from '@/stores/product/category'
import { useProductStore, type IUploadImageResponse } from '@/stores/product/product'
import { getProductImageUrl } from '@/utils/imageUrl'
import {
  generateProductImageName,
  ALLOWED_IMAGE_EXTENSIONS,
  validateFileName
} from '@/utils/fileNameGenerator'

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

const props = defineProps<{
  selectedCategory: ICategory
  categoryOptions: { label: string; value: string }[]
}>()

const foodBrandStore = useFoodBrandStore()
const queryClient = useQueryClient()

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<IFoodBrand | null>(null)

const form = ref<ICreateFoodBrandPayload>({
  name: '',
  note: '',
  image: '',
  category: props.selectedCategory._id,
})

const { data: foodBrandData, isLoading } = useQuery<IFoodBrand[]>({
  queryKey: ['get_food_brands'],
  queryFn: () => foodBrandStore.onGetFoodBrands(),
})

const foodBrands = computed(() => foodBrandData.value || [])

const { mutate: create, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreateFoodBrandPayload) => foodBrandStore.onCreateFoodBrand(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มชื่อแบรนด์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_food_brands'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มชื่อแบรนด์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create food brand error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มชื่อแบรนด์ไม่สำเร็จ')
  },
})

const { mutate: update, isPending: isUpdating } = useMutation({
  mutationFn: (payload: IUpdateFoodBrandPayload) => foodBrandStore.onUpdateFoodBrand(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตชื่อแบรนด์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_food_brands'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตชื่อแบรนด์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update food brand error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตชื่อแบรนด์ไม่สำเร็จ')
  },
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: (foodBrandId: string) => foodBrandStore.onDeleteFoodBrand(foodBrandId),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบชื่อแบรนด์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_food_brands'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบชื่อแบรนด์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete food brand error:', error)
    toast.error(error.response?.data?.message || 'ลบชื่อแบรนด์ไม่สำเร็จ')
  },
})

const openModal = (type: 'add' | 'edit' | 'delete', item?: IFoodBrand) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    form.value = { name: '', note: '', image: '', category: props.selectedCategory._id }
  } else if (type === 'edit' && item) {
    form.value = {
      name: item.name,
      note: item.note,
      image: item.image,
      category: item.category?._id,
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  form.value = { name: '', note: '', image: '', category: '' }
}

const validate = () => {
  if (!form.value.name.trim()) {
    toast.error('กรุณากรอกชื่อแบรนด์')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validate()) return

  const payload = {
    name: form.value.name.trim(),
    note: form.value.note.trim(),
    image: form.value.image,
    category: form.value.category,
  }

  if (modalType.value === 'add') {
    create(payload)
  } else if (modalType.value === 'edit' && selectedItem.value) {
    update({
      _id: selectedItem.value._id,
      name: payload.name,
      note: payload.note,
      image: payload.image,
      category: payload.category,
    })
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
      return 'เพิ่มชื่อแบรนด์'
    case 'edit':
      return 'แก้ไขชื่อแบรนด์'
    case 'delete':
      return 'ยืนยันการลบชื่อแบรนด์'
    default:
      return ''
  }
}

const getImageUrl = (image: string) => {
  return getProductImageUrl(image)
}

const filteredFoodBrands = computed(() => {
  return foodBrands.value.filter(
    (foodBrand) => foodBrand?.category?._id === props.selectedCategory._id
  )
})

const validateFileUpload = (file: File, maxSize: number = 1000000) => {
  if (file.size > maxSize) {
    toast.error('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 1MB)')
    return false
  }
  return true
}

const handleImageUpload = (event: { files: File[] }) => {
  const file = event.files[0]

  if (!file) return

  // Validate ประเภทไฟล์
  if (!validateFileName(file.name, ALLOWED_IMAGE_EXTENSIONS)) {
    toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`)
    return
  }

  // Validate ขนาดไฟล์
  if (!validateFileUpload(file)) {
    return
  }

  // สร้างชื่อไฟล์ใหม่พร้อม timestamp
  const newFileName = generateProductImageName(file.name)
  console.log('Product image filename:', newFileName)

  // สร้าง File object ใหม่
  const renamedFile = new File([file], newFileName, { type: file.type })

  // อัพโหลดไฟล์
  uploadImage(renamedFile)
}

const productStore = useProductStore()
const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
  mutationFn: (file: File) => productStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename
    form.value.image = filename
    toast.success('อัปโหลดรูปภาพสำเร็จ')
  },
  onError: (error: any) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ')
  },
})
</script>

<template>
  <div >
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-gray-500 to-gray-600"
          >
            <i class="pi pi-building text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">ชื่อแบรนด์</h2>
            <p class="text-gray-600 text-sm">จัดการชื่อแบรนด์สินค้า</p>
          </div>
        </div>
        <Button
          label="เพิ่มชื่อแบรนด์"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openModal('add')"
        />
      </div>
    </div>

    <div>
      <DataTable
        :value="filteredFoodBrands"
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
      >
        <Column field="image" header="รูปแบรนด์">
          <template #body="{ data }">
            <img
              v-if="data.image"
              :src="getImageUrl(data.image)"
              alt="Food brand image"
              class="w-auto h-12 object-contain rounded"
              loading="lazy"
              fetchpriority="low"
              crossorigin="anonymous"
            />
            <span v-else class="text-gray-400 text-xs">ไม่มีรูปภาพ</span>
          </template>
        </Column>
        <Column field="name" header="ชื่อแบรนด์">
          <template #body="{ data }">
            <span class="font-medium text-gray-900">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="category" header="ประเภท">
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.category?.name || 'ไม่ระบุ' }}</span>
          </template>
        </Column>

        <Column field="note" header="หมายเหตุ">
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.note }}</span>
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

    <Dialog
      :visible="showModal"
      @update:visible="closeModal"
      modal
      :style="{ width: modalType === 'delete' ? '32rem' : '35rem' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-gray-500 to-gray-600"
          >
            <i class="pi pi-building text-white"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-800">{{ getModalTitle() }}</h3>
          </div>
        </div>
      </template>

      <div v-if="modalType !== 'delete'" class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >ชื่อแบรนด์ <span class="text-red-500">*</span></label
            >
            <InputText
              v-model="form.name"
              placeholder="เช่น ยี่ห้อ A"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div v-if="modalType == 'edit'">
            <label class="text-sm font-medium text-gray-700 mb-1 block">ประเภท</label>
            <Select
              v-model="form.category"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              fluid
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <InputText
              v-model="form.note"
              placeholder="หมายเหตุเพิ่มเติม"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">รูปแบรนด์</label>
            <img
              v-if="form.image"
              :src="getImageUrl(form.image)"
              alt="Food brand image"
              class="w-auto h-48 object-contain rounded pb-2"
              loading="lazy"
              fetchpriority="low"
              crossorigin="anonymous"
            />
            <FileUpload
              mode="basic"
              :maxFileSize="1000000"
              accept="image/*"
              @select="handleImageUpload"
              :chooseLabel="isUploadingImage ? 'กำลังอัปโหลด...' : 'เลือกรูปแบรนด์'"
              :disabled="isUploadingImage"
              size="small"
              :fileLimit="1"
              class="p-button-sm"
            />
            <small class="text-gray-500 text-xs">รูปแบรนด์ต้องมีขนาดไม่เกิน 1MB</small>
          </div>
        </div>
      </div>

      <div v-if="modalType === 'delete' && selectedItem" class="space-y-3">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
          <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">ชื่อแบรนด์:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
          </div>
          <div class="flex justify-between">
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
