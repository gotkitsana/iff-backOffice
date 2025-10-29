<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button, InputText, InputNumber, DataTable, Column, Dialog, FileUpload, Textarea } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  usePondStore,
  type IPond,
  type ICreatePondPayload,
  type IUpdatePondPayload,
} from '../../stores/product/pond'

interface IPondImage {
  filename: string
  type: string
  preview?: string
}

interface IUploadImageResponse {
  filename: string
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  path: string
  size: number
}

// Router & Stores
const router = useRouter()
const pondStore = usePondStore()
const queryClient = useQueryClient()

// Data
const showAddPond = ref(false)
const showEditPond = ref(false)
const showDeleteModal = ref(false)
const selectedPond = ref<IPond | null>(null)
const pondImages = ref<IPondImage[]>([])

// Form data
const pondForm = ref<ICreatePondPayload>({
  code: '',
  name: '',
  width: 0,
  length: 0,
  depth: 0,
  note: '',
  images: [],
})

// Queries
const { data: pondsData, isLoading: isLoadingPonds } = useQuery<IPond[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})

// Computed
const ponds = computed(() => pondsData.value || [])
const filteredPonds = computed(() => ponds.value)

// คำนวณขนาดบ่อ
const pondSize = computed(() => {
  if (pondForm.value.width && pondForm.value.length && pondForm.value.depth) {
    return `${pondForm.value.width} x ${pondForm.value.length} x ${pondForm.value.depth} เมตร`
  }
  return '-'
})

// คำนวณปริมาตรบ่อ (ลิตร)
const pondVolume = computed(() => {
  if (pondForm.value.width && pondForm.value.length && pondForm.value.depth) {
    const volumeInCubicMeters = pondForm.value.width * pondForm.value.length * pondForm.value.depth
    const volumeInLiters = volumeInCubicMeters * 1000
    return volumeInLiters.toLocaleString()
  }
  return '-'
})

// Upload mutations
const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
  mutationFn: (file: File) => pondStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename
    const VITE_API_URL = (import.meta as any).env.VITE_API_URL || ''
    const preview = `${VITE_API_URL}/erp/download/product?name=${filename}`

    pondImages.value.push({
      filename,
      type: 'image',
      preview,
    })

    pondForm.value.images = pondImages.value.map((img) => ({
      filename: img.filename,
      type: img.type,
    }))

    toast.success('อัปโหลดรูปภาพสำเร็จ')
  },
  onError: (error: any) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ')
  },
})

// Create mutation
const { mutate: createPond, isPending: isCreatingPond } = useMutation({
  mutationFn: (payload: ICreatePondPayload) => pondStore.onCreatePond(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('เพิ่มบ่อสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_ponds'] })
      closeModals()
    } else {
      toast.error(data.error.message || 'เพิ่มบ่อไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Create error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มบ่อไม่สำเร็จ')
  },
})

// Update mutation
const { mutate: updatePond, isPending: isUpdatingPond } = useMutation({
  mutationFn: (payload: IUpdatePondPayload) => pondStore.onUpdatePond(payload),
  onSuccess: (data: any) => {
    if (data.data.modifiedCount > 0) {
      toast.success('อัปเดตบ่อสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_ponds'] })
      closeModals()
    } else {
      toast.error(data.error.message || 'อัปเดตบ่อไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Update error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตบ่อไม่สำเร็จ')
  },
})

// Delete mutation
const { mutate: deletePond, isPending: isDeletingPond } = useMutation({
  mutationFn: (id: string) => pondStore.onDeletePond(id),
  onSuccess: (data: any) => {
    if (data.data.deletedCount > 0) {
      toast.success('ลบบ่อสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_ponds'] })
      closeModals()
    } else {
      toast.error(data.error.message || 'ลบบ่อไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Delete error:', error)
    toast.error(error.response?.data?.message || 'ลบบ่อไม่สำเร็จ')
  },
})

const validateFileUpload = (file: File, maxSize: number = 2000000) => {
  if (file.size > maxSize) {
    toast.error('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 2MB)')
    return false
  }

  if (!file.type.startsWith('image/')) {
    toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    return false
  }

  return true
}

const onPondImageSelect = (event: { files: File[] }) => {
  const file = event.files[0]
  if (file && validateFileUpload(file)) {
    uploadImage(file)
  }
}

const removePondImage = (index: number) => {
  pondImages.value.splice(index, 1)
  pondForm.value.images = pondImages.value.map((img) => ({
    filename: img.filename,
    type: img.type,
  }))
}

// Methods
const goBack = () => {
  router.push('/product')
}

const resetForm = () => {
  pondForm.value = {
    code: '',
    name: '',
    width: 0,
    length: 0,
    depth: 0,
    note: '',
    images: [],
  }
  pondImages.value = []
}

const openAddPond = () => {
  resetForm()
  showAddPond.value = true
}

const openEditPond = (pond: IPond) => {
  selectedPond.value = pond
  pondForm.value = {
    code: pond.code,
    name: pond.name,
    width: pond.width || 0,
    length: pond.length || 0,
    depth: pond.depth || 0,
    note: pond.note || '',
    images: [...pond.images],
  }
  // Load images
  if (pond.images && pond.images.length > 0) {
    const VITE_API_URL = (import.meta as any).env.VITE_API_URL || ''
    pondImages.value = pond.images.map((img) => ({
      filename: img.filename,
      type: img.type,
      preview: `${VITE_API_URL}/erp/download/product?name=${img.filename}`,
    }))
  } else {
    pondImages.value = []
  }
  showEditPond.value = true
}

const openDeleteModal = (pond: IPond) => {
  selectedPond.value = pond
  showDeleteModal.value = true
}

const closeModals = () => {
  showAddPond.value = false
  showEditPond.value = false
  showDeleteModal.value = false
  selectedPond.value = null
  resetForm()
}

const validateForm = () => {
  if (!pondForm.value.code.trim()) {
    toast.error('กรุณากรอกรหัสบ่อ')
    return false
  }
  if (!pondForm.value.name.trim()) {
    toast.error('กรุณากรอกชื่อกรีนเฮ้า')
    return false
  }
  if (!pondForm.value.width || pondForm.value.width <= 0) {
    toast.error('กรุณากรอกความกว้างที่ถูกต้อง')
    return false
  }
  if (!pondForm.value.length || pondForm.value.length <= 0) {
    toast.error('กรุณากรอกความยาวที่ถูกต้อง')
    return false
  }
  if (!pondForm.value.depth || pondForm.value.depth <= 0) {
    toast.error('กรุณากรอกความลึกที่ถูกต้อง')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) return

  const payload = {
    code: pondForm.value.code,
    name: pondForm.value.name,
    width: pondForm.value.width,
    length: pondForm.value.length,
    depth: pondForm.value.depth,
    note: pondForm.value.note,
    images: pondForm.value.images,
  }

  if (showAddPond.value) {
    createPond(payload)
  } else if (showEditPond.value && selectedPond.value) {
    updatePond({
      _id: selectedPond.value._id,
      active: selectedPond.value.active,
      ...payload,
    })
  }
}

const handleDeletePond = () => {
  if (!selectedPond.value) return
  deletePond(selectedPond.value._id)
}

const getImageUrl = (filename: string) => {
  const VITE_API_URL = (import.meta as any).env.VITE_API_URL || ''
  return `${VITE_API_URL}/erp/download/product?name=${filename}`
}

const isSubmitting = computed(() => isCreatingPond.value || isUpdatingPond.value)
</script>

<template>
  <div class="flex items-center justify-between flex-wrap gap-2">
    <div>
      <h1 class="text-xl font-semibold! text-gray-900">ตั้งค่าบ่อปลาคาร์ฟ</h1>
      <p class="text-gray-600">จัดการข้อมูลบ่อปลา</p>
    </div>
  </div>

  <div class="space-y-4 mt-4">
    <!-- Stats Card -->
    <!-- <div class="bg-white border border-gray-200 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
          <i class="pi pi-water text-white text-xl"></i>
        </div>
        <div>
          <p class="text-sm text-gray-600">จำนวนบ่อทั้งหมด</p>
          <p class="text-2xl font-bold text-blue-600">{{ filteredPonds.length }}</p>
        </div>
      </div>
    </div> -->

    <!-- Pond Table -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm px-2">
      <div class="py-4 px-2 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold! text-gray-800">รายการบ่อปลา</h3>

        <div class="flex items-center gap-2">
          <Button
            label="เพิ่มบ่อใหม่"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="openAddPond"
          />
          <Button
            label="กลับ"
            icon="pi pi-angle-left"
            severity="contrast"
            size="small"
            @click="goBack"
          />
        </div>
      </div>

      <DataTable
        :value="filteredPonds"
        :loading="isLoadingPonds"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        :pt="{
          table: '!text-sm',
          header: '!text-sm font-semibold! text-gray-800',
          body: '!text-sm text-gray-700',
          cell: '!text-sm text-gray-700',
          columnHeader: '!text-sm font-semibold! text-gray-800',
          row: '!text-sm text-gray-700',
          rowGroup: '!text-sm text-gray-700',
          rowGroupHeader: '!text-sm font-semibold! text-gray-800',
          rowGroupFooter: '!text-sm font-semibold! text-gray-800',
        }"
      >
        <Column field="code" header="รหัสบ่อ" sortable>
          <template #body="{ data }">
            <div>
              <span class="font-medium text-gray-900">{{ data.code }}</span>
            </div>
          </template>
        </Column>

        <Column field="name" header="ชื่อกรีนเฮ้า" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="size" header="ขนาดบ่อ (กว้างxยาวxลึก)" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">
              {{
                data.width && data.length && data.depth
                  ? `${data.width} x ${data.length} x ${data.depth} เมตร`
                  : '-'
              }}
            </span>
          </template>
        </Column>

        <Column field="volume" header="ปริมาตรบ่อ (ลิตร)" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{
              data.width && data.length && data.depth
                ? (data.width * data.length * data.depth * 1000).toLocaleString()
                : '-'
            }}</span>
          </template>
        </Column>

        <Column header="รูปภาพ">
          <template #body="{ data }">
            <div v-if="data.images && data.images.length > 0" class="flex gap-2">
              <img
                v-for="(img, idx) in data.images"
                :key="idx"
                :src="getImageUrl(img.filename)"
                alt="Pond image"
                class="w-auto h-10 object-contain rounded"
              />
            </div>
            <span v-else class="text-gray-400">ไม่มีรูปภาพ</span>
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
                @click="openEditPond(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                rounded
                @click="openDeleteModal(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <!-- Add/Edit Pond Modal -->
  <Dialog
    :visible="showAddPond || showEditPond"
    @update:visible="closeModals"
    modal
    :style="{ width: '40rem' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-water text-white"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800">
            {{ showAddPond ? 'เพิ่มบ่อใหม่' : 'แก้ไขข้อมูลบ่อ' }}
          </h3>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Code & Name -->
      <div class="grid grid-cols-1 gap-3">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">
            ชื่อกรีนเฮ้า <span class="text-red-500">*</span>
          </label>
          <InputText v-model="pondForm.name" placeholder="เช่น บ่อ A" class="w-full" />
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">
            รหัสบ่อ <span class="text-red-500">*</span>
          </label>
          <InputText v-model="pondForm.code" placeholder="เช่น P001" class="w-full" />
        </div>



        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">
            ความกว้าง (เมตร) <span class="text-red-500">*</span>
          </label>
          <InputNumber v-model="pondForm.width" :minFractionDigits="2" placeholder="เช่น 2" fluid :min="0" />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">
            ความยาว (เมตร) <span class="text-red-500">*</span>
          </label>
          <InputNumber v-model="pondForm.length" :minFractionDigits="2" placeholder="เช่น 3" fluid :min="0" />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">
            ความลึก (เมตร) <span class="text-red-500">*</span>
          </label>
          <InputNumber v-model="pondForm.depth" :minFractionDigits="2" placeholder="เช่น 1.5" fluid :min="0" />
        </div>

        <!-- แสดงขนาดบ่อที่คำนวณได้ -->
        <div
          v-if="pondForm.width && pondForm.length && pondForm.depth"
          class="bg-blue-50 border border-blue-200 rounded-lg p-3"
        >
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-calculator text-blue-600"></i>
            <span class="text-sm font-medium text-blue-800">ขนาดบ่อที่คำนวณได้</span>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">ขนาดบ่อ:</span>
              <span class="font-medium text-gray-900">{{ pondSize }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">ปริมาตรบ่อ:</span>
              <span class="font-medium text-gray-900">{{ pondVolume }} ลิตร</span>
            </div>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"> หมายเหตุ </label>
          <Textarea rows="3" fluid v-model="pondForm.note" placeholder="หมายเหตุเพิ่มเติม" />
        </div>
      </div>

      <!-- Images -->
      <div>
        <label class="text-sm font-medium text-gray-700 mb-2 block"> รูปภาพบ่อ </label>

        <div v-if="pondImages.length > 0" class="grid grid-cols-3 gap-2 mb-3">
          <div v-for="(image, index) in pondImages" :key="index" class="relative">
            <img
              :src="image.preview"
              alt="Pond image"
              class="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
            <Button
              icon="pi pi-times"
              severity="danger"
              size="small"
              text
              rounded
              class="absolute top-1 right-1"
              @click="removePondImage(index)"
            />
          </div>
        </div>

        <FileUpload
          mode="basic"
          name="pondImage"
          accept="image/*"
          :maxFileSize="2000000"
          @select="onPondImageSelect"
          :chooseLabel="isUploadingImage ? 'กำลังอัปโหลด...' : 'เพิ่มรูปภาพ'"
          :disabled="isUploadingImage"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button
          label="ยกเลิก"
          severity="secondary"
          @click="closeModals"
          size="small"
          :disabled="isSubmitting"
        />
        <Button
          :label="showAddPond ? 'เพิ่มบ่อ' : 'บันทึก'"
          :loading="isSubmitting"
          @click="handleSubmit"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Delete Confirmation Modal -->
  <Dialog
    :visible="showDeleteModal"
    @update:visible="closeModals"
    modal
    :style="{ width: '32rem' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-trash text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ยืนยันการลบบ่อ</h3>
        </div>
      </div>
    </template>

    <div v-if="selectedPond" class="space-y-3">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
        <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบบ่อนี้?</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-3 space-y-1">
        <div class="flex justify-between">
          <span class="text-gray-600">รหัสบ่อ:</span>
          <span class="font-medium text-gray-900">{{ selectedPond.code }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ชื่อกรีนเฮ้า:</span>
          <span class="font-medium text-gray-900">{{ selectedPond.name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ขนาดบ่อ:</span>
          <span class="font-medium text-gray-900">
            {{
              selectedPond.width && selectedPond.length && selectedPond.depth
                ? `${selectedPond.width} x ${selectedPond.length} x ${selectedPond.depth} เมตร`
                : '-'
            }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ปริมาตรบ่อ:</span>
          <span class="font-medium text-gray-900">{{
            selectedPond.width && selectedPond.length && selectedPond.depth
              ? (
                  selectedPond.width *
                  selectedPond.length *
                  selectedPond.depth *
                  1000
                ).toLocaleString() + ' ลิตร'
              : '-'
          }}</span>
        </div>
        <div v-if="selectedPond.note" class="flex justify-between">
          <span class="text-gray-600">หมายเหตุ:</span>
          <span class="font-medium text-gray-900">{{ selectedPond.note }}</span>
        </div>
      </div>
      <p class="text-sm text-red-600">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="closeModals"
          severity="secondary"
          size="small"
          :disabled="isDeletingPond"
        />
        <Button
          label="ลบบ่อ"
          icon="pi pi-trash"
          @click="handleDeletePond"
          severity="danger"
          size="small"
          :loading="isDeletingPond"
        />
      </div>
    </template>
  </Dialog>
</template>
