<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Button,
  InputText,
  InputNumber,
  DataTable,
  Column,
  Dialog,
  FileUpload,
  Textarea,
  Select,
} from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  usePondStore,
  type IPond,
  type ICreatePondPayload,
  type IUpdatePondPayload,
} from '../../../stores/product/pond'
import { useGreenhouseStore, type IGreenhouse } from '../../../stores/product/greenhouse'

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

const getApiUrl = (): string => {
  // @ts-ignore - Vite provides import.meta.env at build time
  return import.meta.env?.VITE_API_URL || ''
}

const pondStore = usePondStore()
const greenhouseStore = useGreenhouseStore()
const queryClient = useQueryClient()

const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<IPond | null>(null)

const form = ref<ICreatePondPayload>({
  name: '',
  greenhouse: '',
  code: '',
  width: 0,
  length: 0,
  depth: 0,
  note: '',
  images: [],
})

const pondImages = ref<IPondImage[]>([])

const { data: pondsData, isLoading } = useQuery<IPond[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})

const { data: greenhousesData } = useQuery<IGreenhouse[]>({
  queryKey: ['get_greenhouses'],
  queryFn: () => greenhouseStore.onGetGreenhouses(),
})

const ponds = computed(() => pondsData.value || [])
const greenhouses = computed(() => greenhousesData.value || [])

const pondSize = computed(() => {
  if (form.value.width && form.value.length && form.value.depth) {
    return `${form.value.width} x ${form.value.length} x ${form.value.depth} เมตร`
  }
  return '-'
})

const pondVolume = computed(() => {
  if (form.value.width && form.value.length && form.value.depth) {
    const volumeInCubicMeters = form.value.width * form.value.length * form.value.depth
    const volumeInLiters = volumeInCubicMeters * 1000
    return volumeInLiters.toLocaleString()
  }
  return '-'
})

const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
  mutationFn: (file: File) => pondStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename
    const preview = `${getApiUrl()}/erp/download/product?name=${filename}`

    pondImages.value.push({
      filename,
      type: 'image',
      preview,
    })

    form.value.images = pondImages.value.map((img) => ({
      filename: img.filename,
      type: img.type,
    }))

    toast.success('อัปโหลดรูปภาพสำเร็จ')
  },
  onError: (error: IErrorResponse) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ')
  },
})

const { mutate: create, isPending: isCreating } = useMutation({
  mutationFn: (payload: ICreatePondPayload) => pondStore.onCreatePond(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มบ่อสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_ponds'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มบ่อไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create pond error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มบ่อไม่สำเร็จ')
  },
})

const { mutate: update, isPending: isUpdating } = useMutation({
  mutationFn: (payload: IUpdatePondPayload) => pondStore.onUpdatePond(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตบ่อสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_ponds'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตบ่อไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update pond error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตบ่อไม่สำเร็จ')
  },
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationFn: (id: string) => pondStore.onDeletePond(id),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบบ่อสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_ponds'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบบ่อไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete pond error:', error)
    toast.error(error.response?.data?.message || 'ลบบ่อไม่สำเร็จ')
  },
})

const openModal = (type: 'add' | 'edit' | 'delete', item?: IPond) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    resetForm()
  } else if (type === 'edit' && item) {
    form.value = {
      name: item.name || '',
      greenhouse: item.greenhouse?._id || '',
      code: item.code,
      width: item.width || 0,
      length: item.length || 0,
      depth: item.depth || 0,
      note: item.note || '',
      images: [...item.images],
    }

    if (item.images && item.images.length > 0) {
      const apiUrl = getApiUrl()
      pondImages.value = item.images.map((img: { filename: string; type: string }) => ({
        filename: img.filename,
        type: img.type,
        preview: `${apiUrl}/erp/download/product?name=${img.filename}`,
      }))
    } else {
      pondImages.value = []
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  resetForm()
}

const resetForm = () => {
  form.value = {
    name: '',
    greenhouse: '',
    code: '',
    width: 0,
    length: 0,
    depth: 0,
    note: '',
    images: [],
  }
  pondImages.value = []
}

const validate = () => {
  if (!form.value.greenhouse.trim()) {
    toast.error('กรุณาเลือกกรีนเฮ้า')
    return false
  }
  if (!form.value.code.trim()) {
    toast.error('กรุณากรอกรหัสบ่อ')
    return false
  }
  if (!form.value.width || form.value.width <= 0) {
    toast.error('กรุณากรอกความกว้างที่ถูกต้อง')
    return false
  }
  if (!form.value.length || form.value.length <= 0) {
    toast.error('กรุณากรอกความยาวที่ถูกต้อง')
    return false
  }
  if (!form.value.depth || form.value.depth <= 0) {
    toast.error('กรุณากรอกความลึกที่ถูกต้อง')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validate()) return

  const payload: ICreatePondPayload = {
    name: `${greenhouses.value.find((g) => g._id === form.value.greenhouse)?.name || ''} - ${form.value.code}`,
    greenhouse: form.value.greenhouse,
    code: form.value.code,
    width: Number(form.value.width),
    length: Number(form.value.length),
    depth: Number(form.value.depth),
    note: form.value.note,
    images: form.value.images,
  }

  if (modalType.value === 'add') {
    create(payload)
  } else if (modalType.value === 'edit' && selectedItem.value) {
    update({
      _id: selectedItem.value._id,
      active: selectedItem.value.active,
      ...payload,
    })
  }
}

const handleDelete = () => {
  if (selectedItem.value) {
    remove(selectedItem.value._id)
  }
}

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
  form.value.images = pondImages.value.map((img) => ({
    filename: img.filename,
    type: img.type,
  }))
}

const getImageUrl = (filename: string) => {
  return `${getApiUrl()}/erp/download/product?name=${filename}`
}

const isSubmitting = computed(() => isCreating.value || isUpdating.value || isDeleting.value)

const getModalTitle = () => {
  switch (modalType.value) {
    case 'add':
      return 'เพิ่มบ่อปลาใหม่'
    case 'edit':
      return 'แก้ไขบ่อปลา'
    case 'delete':
      return 'ยืนยันการลบบ่อปลา'
    default:
      return ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Content Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600"
          >
            <i class="pi pi-inbox text-white text-xl"></i>
          </div>
          <div>
            <h2 class="font-semibold! text-gray-900">บ่อปลา</h2>
            <p class="text-gray-600 text-sm">จัดการบ่อปลาและกรีนเฮ้า</p>
          </div>
        </div>
        <Button
          label="เพิ่มบ่อปลา"
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
        :value="ponds"
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
      >
        <Column field="code" header="รหัสบ่อ" sortable>
          <template #body="{ data }">
            <span class="font-medium text-gray-900">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="greenhouse.name" header="ชื่อกรีนเฮ้า" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.greenhouse?.name || '-' }}</span>
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
                :src="getImageUrl(data.images[0].filename)"
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
            <i class="pi pi-inbox text-white"></i>
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
              ชื่อกรีนเฮ้า <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="form.greenhouse"
              :options="greenhouses.map((g) => ({ label: g.name, value: g._id }))"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกกรีนเฮ้า"
              fluid
              size="small"
              :invalid="!form.greenhouse && isSubmitting"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              รหัสบ่อ <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="form.code"
              placeholder="เช่น P001"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ความกว้าง (เมตร) <span class="text-red-500">*</span>
            </label>
            <InputNumber
              v-model="form.width"
              :minFractionDigits="2"
              placeholder="เช่น 2"
              fluid
              :min="0"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ความยาว (เมตร) <span class="text-red-500">*</span>
            </label>
            <InputNumber
              v-model="form.length"
              :minFractionDigits="2"
              placeholder="เช่น 3"
              fluid
              :min="0"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ความลึก (เมตร) <span class="text-red-500">*</span>
            </label>
            <InputNumber
              v-model="form.depth"
              :minFractionDigits="2"
              placeholder="เช่น 1.5"
              fluid
              :min="0"
              autocomplete="off"
            />
          </div>

          <div
            v-if="form.width && form.length && form.depth"
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
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea
              rows="3"
              fluid
              v-model="form.note"
              placeholder="หมายเหตุเพิ่มเติม"
              autocomplete="off"
            />
          </div>
        </div>

        <!-- Images -->
        <div>
          <label class="text-sm font-medium text-gray-700 mb-2 block">รูปภาพบ่อ</label>
          <div v-if="pondImages.length > 0" class="grid grid-cols-3 gap-2 mb-3">
            <div v-for="(image, index) in pondImages" :key="index" class="relative">
              <img
                :src="image.preview"
                alt="Pond image"
                class="w-auto h-46 object-contain rounded-lg border border-gray-200"
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

      <!-- Delete Confirmation -->
      <div v-if="modalType === 'delete' && selectedItem" class="space-y-3">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
          <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">รหัสบ่อ:</span>
            <span class="font-medium text-gray-900">{{ selectedItem.code }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">ชื่อกรีนเฮ้า:</span>
            <span class="font-medium text-gray-900">{{
              selectedItem.greenhouse?.name || '-'
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">ขนาดบ่อ:</span>
            <span class="font-medium text-gray-900">
              {{
                selectedItem.width && selectedItem.length && selectedItem.depth
                  ? `${selectedItem.width} x ${selectedItem.length} x ${selectedItem.depth} เมตร`
                  : '-'
              }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">ปริมาตรบ่อ:</span>
            <span class="font-medium text-gray-900">{{
              selectedItem.width && selectedItem.length && selectedItem.depth
                ? (
                    selectedItem.width *
                    selectedItem.length *
                    selectedItem.depth *
                    1000
                  ).toLocaleString() + ' ลิตร'
                : '-'
            }}</span>
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

