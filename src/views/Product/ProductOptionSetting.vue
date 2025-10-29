<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Button,
  InputText,
  InputNumber,
  DataTable,
  Column,
  Dialog,
  FileUpload,
  Textarea,
  Tag,
  Card,
} from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  usePondStore,
  type IPond,
  type ICreatePondPayload,
  type IUpdatePondPayload,
} from '../../stores/product/pond'
import {
  useSpeciesStore,
  type ISpecies,
  type ICreateSpeciesPayload,
  type IUpdateSpeciesPayload,
} from '../../stores/product/species'

// Types
interface ISettingCategory {
  id: string
  name: string
  icon: string
  color: string
  description: string
  component: string
}

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

// Constants
const VITE_API_URL = ''

// Router & Stores
const router = useRouter()
const pondStore = usePondStore()
const speciesStore = useSpeciesStore()
const queryClient = useQueryClient()

// Data
const activeCategory = ref<string>('species')
const showModal = ref(false)
const modalType = ref<'add' | 'edit' | 'delete'>('add')
const selectedItem = ref<ISpecies | IPond | null>(null)

// Form data
const speciesForm = ref<ICreateSpeciesPayload>({
  name: '',
  detail: '',
})

const pondForm = ref<ICreatePondPayload>({
  code: '',
  name: '',
  width: 0,
  length: 0,
  depth: 0,
  note: '',
  images: [],
})

const pondImages = ref<IPondImage[]>([])

// Setting categories
const settingCategories = ref<ISettingCategory[]>([
  {
    id: 'species',
    name: 'สายพันธุ์ปลา',
    icon: 'pi pi-star',
    color: 'from-blue-500 to-cyan-600',
    description: 'จัดการสายพันธุ์ปลาคาร์ฟ',
    component: 'species',
  },
  {
    id: 'greenhouse',
    name: 'กรีนเฮ้า',
    icon: 'pi pi-sun',
    color: 'from-yellow-500 to-orange-600',
    description: 'จัดการกรีนเฮ้า',
    component: 'greenhouse',
  },
  {
    id: 'pond',
    name: 'บ่อปลา',
    icon: 'pi pi-inbox',
    color: 'from-green-500 to-emerald-600',
    description: 'จัดการบ่อปลาและกรีนเฮ้า',
    component: 'pond',
  },
  {
    id: 'farm',
    name: 'ฟาร์ม',
    icon: 'pi pi-home',
    color: 'from-orange-500 to-red-600',
    description: 'จัดการข้อมูลฟาร์ม',
    component: 'farm',
  },
])

// Queries
const { data: speciesData, isLoading: isLoadingSpecies } = useQuery<ISpecies[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})

const { data: pondsData, isLoading: isLoadingPonds } = useQuery<IPond[]>({
  queryKey: ['get_ponds'],
  queryFn: () => pondStore.onGetPonds(),
})

// Computed
const species = computed(() => speciesData.value || [])
const ponds = computed(() => pondsData.value || [])

const currentData = computed(() => {
  switch (activeCategory.value) {
    case 'species':
      return species.value
    case 'pond':
      return ponds.value
    default:
      return []
  }
})

const isLoading = computed(() => {
  switch (activeCategory.value) {
    case 'species':
      return isLoadingSpecies.value
    case 'pond':
      return isLoadingPonds.value
    default:
      return false
  }
})

const currentCategory = computed(() => {
  return settingCategories.value.find((cat) => cat.id === activeCategory.value)
})

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

// Species mutations
const { mutate: createSpecies, isPending: isCreatingSpecies } = useMutation({
  mutationFn: (payload: ICreateSpeciesPayload) => speciesStore.onCreateSpecies(payload),
  onSuccess: (data: IApiResponse) => {
    if (data.data) {
      toast.success('เพิ่มสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'เพิ่มสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Create species error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มสายพันธุ์ไม่สำเร็จ')
  },
})

const { mutate: updateSpecies, isPending: isUpdatingSpecies } = useMutation({
  mutationFn: (payload: IUpdateSpeciesPayload) => speciesStore.onUpdateSpecies(payload),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'modifiedCount' in data.data &&
      (data.data as { modifiedCount: number }).modifiedCount > 0
    ) {
      toast.success('อัปเดตสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'อัปเดตสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Update species error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตสายพันธุ์ไม่สำเร็จ')
  },
})

const { mutate: deleteSpecies, isPending: isDeletingSpecies } = useMutation({
  mutationFn: (speciesId: string) => speciesStore.onDeleteProduct(speciesId),
  onSuccess: (data: IApiResponse) => {
    if (
      data.data &&
      typeof data.data === 'object' &&
      'deletedCount' in data.data &&
      (data.data as { deletedCount: number }).deletedCount > 0
    ) {
      toast.success('ลบสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModal()
    } else {
      toast.error(data.error?.message || 'ลบสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: IErrorResponse) => {
    console.error('Delete species error:', error)
    toast.error(error.response?.data?.message || 'ลบสายพันธุ์ไม่สำเร็จ')
  },
})

// Pond mutations
const { mutate: uploadImage, isPending: isUploadingImage } = useMutation({
  mutationFn: (file: File) => pondStore.onUploadImage(file),
  onSuccess: (data: IUploadImageResponse) => {
    const filename = data.filename
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
  onError: (error: IErrorResponse) => {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'อัปโหลดรูปภาพไม่สำเร็จ')
  },
})

const { mutate: createPond, isPending: isCreatingPond } = useMutation({
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

const { mutate: updatePond, isPending: isUpdatingPond } = useMutation({
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

const { mutate: deletePond, isPending: isDeletingPond } = useMutation({
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

// Methods
const goBack = () => {
  router.push('/product')
}

const setActiveCategory = (categoryId: string) => {
  activeCategory.value = categoryId
  closeModal()
}

const resetForms = () => {
  speciesForm.value = {
    name: '',
    detail: '',
  }

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

const openModal = (type: 'add' | 'edit' | 'delete', item?: ISpecies | IPond) => {
  modalType.value = type
  selectedItem.value = item || null

  if (type === 'add') {
    resetForms()
  } else if (type === 'edit' && item) {
    if (activeCategory.value === 'species' && 'detail' in item) {
      speciesForm.value = {
        name: item.name,
        detail: item.detail,
      }
    } else if (activeCategory.value === 'pond' && 'code' in item) {
      pondForm.value = {
        code: item.code,
        name: item.name,
        width: item.width || 0,
        length: item.length || 0,
        depth: item.depth || 0,
        note: item.note || '',
        images: [...item.images],
      }

      // Load images
      if (item.images && item.images.length > 0) {
        pondImages.value = item.images.map((img: { filename: string; type: string }) => ({
          filename: img.filename,
          type: img.type,
          preview: `${VITE_API_URL}/erp/download/product?name=${img.filename}`,
        }))
      } else {
        pondImages.value = []
      }
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = 'add'
  selectedItem.value = null
  resetForms()
}

const validateSpeciesForm = () => {
  if (!speciesForm.value.name.trim()) {
    toast.error('กรุณากรอกชื่อสายพันธุ์')
    return false
  }
  if (!speciesForm.value.detail.trim()) {
    toast.error('กรุณากรอกรายละเอียดสายพันธุ์')
    return false
  }
  return true
}

const validatePondForm = () => {
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
  if (activeCategory.value === 'species') {
    if (!validateSpeciesForm()) return

    const payload = {
      name: speciesForm.value.name.trim(),
      detail: speciesForm.value.detail.trim(),
    }

    if (modalType.value === 'add') {
      createSpecies(payload)
    } else if (modalType.value === 'edit' && selectedItem.value && 'detail' in selectedItem.value) {
      updateSpecies({
        _id: selectedItem.value._id,
        name: payload.name,
        detail: payload.detail,
        active: selectedItem.value.active,
        cat: selectedItem.value.cat,
        uat: selectedItem.value.uat,
      })
    }
  } else if (activeCategory.value === 'pond') {
    if (!validatePondForm()) return

    const payload = {
      code: pondForm.value.code,
      name: pondForm.value.name,
      width: Number(pondForm.value.width),
      length: Number(pondForm.value.length),
      depth: Number(pondForm.value.depth),
      note: pondForm.value.note,
      images: pondForm.value.images,
    }

    if (modalType.value === 'add') {
      createPond(payload)
    } else if (modalType.value === 'edit' && selectedItem.value && 'code' in selectedItem.value) {
      updatePond({
        _id: selectedItem.value._id,
        active: selectedItem.value.active,
        ...payload,
      })
    }
  }
}

const handleDelete = () => {
  if (!selectedItem.value) return

  if (activeCategory.value === 'species') {
    deleteSpecies(selectedItem.value._id)
  } else if (activeCategory.value === 'pond') {
    deletePond(selectedItem.value._id)
  }
}

const toggleSpeciesStatus = (species: ISpecies) => {
  updateSpecies({
    _id: species._id,
    name: species.name,
    detail: species.detail,
    active: !species.active,
    cat: species.cat,
    uat: species.uat,
  })
}

const getStatusTag = (active: boolean) => {
  return active
    ? { label: 'เปิดใช้งาน', severity: 'success' }
    : { label: 'ปิดใช้งาน', severity: 'danger' }
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
  pondForm.value.images = pondImages.value.map((img) => ({
    filename: img.filename,
    type: img.type,
  }))
}

const getImageUrl = (filename: string) => {
  return `${VITE_API_URL}/erp/download/product?name=${filename}`
}

const isSubmitting = computed(() => {
  switch (activeCategory.value) {
    case 'species':
      return isCreatingSpecies.value || isUpdatingSpecies.value || isDeletingSpecies.value
    case 'pond':
      return isCreatingPond.value || isUpdatingPond.value || isDeletingPond.value
    default:
      return false
  }
})

const getModalTitle = () => {
  const categoryName = currentCategory.value?.name || ''
  switch (modalType.value) {
    case 'add':
      return `เพิ่ม${categoryName}ใหม่`
    case 'edit':
      return `แก้ไข${categoryName}`
    case 'delete':
      return `ยืนยันการลบ${categoryName}`
    default:
      return ''
  }
}

const getModalIcon = () => {
  return currentCategory.value?.icon || 'pi pi-cog'
}

const getModalColor = () => {
  return currentCategory.value?.color || 'from-gray-500 to-gray-600'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-xl font-semibold! text-gray-900">ตั้งค่าผลิตภัณฑ์</h1>
        <p class="text-gray-600">จัดการการตั้งค่าต่างๆ ของระบบผลิตภัณฑ์</p>
      </div>
      <Button
        label="กลับ"
        icon="pi pi-angle-left"
        severity="contrast"
        size="small"
        @click="goBack"
      />
    </div>

    <!-- Category Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
      <Card
        v-for="category in settingCategories"
        :key="category.id"
        :class="[
          'cursor-pointer transition-all duration-200 hover:shadow-lg ',
          activeCategory === category.id ? 'ring-2 ring-blue-400 shadow-lg' : 'hover:shadow-md',
        ]"
        @click="setActiveCategory(category.id)"
      >
        <template #content>
          <div class="text-center">
            <div
              :class="[
                'w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center bg-gradient-to-r',
                category.color,
              ]"
            >
              <i :class="[category.icon, 'text-white text-xl']"></i>
            </div>
            <h3 class="font-semibold! text-sm text-gray-900">{{ category.name }}</h3>
            <p class="text-xs text-gray-600">{{ category.description }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Content Area -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <!-- Content Header -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r',
                currentCategory?.color,
              ]"
            >
              <i :class="[currentCategory?.icon, 'text-white text-xl']"></i>
            </div>
            <div>
              <h2 class="font-semibold! text-gray-900">{{ currentCategory?.name }}</h2>
              <p class="text-gray-600 text-sm">{{ currentCategory?.description }}</p>
            </div>
          </div>
          <Button
            :label="`เพิ่ม${currentCategory?.name}`"
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
          :value="currentData"
          :loading="isLoading"
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
          <!-- Species Columns -->
          <template v-if="activeCategory === 'species'">
            <Column field="name" header="ชื่อสายพันธุ์" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i class="pi pi-star text-blue-500 text-sm"></i>
                  <span class="font-medium text-gray-900">{{ data.name }}</span>
                </div>
              </template>
            </Column>

            <Column field="detail" header="รายละเอียด" sortable>
              <template #body="{ data }">
                <span class="text-gray-700">{{ data.detail }}</span>
              </template>
            </Column>

            <Column field="active" header="สถานะ" sortable>
              <template #body="{ data }">
                <Tag
                  :value="getStatusTag(data.active).label"
                  :severity="getStatusTag(data.active).severity"
                  size="small"
                />
              </template>
            </Column>
          </template>

          <!-- Pond Columns -->
          <template v-if="activeCategory === 'pond'">
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
          </template>

          <!-- Action Column -->
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
                  v-if="activeCategory === 'species'"
                  :icon="data.active ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  size="small"
                  :severity="data.active ? 'warning' : 'success'"
                  text
                  rounded
                  @click="toggleSpeciesStatus(data)"
                  v-tooltip.top="data.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
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
    </div>

    <!-- Universal Modal -->
    <Dialog
      :visible="showModal"
      @update:visible="closeModal"
      modal
      :style="{ width: modalType === 'delete' ? '32rem' : '40rem' }"
      :pt="{
        header: 'p-4',
        title: 'text-lg font-semibold!',
      }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r',
              getModalColor(),
            ]"
          >
            <i :class="[getModalIcon(), 'text-white']"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-800">
              {{ getModalTitle() }}
            </h3>
          </div>
        </div>
      </template>

      <!-- Add/Edit Species Form -->
      <div v-if="activeCategory === 'species' && modalType !== 'delete'" class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ชื่อสายพันธุ์ <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="speciesForm.name"
              placeholder="เช่น ปลาคาร์ฟโคฮากุ"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              รายละเอียด <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="speciesForm.detail"
              placeholder="รายละเอียดเกี่ยวกับสายพันธุ์"
              class="w-full"
              autocomplete="off"
            />
          </div>
        </div>
      </div>

      <!-- Add/Edit Pond Form -->
      <div v-if="activeCategory === 'pond' && modalType !== 'delete'" class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              ชื่อกรีนเฮ้า <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="pondForm.name"
              placeholder="เช่น บ่อ A"
              class="w-full"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              รหัสบ่อ <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="pondForm.code"
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
              v-model="pondForm.width"
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
              v-model="pondForm.length"
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
              v-model="pondForm.depth"
              :minFractionDigits="2"
              placeholder="เช่น 1.5"
              fluid
              :min="0"
              autocomplete="off"
            />
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
            <label class="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Textarea
              rows="3"
              fluid
              v-model="pondForm.note"
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

      <!-- Delete Confirmation -->
      <div v-if="modalType === 'delete' && selectedItem" class="space-y-3">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
          <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบรายการนี้?</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 space-y-1">
          <div v-if="activeCategory === 'species' && 'detail' in selectedItem" class="space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อสายพันธุ์:</span>
              <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">รายละเอียด:</span>
              <span class="font-medium text-gray-900">{{ selectedItem.detail }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">สถานะ:</span>
              <Tag
                :value="getStatusTag(selectedItem.active).label"
                :severity="getStatusTag(selectedItem.active).severity"
                size="small"
              />
            </div>
          </div>
          <div v-if="activeCategory === 'pond' && 'code' in selectedItem" class="space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-600">รหัสบ่อ:</span>
              <span class="font-medium text-gray-900">{{ selectedItem.code }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อกรีนเฮ้า:</span>
              <span class="font-medium text-gray-900">{{ selectedItem.name }}</span>
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
